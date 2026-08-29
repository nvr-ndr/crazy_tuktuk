const { requireSession } = require('../_lib/auth');
const { withDatabase, trustedNow } = require('../_lib/db');

function respond(response, status, body) { return response.status(status).json(body); }

function eligible(fare, agent) {
  const rules = fare.eligibility || {};
  const ids = rules.agentIds || rules.agent_ids;
  if (Array.isArray(ids) && ids.length && !ids.includes(agent.agent_id)) return false;
  if (rules.minGas != null && Number(agent.gas_remaining) < Number(rules.minGas)) return false;
  if (rules.zoneId != null && agent.current_zone_id != null && rules.zoneId !== agent.current_zone_id) return false;
  return true;
}

module.exports = async function handler(request, response) {
  if (request.method !== 'GET') return respond(response, 405, { error: 'method_not_allowed' });
  try {
    const session = await requireSession(request);
    if (!session) return respond(response, 401, { error: 'agent_session_required' });
    const result = await withDatabase(async client => {
      const now = await trustedNow(client);
      const state = await client.query(
        `SELECT a.agent_id, a.status, a.gas_remaining, a.current_route->>'zoneId' AS current_zone_id,
                s.id AS shift_id, s.shift_key, s.ends_at
         FROM agent_shift_states a JOIN daily_shifts s ON s.id=a.shift_id
         WHERE a.agent_id=$1 AND s.status='ACTIVE' AND s.starts_at <= $2 AND s.ends_at > $2
         ORDER BY s.starts_at DESC LIMIT 1`, [session.agent_id, now]);
      if (!state.rowCount) return { serverTime: now, shift: null, fares: [] };
      const agent = state.rows[0];
      if (!['ACTIVE', 'EVALUATING_FARES'].includes(agent.status)) return { serverTime: now, shift: { id: agent.shift_id, key: agent.shift_key }, fares: [] };
      const fares = await client.query(
        `SELECT id, passenger_id, pickup_location_id, destination_location_id, point_value,
                expires_at, eligibility, surge_multiplier, created_at
         FROM daily_fares
         WHERE shift_id=$1 AND status='AVAILABLE' AND claimed_by IS NULL AND expires_at > $2
         ORDER BY expires_at ASC, created_at ASC`, [agent.shift_id, now]);
      return { serverTime: now, shift: { id: agent.shift_id, key: agent.shift_key, endsAt: agent.ends_at }, fares: fares.rows.filter(fare => eligible(fare, agent)) };
    });
    return respond(response, 200, result);
  } catch (error) {
    if (error.code === 'DATABASE_URL_MISSING') return respond(response, 503, { error: 'database_unconfigured' });
    console.error('agent fare observation failed', error);
    return respond(response, 500, { error: 'fare_observation_failed' });
  }
};
