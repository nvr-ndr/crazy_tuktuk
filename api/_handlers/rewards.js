const { randomUUID } = require('node:crypto');
const { withDatabaseTransaction } = require('../_lib/db');
const { atomicUsdc, formatAtomic, readTreasuryBalanceAtomic, REWARD_WALLET, REWARD_MINT, SETTLEMENT_THRESHOLD_USDC } = require('../_lib/rewards');
const { transferUsdc } = require('../_lib/rewardTransfers');
const { dueEpochQuery, payoutEntries, settlementNetwork } = require('../_lib/rewardSettlement');

function respond(response, status, body) { return response.status(status).json(body); }
function authorized(request) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '') || request.headers['x-rewards-admin-token'];
  return Boolean(token && ((process.env.REWARDS_ADMIN_TOKEN && token === process.env.REWARDS_ADMIN_TOKEN) || (process.env.CRON_SECRET && token === process.env.CRON_SECRET)));
}

async function buildDuePoolBatches(pool, treasuryAtomic) {
  return withDatabaseTransaction(async (client) => {
    const epochs = (await client.query(dueEpochQuery, [pool])).rows;
    const batches = [];
    for (const epoch of epochs) {
      const scores = (await client.query(`SELECT player_wallet,points,days_played FROM reward_epoch_scores WHERE epoch_id=$1 ORDER BY points DESC, days_played DESC, player_wallet ASC LIMIT 3`, [epoch.id])).rows;
      const entries = payoutEntries({ poolAtomic: BigInt(epoch.pool_atomic), scores });
      const obligationAtomic = entries.reduce((sum, entry) => sum + entry.amountAtomic, 0n);
      const status = entries.length === 3 && treasuryAtomic >= obligationAtomic ? 'READY' : 'HELD';
      const reason = entries.length === 3 ? (status === 'READY' ? 'payout_window_open' : 'treasury_below_epoch_obligation') : 'epoch_requires_three_ranked_recipients';
      const batch = (await client.query(
        `INSERT INTO reward_payout_batches (id,trigger_key,epoch_id,pool,reward_wallet,reward_mint,treasury_balance_atomic,unpaid_atomic,threshold_atomic,recipient_count,status,payout_at,reason)
         VALUES ($1,(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok')::date,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (pool,epoch_id) WHERE epoch_id IS NOT NULL DO UPDATE SET treasury_balance_atomic=EXCLUDED.treasury_balance_atomic, unpaid_atomic=EXCLUDED.unpaid_atomic, recipient_count=EXCLUDED.recipient_count, status=CASE WHEN reward_payout_batches.status IN ('SUBMITTED','CONFIRMED') THEN reward_payout_batches.status ELSE EXCLUDED.status END, reason=EXCLUDED.reason, updated_at=now()
         RETURNING *`,
        [randomUUID(), epoch.id, pool, REWARD_WALLET, REWARD_MINT, treasuryAtomic.toString(), obligationAtomic.toString(), epoch.threshold_atomic, entries.length, status, epoch.payout_at, reason]
      )).rows[0];
      // The first insert freezes winner identity, rank, share, and amount.
      for (const entry of entries) await client.query(
        `INSERT INTO reward_payout_batch_entries (id,batch_id,player_wallet,rank,share_bps,amount_atomic) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (batch_id,player_wallet) DO NOTHING`,
        [randomUUID(), batch.id, entry.playerWallet, entry.rank, entry.shareBps, entry.amountAtomic.toString()]
      );
      const pending = (await client.query(`SELECT player_wallet,amount_atomic,status,transaction_signature FROM reward_payout_batch_entries WHERE batch_id=$1 AND status IN ('PENDING','FAILED') ORDER BY rank ASC`, [batch.id])).rows;
      batches.push({ pool, epochId: epoch.id, batchId: batch.id, status: batch.status, reason: batch.reason, payoutAt: batch.payout_at, entries: pending });
    }
    return batches;
  });
}

