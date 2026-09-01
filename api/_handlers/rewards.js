const { randomUUID } = require('node:crypto');
const { withDatabaseTransaction } = require('../_lib/db');
const { bangkokDateKey } = require('../_lib/dailyPeriod');
const { atomicUsdc, allocatePrizePool, formatAtomic, readTreasuryBalanceAtomic, shouldSettle, REWARD_WALLET, REWARD_MINT, DAILY_POOL_USDC, SETTLEMENT_THRESHOLD_USDC, MIN_WINNERS } = require('../_lib/rewards');
const { transferUsdc } = require('../_lib/rewardTransfers');
const FEE_WALLET = process.env.DFLOW_PLATFORM_FEE_ACCOUNT || null;
const FUNDING_SOURCE = ['FEE_ACCRUED', 'SEEDED_MANUAL', 'MIXED', 'UNKNOWN'].includes(process.env.REWARD_FUNDING_SOURCE) ? process.env.REWARD_FUNDING_SOURCE : 'SEEDED_MANUAL';

function respond(response, status, body) { return response.status(status).json(body); }
function authorized(request) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '') || request.headers['x-rewards-admin-token'];
  return Boolean(token && ((process.env.REWARDS_ADMIN_TOKEN && token === process.env.REWARDS_ADMIN_TOKEN) || (process.env.CRON_SECRET && token === process.env.CRON_SECRET)));
}
async function accrueCompletedShifts(client, poolAtomic) {
  const shifts = (await client.query(`SELECT id, shift_key FROM daily_shifts WHERE status='COMPLETE' ORDER BY shift_key ASC`)).rows;
  let awardsCreated = 0;
  for (const shift of shifts) {
    const winners = (await client.query(
      `SELECT r.agent_id, a.owner_wallet AS player_wallet, r.final_rank AS rank, r.crazy_score AS points
       FROM daily_shift_results r JOIN agents a ON a.id=r.agent_id
       WHERE r.shift_id=$1 AND r.final_rank <= 3 AND r.crazy_score > 0
       ORDER BY r.final_rank ASC, r.crazy_score DESC, r.agent_id ASC`, [shift.id]
    )).rows;
    if (winners.length < MIN_WINNERS) continue;
    for (const award of allocatePrizePool(poolAtomic, winners)) {
      const inserted = await client.query(
        `INSERT INTO daily_reward_awards (id,shift_id,agent_id,player_wallet,rank,pool_amount_atomic,award_amount_atomic)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (shift_id,agent_id,rank) DO NOTHING RETURNING id`,
        [randomUUID(), shift.id, award.agent_id, award.player_wallet, award.rank, poolAtomic.toString(), award.amountAtomic.toString()]
      );
      if (inserted.rowCount) {
        awardsCreated += 1;
        await client.query(
          `INSERT INTO reward_balances (player_wallet,accrued_atomic,unpaid_atomic)
           VALUES ($1,$2,$2) ON CONFLICT (player_wallet) DO UPDATE
           SET accrued_atomic=reward_balances.accrued_atomic+$2, unpaid_atomic=reward_balances.unpaid_atomic+$2, updated_at=now()`,
          [award.player_wallet, award.amountAtomic.toString()]
        );
      }
    }
  }
  return awardsCreated;
}

