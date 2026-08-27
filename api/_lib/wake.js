const { randomUUID, createHash } = require('node:crypto');
const { withDatabaseTransaction, trustedNow } = require('./db');
const { projectTrip } = require('./trip');
const { calculateFuelCost } = require('./routes');

const DEFAULT_BATCH_SIZE = 5;
const LEASE_SECONDS = 60;
function eventRoll(tripId, count) { return Number.parseInt(createHash('sha256').update(`${tripId}:${count}`).digest('hex').slice(0,12),16) / 0x1000000000000; }
async function resolveDueEvent(client, state, trip) {
  const { CRAZY_EVENTS } = await import('../../data/events.js');
  const existing = await client.query('SELECT count(*)::int AS count FROM trip_events WHERE trip_id=$1',[trip.id]);
  const candidates = CRAZY_EVENTS.filter(e => e.trigger.minRideProgress <= Number(trip.progress) && e.trigger.maxRideProgress >= Number(trip.progress));
  if (!candidates.length) return null;
  const event = candidates[Math.floor(eventRoll(trip.id, existing.rows[0].count) * candidates.length)];
  const choice = (event.choices || [{id:'default',outcomes:event.outcomes||[]}])[0];
  const outcomes = choice.outcomes || []; const total=outcomes.reduce((n,o)=>n+Number(o.weight||0),0); let cursor=eventRoll(trip.id,existing.rows[0].count+1)*total;
  const outcome=outcomes.find(o => (cursor-=Number(o.weight||0))<0) || outcomes[outcomes.length-1]; const effects=outcome?.effects||{};
  const now=await trustedNow(client); const modifier=Number(trip.time_modifier_seconds||0)+Number(effects.timeSeconds||0);
  const projection=projectTrip({baseDurationSeconds:trip.base_duration_seconds,timeModifierSeconds:modifier,tripStartedAt:trip.trip_started_at,now,progress:trip.progress});
  await client.query(`INSERT INTO trip_events (id,trip_id,shift_id,agent_id,idempotency_key,event_id,event_version,outcome_id,random_roll,time_effect,gas_effect,score_effect,payload) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb)`,[randomUUID(),trip.id,state.shift_id,state.agent_id,`wake-event:${trip.id}:${existing.rows[0].count}`,event.id,event.version||1,outcome.id,eventRoll(trip.id,existing.rows[0].count+1),Number(effects.timeSeconds||0),Number(effects.fuel||0),Number(effects.crazy||0),JSON.stringify({choiceId:choice.id,resultText:outcome.resultText})]);
  await client.query(`UPDATE agent_trips SET time_modifier_seconds=$1,gas_modifier=gas_modifier+$2,score_modifier=score_modifier+$3,projected_arrival=$4,next_action_at=$4,state_version=state_version+1 WHERE id=$5`,[modifier,Number(effects.fuel||0),Number(effects.crazy||0),projection.projectedArrival,trip.id]);
  await client.query(`UPDATE agent_shift_states SET gas_remaining=GREATEST(0,gas_remaining+$1),crazy_score=crazy_score+$2,next_action_at=$3,state_version=state_version+1,lease_token=NULL,lease_until=NULL,updated_at=now() WHERE id=$4 AND lease_token=$5`,[Number(effects.fuel||0),Number(effects.crazy||0),projection.projectedArrival,state.id,state.lease_token]);
  return {action:'resolve_crazy_event',eventId:event.id,outcomeId:outcome.id,projectedArrival:projection.projectedArrival};
}

function batchSize() {
  const value = Number(process.env.AGENT_WAKE_BATCH_SIZE || DEFAULT_BATCH_SIZE);
  return Number.isInteger(value) ? Math.max(1, Math.min(50, value)) : DEFAULT_BATCH_SIZE;
}

async function claimDue(client, limit, token = randomUUID(), eligibleAgentIds = null) {
  const rows = await client.query(`
    UPDATE agent_shift_states a
      SET lease_token=$2, lease_until=now() + ($3::text || ' seconds')::interval, updated_at=now()
    WHERE a.id IN (
      SELECT due.id FROM agent_shift_states due
      JOIN daily_shifts s ON s.id=due.shift_id
      WHERE due.next_action_at <= now()
        AND due.status IN ('ACTIVE','ON_TRIP')
        AND s.status='ACTIVE'
        AND (due.lease_until IS NULL OR due.lease_until < now())
        AND ($4::uuid[] IS NULL OR due.agent_id = ANY($4::uuid[]))
      ORDER BY due.next_action_at, due.id
      FOR UPDATE SKIP LOCKED LIMIT $1
    )
    AND (a.lease_until IS NULL OR a.lease_until < now())
    RETURNING a.*`, [limit, token, LEASE_SECONDS, eligibleAgentIds]);
  return rows.rows;
}