async function finalizeIfComplete(batchId, epochId) {
  await withDatabaseTransaction(async (client) => {
    const summary = (await client.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='CONFIRMED')::int AS confirmed FROM reward_payout_batch_entries WHERE batch_id=$1`, [batchId])).rows[0];
    if (summary.total === 3 && summary.confirmed === 3) {
      await client.query(`UPDATE reward_payout_batches SET status='CONFIRMED',confirmed_at=COALESCE(confirmed_at,now()),updated_at=now() WHERE id=$1`, [batchId]);
      await client.query(`UPDATE reward_epochs SET status='CLOSED',closed_at=COALESCE(closed_at,now()) WHERE id=$1 AND status IN ('PAYOUT_PENDING','READY','SUBMITTED','PAID')`, [epochId]);
    }
  });
}

async function executeBatch(batch, network) {
  if (!['READY','SUBMITTED','PARTIAL'].includes(batch.status)) return { ...batch, execution: 'held', payouts: [] };
  if (!network.enabled || !process.env.REWARD_PAYOUT_PRIVATE_KEY) return { ...batch, execution: 'prepared_only', payouts: [] };
  const payouts = [];
  for (const entry of batch.entries) {
    try {
      const transfer = await transferUsdc({ signerEnv: 'REWARD_PAYOUT_PRIVATE_KEY', destination: entry.player_wallet, mint: REWARD_MINT, amountAtomic: entry.amount_atomic });
      if (!transfer.signature) throw new Error(transfer.reason || 'reward_transfer_unavailable');
      await withDatabaseTransaction(async (client) => {
        await client.query(`UPDATE reward_payout_batch_entries SET status='CONFIRMED',transaction_signature=$2,submitted_at=COALESCE(submitted_at,now()),confirmed_at=COALESCE(confirmed_at,now()) WHERE batch_id=$1 AND player_wallet=$3 AND status IN ('PENDING','FAILED')`, [batch.batchId, transfer.signature, entry.player_wallet]);
        await client.query(`UPDATE reward_payout_batches SET status='SUBMITTED',submitted_at=COALESCE(submitted_at,now()),updated_at=now() WHERE id=$1 AND status <> 'CONFIRMED'`, [batch.batchId]);
      });
      await finalizeIfComplete(batch.batchId, batch.epochId);
      payouts.push({ wallet: entry.player_wallet, status: 'CONFIRMED', signature: transfer.signature, amountUsdc: formatAtomic(entry.amount_atomic) });
    } catch (error) {
      await withDatabaseTransaction(async (client) => {
        await client.query(`UPDATE reward_payout_batch_entries SET status='FAILED' WHERE batch_id=$1 AND player_wallet=$2 AND status='PENDING'`, [batch.batchId, entry.player_wallet]);
        await client.query(`UPDATE reward_payout_batches SET status='PARTIAL',reason='one_or_more_payouts_failed',updated_at=now() WHERE id=$1`, [batch.batchId]);
      });
      payouts.push({ wallet: entry.player_wallet, status: 'FAILED' });
    }
  }
  return { ...batch, execution: 'submitted', payouts };
}

module.exports = async function handler(request, response) {
  if (!['GET', 'POST'].includes(request.method)) return respond(response, 405, { error: 'method_not_allowed' });
  if (!authorized(request)) return respond(response, process.env.REWARDS_ADMIN_TOKEN || process.env.CRON_SECRET ? 401 : 503, { error: process.env.REWARDS_ADMIN_TOKEN || process.env.CRON_SECRET ? 'reward_admin_unauthorized' : 'reward_admin_unconfigured' });
  const network = settlementNetwork();
  try {
    // GET is read-only, and an unguarded environment never touches a treasury.
    const treasuryAtomic = network.enabled ? await readTreasuryBalanceAtomic() : 0n;
    const settlements = [];
    for (const pool of ['STANDARD', 'AGENT']) {
      try { settlements.push(...await buildDuePoolBatches(pool, treasuryAtomic)); }
      catch (error) {
        console.error('reward pool settlement failed', { pool, error: error.message });
        settlements.push({ pool, status: 'UNAVAILABLE', reason: 'pool_settlement_unavailable', entries: [] });
      }
    }
    const result = request.method === 'POST'
      ? await Promise.all(settlements.map((batch) => executeBatch(batch, network)))
      : settlements.map((batch) => ({ ...batch, execution: 'read_only', payouts: [] }));
    return respond(response, 200, { rewardWallet: REWARD_WALLET, rewardMint: REWARD_MINT, thresholdUsdc: formatAtomic(atomicUsdc(SETTLEMENT_THRESHOLD_USDC)), treasuryBalanceUsdc: formatAtomic(treasuryAtomic), devnetPayoutEnabled: network.enabled, settlements: result });
  } catch (error) {
    console.error('reward settlement failed', error);
    return respond(response, 503, { error: 'reward_settlement_unavailable' });
  }
};