async function accrueStandardPeriods(client, poolAtomic) {
  const periods = (await client.query(`SELECT DISTINCT competition_period, environment FROM standard_game_results WHERE competition_period < (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok')::date ORDER BY competition_period ASC, environment ASC`)).rows;
  let awardsCreated = 0;
  for (const period of periods) {
    const winners = (await client.query(
      `SELECT player_wallet, SUM(score_delta)::int AS points, COUNT(*) FILTER (WHERE fare_completed)::int AS fares_completed
       FROM standard_game_results WHERE competition_period=$1 AND environment=$2
       GROUP BY player_wallet ORDER BY points DESC, fares_completed DESC, player_wallet ASC LIMIT 3`, [period.competition_period, period.environment]
    )).rows;
    if (winners.length < MIN_WINNERS) continue;
    for (const award of allocatePrizePool(poolAtomic, winners)) {
      const inserted = await client.query(
        `INSERT INTO standard_daily_reward_awards (id,competition_period,environment,player_wallet,rank,pool_amount_atomic,award_amount_atomic)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (competition_period,environment,player_wallet,rank) DO NOTHING RETURNING id`,
        [randomUUID(), period.competition_period, period.environment, award.player_wallet, award.rank, poolAtomic.toString(), award.amountAtomic.toString()]
      );
      if (inserted.rowCount) {
        awardsCreated += 1;
        await client.query(`INSERT INTO reward_balances (player_wallet,accrued_atomic,unpaid_atomic) VALUES ($1,$2,$2) ON CONFLICT (player_wallet) DO UPDATE SET accrued_atomic=reward_balances.accrued_atomic+$2, unpaid_atomic=reward_balances.unpaid_atomic+$2, updated_at=now()`, [award.player_wallet, award.amountAtomic.toString()]);
      }
    }
  }
  return awardsCreated;
}

