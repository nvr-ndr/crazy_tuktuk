const { randomUUID } = require('node:crypto');
const { requireSession } = require('../_lib/auth');
const { withDatabaseTransaction, trustedNow } = require('../_lib/db');

function respond(response, status, body) { return response.status(status).json(body); }

module.exports = async function handler(request, response) {
  if (!['GET', 'POST'].includes(request.method)) return respond(response, 405, { error: 'method_not_allowed' });
  try {
    const session = await requireSession(request);
    if (!session) return respond(response, 401, { error: 'agent_session_required' });
    const result = await withDatabaseTransaction(async client => {
      const now = await trustedNow(client);
      const shift = await client.query(`SELECT s.id,s.shift_key,s.status FROM daily_shifts s JOIN agent_shift_states a ON a.shift_id=s.id WHERE a.agent_id=$1 AND s.status='ACTIVE' AND s.starts_at <= $2 AND s.ends_at > $2 ORDER BY s.starts_at DESC LIMIT 1`, [session.agent_id, now]);
      if (!shift.rowCount) return { serverTime: now, zones: [] };
      if (request.method === 'POST') {
        const zones = await client.query(`SELECT COALESCE(a.current_route->>'zoneId','unknown') AS zone_id, COUNT(*)::int AS agent_count FROM agent_shift_states a WHERE a.shift_id=$1 AND a.status IN ('ACTIVE','EVALUATING_FARES','FARE_ACCEPTED','ON_TRIP') GROUP BY 1`, [shift.rows[0].id]);
        for (const zone of zones.rows) {
          const demand = Math.min(100, 50 + zone.agent_count * 5);
          const state = zone.agent_count >= 10 ? 'OVERSUPPLIED' : zone.agent_count <= 2 ? 'SURGE' : 'NORMAL';
          await client.query(`INSERT INTO zone_states (id,shift_id,zone_id,agent_count,demand_score,supply_score,state) VALUES ($1,$2,$3,$4,$5,$4,$6) ON CONFLICT (shift_id,zone_id) DO UPDATE SET agent_count=EXCLUDED.agent_count,demand_score=EXCLUDED.demand_score,supply_score=EXCLUDED.supply_score,state=EXCLUDED.state,updated_at=now()`, [randomUUID(), shift.rows[0].id, zone.zone_id, zone.agent_count, demand, state]);
        }
      }
      const zones = await client.query(`SELECT zone_id,agent_count,demand_score,supply_score,state,updated_at FROM zone_states WHERE shift_id=$1 ORDER BY zone_id`, [shift.rows[0].id]);
      return { serverTime: now, shift: shift.rows[0], zones: zones.rows };
    });
    return respond(response, 200, result);
  } catch (e) {
    if (e.code === 'DATABASE_URL_MISSING') return respond(response, 503, { error: 'database_unconfigured' });
    console.error('agent zones failed', e); return respond(response, 500, { error: 'zone_transition_failed' });
  }
};
