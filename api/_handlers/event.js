const { createHash, randomUUID } = require('node:crypto');
const { requireSession } = require('../_lib/auth');
const { withDatabaseTransaction, trustedNow } = require('../_lib/db');
const { projectTrip } = require('../_lib/trip');

function respond(response, status, body) { return response.status(status).json(body); }
function fail(code, status = 409) { const e = new Error(code); e.publicStatus = status; return e; }
function rollFor(tripId, eventCount) { return Number.parseInt(createHash('sha256').update(`${tripId}:${eventCount}`).digest('hex').slice(0, 12), 16) / 0x1000000000000; }

async function catalog() { return (await import('../../data/events.js')).CRAZY_EVENTS; }
function pickOutcome(event, roll) {
  const choices = event.choices || [{ id: 'default', outcomes: event.outcomes || [] }];
  const choice = choices[0];
  const outcomes = choice.outcomes || [];
  const total = outcomes.reduce((sum, item) => sum + Number(item.weight || 0), 0);
  let cursor = roll * total;
  return { choiceId: choice.id, outcome: outcomes.find(item => (cursor -= Number(item.weight || 0)) < 0) || outcomes[outcomes.length - 1] };
}

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') return respond(response, 405, { error: 'method_not_allowed' });
  try {
    const session = await requireSession(request);
    if (!session) return respond(response, 401, { error: 'agent_session_required' });
    const body = request.body || {};
    const key = body.idempotencyKey;
    if (typeof key !== 'string' || !/^[A-Za-z0-9._:-]{8,200}$/.test(key)) throw fail('valid_idempotency_key_required', 400);
    const result = await withDatabaseTransaction(async client => {
      const duplicate = await client.query('SELECT id,event_id,outcome_id,payload FROM trip_events WHERE idempotency_key=$1', [key]);
      if (duplicate.rowCount) return { duplicate: true, event: duplicate.rows[0] };
      const now = await trustedNow(client);
      const state = await client.query(`SELECT a.*,t.*,s.ends_at FROM agent_shift_states a JOIN agent_trips t ON t.id=a.active_trip_id JOIN daily_shifts s ON s.id=a.shift_id WHERE a.agent_id=$1 FOR UPDATE`, [session.agent_id]);
      if (!state.rowCount) throw fail('active_trip_not_found', 404);
      const trip = state.rows[0];
      if (!['ON_TRIP','EVENT_PENDING'].includes(trip.status) || trip.trip_status === 'COMPLETED') throw fail('event_invalid_trip_state');
      const existing = await client.query('SELECT count(*)::int AS count FROM trip_events WHERE trip_id=$1', [trip.id]);
      const events = (await catalog()).filter(item => item.trigger.minRideProgress <= Number(trip.progress) && item.trigger.maxRideProgress >= Number(trip.progress));
      if (!events.length) throw fail('no_event_at_boundary', 422);
      const event = events[Math.floor(rollFor(trip.id, existing.rows[0].count) * events.length)];
      const selected = pickOutcome(event, rollFor(trip.id, existing.rows[0].count + 1));
      const effects = selected.outcome?.effects || {};
      const projection = projectTrip({ baseDurationSeconds: trip.base_duration_seconds, timeModifierSeconds: Number(trip.time_modifier_seconds) + Number(effects.timeSeconds || 0), tripStartedAt: trip.trip_started_at, now, progress: trip.progress });
      const gasEffect = Number(effects.fuel || 0);
      const gasAfter = Math.max(0, Number(trip.gas_remaining || 0) + gasEffect);
      const stalled = gasAfter <= 0 && gasEffect < 0;
      await client.query(`INSERT INTO trip_events (id,trip_id,shift_id,agent_id,idempotency_key,event_id,event_version,outcome_id,random_roll,time_effect,gas_effect,score_effect,payload) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb)`, [randomUUID(), trip.id, trip.shift_id, session.agent_id, key, event.id, event.version || 1, selected.outcome.id, rollFor(trip.id, existing.rows[0].count + 1), Number(effects.timeSeconds || 0), gasEffect, Number(effects.crazy || 0), JSON.stringify({ choiceId: selected.choiceId, resultText: selected.outcome.resultText, reactionTag: selected.outcome.reactionTag })]);
      await client.query(`UPDATE agent_trips SET time_modifier_seconds=time_modifier_seconds+$1,gas_modifier=gas_modifier+$2,score_modifier=score_modifier+$3,projected_arrival=$4,status=$5,next_action_at=$4,state_version=state_version+1 WHERE id=$6`, [Number(effects.timeSeconds || 0), gasEffect, Number(effects.crazy || 0), projection.projectedArrival, stalled ? 'STALLED' : 'ON_TRIP', trip.id]);
      await client.query(`UPDATE agent_shift_states SET gas_remaining=$1,crazy_score=crazy_score+$2,status=$3,state_version=state_version+1,updated_at=now() WHERE id=$4`, [gasAfter, Number(effects.crazy || 0), stalled ? 'STALLED' : 'ON_TRIP', trip.agent_id]);
      return { duplicate: false, event: { eventId: event.id, outcomeId: selected.outcome.id, effects: { timeSeconds: Number(effects.timeSeconds || 0), fuel: gasEffect, crazy: Number(effects.crazy || 0) }, projectedArrival: projection.projectedArrival } };
    });
    return respond(response, 200, result);
  } catch (e) {
    if (e.code === 'DATABASE_URL_MISSING') return respond(response, 503, { error: 'database_unconfigured' });
    if (e.publicStatus) return respond(response, e.publicStatus, { error: e.message });
    console.error('agent event failed', e); return respond(response, 500, { error: 'agent_event_failed' });
  }
};