module.exports = async function handler(request, response) {
  if (!['GET', 'POST'].includes(request.method)) return respond(response, 405, { error: 'method_not_allowed' });
  if (!authorized(request)) return respond(response, process.env.REWARDS_ADMIN_TOKEN || process.env.CRON_SECRET ? 401 : 503, { error: process.env.REWARDS_ADMIN_TOKEN || process.env.CRON_SECRET ? 'reward_admin_unauthorized' : 'reward_admin_unconfigured' });
  try {
    const poolAtomic = atomicUsdc(DAILY_POOL_USDC);
    const thresholdAtomic = atomicUsdc(SETTLEMENT_THRESHOLD_USDC);
    const treasuryAtomic = await readTreasuryBalanceAtomic();
    const triggerKey = bangkokDateKey();
    const result = await withDatabaseTransaction(async client => {
      const awardsCreated = (await accrueCompletedShifts(client, poolAtomic)) + (await accrueStandardPeriods(client, poolAtomic));
      const funding = [];
      if (request.method === 'POST' && process.env.REWARD_FUNDING_ENABLED === 'true' && FEE_WALLET) {
        const half = poolAtomic / 2n;
        for (const [pool, amount] of [['STANDARD', half], ['AGENT', poolAtomic - half]]) {
          const key = `${triggerKey}:${pool}`;
          const existing = await client.query('SELECT transaction_signature,status FROM reward_funding_transfers WHERE idempotency_key=$1', [key]);
          if (existing.rowCount) { funding.push({ pool, status: existing.rows[0].status, signature: existing.rows[0].transaction_signature }); continue; }
          const transfer = await transferUsdc({ signerEnv: 'FEE_WALLET_PRIVATE_KEY', destination: REWARD_WALLET, mint: REWARD_MINT, amountAtomic: amount });
          const status = transfer.signature ? 'CONFIRMED' : 'PENDING';
          await client.query('INSERT INTO reward_funding_transfers (id,source_wallet,reward_wallet,reward_mint,pool,amount_atomic,status,transaction_signature,idempotency_key,confirmed_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,CASE WHEN $7=\'CONFIRMED\' THEN now() ELSE NULL END)', [randomUUID(), FEE_WALLET, REWARD_WALLET, REWARD_MINT, pool, amount.toString(), status, transfer.signature || null, key]);
          if (transfer.signature) await client.query('UPDATE reward_pool_balances SET funded_atomic=funded_atomic+$2,updated_at=now() WHERE pool=$1', [pool, amount.toString()]);
          funding.push({ pool, status, signature: transfer.signature || null, signerConfigured: transfer.configured });
        }
      }
      const unpaid = (await client.query(`SELECT player_wallet, SUM(award_amount_atomic)::numeric AS amount_atomic FROM (SELECT player_wallet,award_amount_atomic FROM daily_reward_awards WHERE status IN ('ACCRUED','RESERVED') UNION ALL SELECT player_wallet,award_amount_atomic FROM standard_daily_reward_awards WHERE status IN ('ACCRUED','RESERVED')) awards GROUP BY player_wallet HAVING SUM(award_amount_atomic)>0 ORDER BY player_wallet`)).rows;
      const unpaidAtomic = unpaid.reduce((sum, row) => sum + BigInt(row.amount_atomic), 0n);
      const ready = shouldSettle({ unpaidAtomic, treasuryAtomic, thresholdAtomic }) && unpaid.length > 0;
      const reason = !unpaid.length ? 'no_unpaid_awards' : unpaidAtomic < thresholdAtomic ? 'unpaid_rewards_below_threshold' : treasuryAtomic < unpaidAtomic ? 'treasury_below_total_unpaid_obligation' : 'payout_prepared_signer_required';
      const batch = (await client.query(
        `INSERT INTO reward_payout_batches (id,trigger_key,reward_wallet,reward_mint,treasury_balance_atomic,unpaid_atomic,threshold_atomic,recipient_count,status,reason,funding_source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (trigger_key) DO UPDATE SET treasury_balance_atomic=EXCLUDED.treasury_balance_atomic, unpaid_atomic=EXCLUDED.unpaid_atomic, recipient_count=EXCLUDED.recipient_count, status=CASE WHEN reward_payout_batches.status IN ('SUBMITTED','PARTIAL','CONFIRMED') THEN reward_payout_batches.status ELSE EXCLUDED.status END, reason=EXCLUDED.reason, updated_at=now()
         RETURNING *`, [randomUUID(), triggerKey, REWARD_WALLET, REWARD_MINT, treasuryAtomic.toString(), unpaidAtomic.toString(), thresholdAtomic.toString(), unpaid.length, ready ? 'READY' : 'HELD', reason, FUNDING_SOURCE]
      )).rows[0];
      if (ready && !['SUBMITTED', 'PARTIAL', 'CONFIRMED'].includes(batch.status)) {
        for (const row of unpaid) await client.query(
          `INSERT INTO reward_payout_batch_entries (id,batch_id,player_wallet,amount_atomic) VALUES ($1,$2,$3,$4) ON CONFLICT (batch_id,player_wallet) DO NOTHING`,
          [randomUUID(), batch.id, row.player_wallet, row.amount_atomic]
        );
        await client.query(`UPDATE daily_reward_awards SET status='RESERVED' WHERE status='ACCRUED'`);
        await client.query(`UPDATE standard_daily_reward_awards SET status='RESERVED' WHERE status='ACCRUED'`);
      }
      const entries = (await client.query(`SELECT player_wallet,amount_atomic,status,transaction_signature FROM reward_payout_batch_entries WHERE batch_id=$1 ORDER BY player_wallet`, [batch.id])).rows;
      return { status: batch.status, reason: batch.reason, triggerKey, awardsCreated, funding, feeWallet: FEE_WALLET, batchId: batch.id, rewardWallet: REWARD_WALLET, rewardMint: REWARD_MINT, fundingSource: batch.funding_source, treasuryBalanceUsdc: formatAtomic(treasuryAtomic), unpaidRewardsUsdc: formatAtomic(unpaidAtomic), thresholdUsdc: formatAtomic(thresholdAtomic), recipientCount: unpaid.length, entries: entries.map(entry => ({ ...entry, amountUsdc: formatAtomic(entry.amount_atomic) })), execution: 'prepared_only', signerConfigured: Boolean(process.env.REWARD_PAYOUT_PRIVATE_KEY) };
    });
    return respond(response, 200, result);
  } catch (error) {
    console.error('reward settlement failed', error);
    return respond(response, 503, { error: 'reward_settlement_unavailable' });
  }
};
