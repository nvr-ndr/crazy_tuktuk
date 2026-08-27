const { requireSession } = require('../_lib/auth');
const { withDatabase, trustedNow } = require('../_lib/db');

function respond(response, status, body) {
  response.status(status).json(body);
}

module.exports = async function handler(request, response) {
  if (request.method !== 'GET') return respond(response, 405, { error: 'method_not_allowed' });
  try {
    const session = await requireSession(request);
    if (!session) return respond(response, 401, { error: 'agent_session_required' });
    const snapshot = await withDatabase(async (client) => {
      const now = await trustedNow(client);
      const result = await client.query(
        `SELECT s.id AS shift_id, s.shift_key, s.status AS shift_status, s.starts_at, s.ends_at,
                a.status, a.gas_remaining, a.gas_allocated, a.crazy_score, a.fares_completed,
                a.bankroll, a.pit_calls_used, a.state_version, a.active_trip_id, a.next_action_at,
                a.updated_at
         FROM daily_shifts s JOIN agent_shift_states a ON a.shift_id = s.id
         WHERE a.agent_id = $1 ORDER BY s.starts_at DESC LIMIT 1`,
        [session.agent_id]
      );
      return { serverTime: now, state: result.rows[0] || null };
    });
    return respond(response, 200, snapshot);
  } catch (error) {
    if (error.code === 'DATABASE_URL_MISSING') return respond(response, 503, { error: 'database_unconfigured' });
    console.error('agent shift snapshot failed', error);
    return respond(response, 500, { error: 'agent_snapshot_failed' });
  }
};
