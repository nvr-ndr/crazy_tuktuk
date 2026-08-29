const { randomUUID } = require('node:crypto');
const { requireSession } = require('../_lib/auth');
const { withDatabaseTransaction, trustedNow } = require('../_lib/db');

function respond(response, status, body) { return response.status(status).json(body); }
function error(code, status = 409) { const e = new Error(code); e.publicStatus = status; return e; }

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') return respond(response, 405, { error: 'method_not_allowed' });
  try {
    const session = await requireSession(request);
    if (!session) return respond(response, 401, { error: 'agent_session_required' });
    const body = request.body || {};
    const key = body.idempotencyKey;
    if (typeof key !== 'string' || !/^[A-Za-z0-9._:-]{8,200}$/.test(key)) throw error('valid_idempotency_key_required', 400);
    if (body.commandType !== 'SET_STRATEGY') throw error('unsupported_pit_call', 400);
    if (body.target !== 'NEXT_DECISION') throw error('invalid_pit_call_target', 400);
    const payload = body.payload;
    if (!payload || !['PROFIT', 'BALANCED', 'SCORE'].includes(payload.priority) || !Number.isInteger(Number(payload.risk)) || !Number.isInteger(Number(payload.activity)) || Number(payload.risk) < 1 || Number(payload.risk) > 10 || Number(payload.activity) < 1 || Number(payload.activity) > 10) throw error('invalid_strategy_payload', 400);
    const result = await withDatabaseTransaction(async client => {
      const now = await trustedNow(client);
      const duplicate = await client.query('SELECT id,status FROM agent_commands WHERE idempotency_key=$1', [key]);
      if (duplicate.rowCount) return { duplicate: true, command: duplicate.rows[0] };
      const state = await client.query(`SELECT a.*,s.status AS shift_status,s.ends_at,agents.owner_wallet FROM agent_shift_states a JOIN daily_shifts s ON s.id=a.shift_id JOIN agents ON agents.id=a.agent_id WHERE a.agent_id=$1 FOR UPDATE`, [session.agent_id]);
      if (!state.rowCount || state.rows[0].shift_status !== 'ACTIVE' || new Date(now) >= new Date(state.rows[0].ends_at)) throw error('shift_unavailable');
      const agent = state.rows[0];
      if (!['ACTIVE','EVALUATING_FARES','FARE_ACCEPTED','ON_TRIP'].includes(agent.status)) throw error('pit_call_invalid_state');
      if (Number(agent.pit_calls_used) >= 3) throw error('pit_calls_exhausted');
      const inserted = await client.query(`INSERT INTO agent_commands (id,agent_id,shift_id,owner_wallet,command_type,target,payload,status,idempotency_key,expires_at) VALUES ($1,$2,$3,$4,'SET_STRATEGY','NEXT_DECISION',$5::jsonb,'PENDING',$6,$7) RETURNING id,status,target,payload,created_at,expires_at`, [randomUUID(), agent.agent_id, agent.shift_id, agent.owner_wallet, JSON.stringify(payload), key, agent.ends_at]);
      await client.query(`UPDATE agent_shift_states SET pit_calls_used=pit_calls_used+1,state_version=state_version+1,updated_at=now() WHERE id=$1`, [agent.id]);
      return { duplicate: false, command: inserted.rows[0], pitCallsRemaining: 2 - Number(agent.pit_calls_used) };
    });
    console.info('agent pit call accepted', {
      agentId: session.agent_id,
      duplicate: result.duplicate,
      pitCallsRemaining: result.pitCallsRemaining ?? null,
      strategy: result.command?.payload ?? null
    });
    return respond(response, 200, result);
  } catch (e) {
    if (e.code === 'DATABASE_URL_MISSING') return respond(response, 503, { error: 'database_unconfigured' });
    if (e.publicStatus) return respond(response, e.publicStatus, { error: e.message });
    console.error('pit call failed', e); return respond(response, 500, { error: 'pit_call_failed' });
  }
};