async function advanceClaimed(client, state, token) {
  const now = await trustedNow(client);
  if (state.status === 'ON_TRIP' && state.active_trip_id) {
    const tripResult = await client.query('SELECT * FROM agent_trips WHERE id=$1 AND agent_id=$2 FOR UPDATE', [state.active_trip_id, state.agent_id]);
    if (!tripResult.rowCount) throw new Error('active_trip_not_found');
    const trip = tripResult.rows[0];
    const event = await resolveDueEvent(client, state, trip);
    if (event) return event;
    const projection = projectTrip({ baseDurationSeconds: trip.base_duration_seconds, timeModifierSeconds: trip.time_modifier_seconds, tripStartedAt: trip.trip_started_at, now });
    const fuel = Math.max(0, Math.ceil(calculateFuelCost(trip.route_distance_meters) * projection.progress) - Number(trip.gas_consumed || 0));
    const gas = Number(state.gas_remaining) - fuel;
    const cutoff = new Date(now) >= new Date((await client.query('SELECT ends_at FROM daily_shifts WHERE id=$1', [state.shift_id])).rows[0].ends_at);
    const complete = projection.completed && !cutoff && gas >= 0;
    const status = gas < 0 ? 'STALLED' : cutoff && !complete ? 'PARKED' : complete ? 'COMPLETED' : 'ON_TRIP';
    // The state column is NOT NULL; terminal states remain non-actionable by
    // status exclusion, while retaining a valid persisted scheduling value.
    const nextAction = status === 'ON_TRIP' ? projection.projectedArrival : new Date(new Date(now).getTime() + 30000).toISOString();
    await client.query('UPDATE agent_trips SET progress=$1,gas_consumed=gas_consumed+$2,projected_arrival=$3,status=$4,next_action_at=$5,state_version=state_version+1 WHERE id=$6', [projection.progress, fuel, projection.projectedArrival, status, nextAction, trip.id]);
    await client.query(`UPDATE agent_shift_states SET gas_remaining=GREATEST(0,gas_remaining-$1),status=$2,active_trip_id=$3,fares_completed=fares_completed+$4,next_action_at=$5,state_version=state_version+1,lease_token=NULL,lease_until=NULL,updated_at=now() WHERE id=$6 AND lease_token=$7`, [fuel, status === 'COMPLETED' ? 'ACTIVE' : status, status === 'COMPLETED' ? null : trip.id, complete ? 1 : 0, nextAction, state.id, token]);
    if (complete) await client.query("UPDATE daily_fares SET status='COMPLETED',completed_at=$1 WHERE id=$2 AND status='CLAIMED'", [now, trip.fare_id]);
    return { action: 'advance_trip', state: status, completed: complete };
  }
  const fares = await client.query(`SELECT id FROM daily_fares WHERE shift_id=$1 AND status='AVAILABLE' AND claimed_by IS NULL AND expires_at>$2 ORDER BY point_value DESC,created_at ASC LIMIT 1`, [state.shift_id, now]);
  if (state.status === 'ACTIVE' && fares.rowCount) {
    const fare = fares.rows[0];
    const claimed = await client.query(`UPDATE daily_fares SET status='CLAIMED',claimed_by=$1,claimed_at=$2,locked_surge_multiplier=surge_multiplier WHERE id=$3 AND status='AVAILABLE' RETURNING id`, [state.agent_id, now, fare.id]);
    if (claimed.rowCount) {
      await client.query(`UPDATE agent_shift_states SET status='FARE_ACCEPTED',next_action_at=now(),state_version=state_version+1,lease_token=NULL,lease_until=NULL,updated_at=now() WHERE id=$1 AND lease_token=$2`, [state.id, token]);
      return { action: 'observe_and_accept_fare', fareId: fare.id, state: 'FARE_ACCEPTED' };
    }
  }
  await client.query("UPDATE agent_shift_states SET next_action_at=now()+interval '30 seconds',lease_token=NULL,lease_until=NULL,updated_at=now() WHERE id=$1 AND lease_token=$2", [state.id, token]);
  return { action: 'observe_fares', state: state.status };
}

async function processWake(options = {}) {
  return withDatabaseTransaction(async client => {
    const token = randomUUID();
    const claimed = await claimDue(client, batchSize(), token, options.eligibleAgentIds || null);
    const results = [];
    for (const state of claimed) {
      try { results.push({ agentId: state.agent_id, ...(await advanceClaimed(client, state, token)) }); }
      catch (error) { await client.query('UPDATE agent_shift_states SET lease_token=NULL,lease_until=NULL WHERE id=$1 AND lease_token=$2', [state.id, token]); results.push({ agentId: state.agent_id, error: error.message }); }
    }
    return { claimed: claimed.length, processed: results.length, results, batchSize: batchSize() };
  });
}

module.exports = { processWake, claimDue, batchSize, LEASE_SECONDS };
