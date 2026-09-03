const { withDatabase, trustedNow } = require('../_lib/db');

function respond(response, status, body) {
  response.status(status).json(body);
}

module.exports = async function handler(request, response) {
  if (request.method !== 'GET') return respond(response, 405, { error: 'method_not_allowed' });
  try {
    const result = await withDatabase(async (client) => {
      const now = await trustedNow(client);
      const query = await client.query(`
        SELECT a.id AS agent_id, a.name, a.owner_wallet, a.wallet_public_key,
               ROW_NUMBER() OVER (
                 ORDER BY COALESCE(r.crazy_score, ranked.crazy_score, 0) DESC,
                          COALESCE(r.fares_completed, ranked.fares_completed, 0) DESC,
                          a.created_at ASC, a.id ASC
               ) AS rank,
               COALESCE(r.crazy_score, ranked.crazy_score, 0) AS crazy_score,
               COALESCE(r.fares_completed, ranked.fares_completed, 0) AS fares_completed,
               COALESCE(r.final_status, ranked.status, 'READY_NEXT_SHIFT') AS status
        FROM agents a
        LEFT JOIN LATERAL (
          SELECT dsr.final_rank, dsr.crazy_score, dsr.fares_completed, dsr.final_status
          FROM daily_shift_results dsr
          JOIN daily_shifts ds ON ds.id = dsr.shift_id
          WHERE dsr.agent_id = a.id
          ORDER BY ds.shift_key DESC
          LIMIT 1
        ) r ON true
        LEFT JOIN LATERAL (
          SELECT ass.crazy_score, ass.fares_completed, ass.status,
                 DENSE_RANK() OVER (ORDER BY ass.crazy_score DESC) AS rank
          FROM agent_shift_states ass
          JOIN daily_shifts ds ON ds.id = ass.shift_id
          WHERE ass.agent_id = a.id AND ds.status IN ('QUEUED', 'ACTIVE')
          ORDER BY ds.shift_key DESC
          LIMIT 1
        ) ranked ON true
        ORDER BY crazy_score DESC, fares_completed DESC, a.created_at ASC
        LIMIT 50`);
      let rewardPool = null;
      try { rewardPool = (await client.query(`
        SELECT p.pool, p.accrued_atomic, p.funded_atomic,
               e.id AS epoch_id, e.status AS epoch_status, e.threshold_atomic,
               e.pool_atomic, e.starts_at, e.threshold_reached_at, e.payout_at
        FROM reward_pool_balances p
        LEFT JOIN LATERAL (
          SELECT * FROM reward_epochs e
          WHERE e.pool=p.pool AND e.status IN ('OPEN','THRESHOLD_REACHED','PAYOUT_PENDING')
          ORDER BY e.starts_at DESC LIMIT 1
        ) e ON true
        WHERE p.pool='AGENT'`)).rows[0] || null; } catch (error) {
        // Keep the existing leaderboard available until the schema migration
        // has been applied in every environment.
        if (error.code !== '42P01') throw error;
      }
      const epoch = rewardPool?.epoch_id ? {
        id: rewardPool.epoch_id,
        status: rewardPool.epoch_status,
        thresholdAtomic: String(rewardPool.threshold_atomic),
        poolAtomic: String(rewardPool.pool_atomic || 0),
        startsAt: rewardPool.starts_at,
        thresholdReachedAt: rewardPool.threshold_reached_at,
        payoutAt: rewardPool.payout_at
      } : null;
      let epochScores = { rows: [] };
      if (epoch) {
        try { epochScores = await client.query(`SELECT player_wallet,points,days_played FROM reward_epoch_scores WHERE epoch_id=$1 ORDER BY points DESC,days_played DESC,player_wallet ASC LIMIT 10`, [epoch.id]); } catch (error) {
          if (error.code !== '42P01') throw error;
        }
      }
      return { serverTime: now, leaderboard: query.rows.map((row, index) => ({
        rank: Number(row.rank) || index + 1,
        name: row.name || 'Agent Driver',
        ownerWallet: row.owner_wallet,
        walletPublicKey: row.wallet_public_key,
        points: Number(row.crazy_score) || 0,
        fares: Number(row.fares_completed) || 0,
        status: row.status
      })), rewardPool: 'AGENT', epoch, epochLeaderboard: epochScores.rows.map((row, index) => ({ rank: index + 1, playerWallet: row.player_wallet, points: Number(row.points), daysPlayed: Number(row.days_played) })) };
    });
    return respond(response, 200, result);
  } catch (error) {
    if (error.code === 'DATABASE_URL_MISSING') return respond(response, 503, { error: 'database_unconfigured' });
    console.error('leaderboard query failed', error);
    return respond(response, 500, { error: 'leaderboard_unavailable' });
  }
};
