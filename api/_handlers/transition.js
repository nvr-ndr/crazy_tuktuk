const { randomUUID } = require('node:crypto');
const { requireSession } = require('../_lib/auth');
const { withDatabaseTransaction, trustedNow } = require('../_lib/db');
const { getRouteSummary, chooseRouteVariant, calculateFuelCost } = require('../_lib/routes');
const { projectTrip } = require('../_lib/trip');

function respond(response, status, body) { return response.status(status).json(body); }
function fail(code, status = 409) { const error = new Error(code); error.publicStatus = status; return error; }
function bodyOf(request) { return request.body && typeof request.body === 'object' ? request.body : {}; }
function idempotency(body) {
  const key = body.idempotencyKey;
  if (typeof key !== 'string' || !/^[A-Za-z0-9._:-]{8,200}$/.test(key)) throw fail('valid_idempotency_key_required', 400);
  return key;
}

async function currentSnapshot(client, agentId, shiftId) {
  const result = await client.query(
    `SELECT s.id AS shift_id, s.shift_key, s.status AS shift_status, s.starts_at, s.ends_at,
            a.status, a.gas_remaining, a.gas_allocated, a.crazy_score, a.fares_completed,
            a.bankroll, a.state_version, a.active_trip_id, a.next_action_at,
            t.id AS trip_id, t.fare_id, t.origin_location_id, t.destination_location_id,
            t.route_variant, t.route_version, t.route_distance_meters, t.base_duration_seconds,
            t.trip_started_at, t.progress, t.time_modifier_seconds, t.gas_modifier,
            t.score_modifier, t.projected_arrival, t.status AS trip_status
     FROM daily_shifts s JOIN agent_shift_states a ON a.shift_id = s.id
     LEFT JOIN agent_trips t ON t.id = a.active_trip_id
     WHERE a.agent_id = $1 AND a.shift_id = $2`, [agentId, shiftId]);
  return result.rows[0] || null;
}

async function insertEvent(client, values) {
  const result = await client.query(
    `INSERT INTO daily_shift_events
       (id, shift_id, agent_id, idempotency_key, type, fare_id, gas_delta, payload)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
     ON CONFLICT (idempotency_key) DO NOTHING RETURNING id`, values);
  return result.rowCount > 0;
}

async function claimFare(client, session, body) {
  const fareId = body.fareId;
  if (typeof fareId !== 'string') throw fail('fare_id_required', 400);
  const key = idempotency(body);
  const state = await client.query(
    `SELECT a.*, s.status AS shift_status, s.ends_at FROM agent_shift_states a
     JOIN daily_shifts s ON s.id = a.shift_id WHERE a.agent_id = $1 FOR UPDATE`, [session.agent_id]);
  if (!state.rowCount) throw fail('agent_shift_not_initialized', 404);
  const agent = state.rows[0];
  const now = await trustedNow(client);
  const duplicate = await client.query('SELECT id FROM daily_shift_events WHERE idempotency_key = $1', [key]);
  if (duplicate.rowCount) return { duplicate: true, snapshot: await currentSnapshot(client, session.agent_id, agent.shift_id) };
  if (!['ACTIVE', 'EVALUATING_FARES'].includes(agent.status)) throw fail('fare_claim_invalid_state');
  if (new Date(now) >= new Date(agent.ends_at)) throw fail('shift_cutoff');
  const fare = await client.query(
    `SELECT * FROM daily_fares WHERE id = $1 AND shift_id = $2 FOR UPDATE`, [fareId, agent.shift_id]);
  if (!fare.rowCount) throw fail('fare_not_found', 404);
  const row = fare.rows[0];
  if (row.status !== 'AVAILABLE' || row.claimed_by || new Date(row.expires_at) <= new Date()) throw fail('fare_unavailable');
  const active = await client.query(
    `SELECT id FROM agent_trips WHERE agent_id = $1 AND shift_id = $2 AND status IN ('ROUTE_SELECTED','ON_TRIP','EVENT_PENDING')`,
    [session.agent_id, agent.shift_id]);
  if (active.rowCount) throw fail('active_trip_exists');
  await client.query(`UPDATE daily_fares SET status='CLAIMED', claimed_by=$1, claimed_at=now(), locked_surge_multiplier=surge_multiplier WHERE id=$2`, [session.agent_id, fareId]);
  await client.query(`UPDATE agent_shift_states SET status='FARE_ACCEPTED', state_version=state_version+1, updated_at=now() WHERE id=$1`, [agent.id]);
  await insertEvent(client, [randomUUID(), agent.shift_id, session.agent_id, key, 'FARE_ACCEPTED', fareId, 0, JSON.stringify({ pointValue: row.point_value })]);
  return { duplicate: false, fare: row, snapshot: await currentSnapshot(client, session.agent_id, agent.shift_id) };
}

async function startTrip(client, session, body) {
  const key = idempotency(body);
  const state = await client.query(`SELECT a.*, s.status AS shift_status, s.ends_at FROM agent_shift_states a JOIN daily_shifts s ON s.id=a.shift_id WHERE a.agent_id=$1 FOR UPDATE`, [session.agent_id]);
  if (!state.rowCount) throw fail('agent_shift_not_initialized', 404);
  const agent = state.rows[0];
  const now = await trustedNow(client);
  const duplicate = await client.query('SELECT id FROM daily_shift_events WHERE idempotency_key=$1', [key]);
  if (duplicate.rowCount) return { duplicate: true, snapshot: await currentSnapshot(client, session.agent_id, agent.shift_id) };
  if (agent.status !== 'FARE_ACCEPTED') throw fail('trip_start_invalid_state');
  if (new Date(now) >= new Date(agent.ends_at)) throw fail('shift_cutoff');
  const fare = await client.query(`SELECT * FROM daily_fares WHERE claimed_by=$1 AND shift_id=$2 AND status='CLAIMED' ORDER BY claimed_at DESC LIMIT 1 FOR UPDATE`, [session.agent_id, agent.shift_id]);
  if (!fare.rowCount) throw fail('claimed_fare_not_found', 404);
  const f = fare.rows[0];
  const summary = getRouteSummary(f.pickup_location_id, f.destination_location_id);
  const choice = chooseRouteVariant(summary);
  if (!choice) throw fail('cached_route_not_found', 422);
  const route = summary[choice.variant];
  const tripId = randomUUID();
  await client.query(
    `INSERT INTO agent_trips (id,shift_id,agent_id,fare_id,origin_location_id,destination_location_id,route_variant,route_version,route_distance_meters,base_duration_seconds,trip_started_at,progress,status,next_action_at,route_decision)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::numeric,now(),0,'ON_TRIP',now()+($10::numeric * interval '1 second'),$11::jsonb)`,
    [tripId, agent.shift_id, session.agent_id, f.id, f.pickup_location_id, f.destination_location_id, choice.variant, summary.version, route.distanceMeters, route.durationSeconds, JSON.stringify(choice)]);
  await client.query(`UPDATE agent_shift_states SET status='ON_TRIP', active_trip_id=$1, current_route=$2::jsonb, route_started_at=now(), state_version=state_version+1, updated_at=now() WHERE id=$3`, [tripId, JSON.stringify(summary), agent.id]);
  await insertEvent(client, [randomUUID(), agent.shift_id, session.agent_id, key, 'TRIP_STARTED', f.id, 0, JSON.stringify({ tripId, route: choice })]);
  return { duplicate: false, snapshot: await currentSnapshot(client, session.agent_id, agent.shift_id) };
}

async function advanceTrip(client, session, body) {
  const key = idempotency(body);
  const state = await client.query(`SELECT a.*, s.ends_at FROM agent_shift_states a JOIN daily_shifts s ON s.id=a.shift_id WHERE a.agent_id=$1 FOR UPDATE`, [session.agent_id]);
  if (!state.rowCount) throw fail('agent_shift_not_initialized', 404);
  const agent = state.rows[0];
  const duplicate = await client.query('SELECT id FROM daily_shift_events WHERE idempotency_key=$1', [key]);
  if (duplicate.rowCount) return { duplicate: true, snapshot: await currentSnapshot(client, session.agent_id, agent.shift_id) };
  if (!agent.active_trip_id || !['ON_TRIP','EVENT_PENDING'].includes(agent.status)) throw fail('no_active_trip');
  const tripResult = await client.query('SELECT * FROM agent_trips WHERE id=$1 AND agent_id=$2 FOR UPDATE', [agent.active_trip_id, session.agent_id]);
  if (!tripResult.rowCount) throw fail('active_trip_not_found', 404);
  const trip = tripResult.rows[0];
  const now = await trustedNow(client);
  const projection = projectTrip({ baseDurationSeconds: Number(trip.base_duration_seconds), timeModifierSeconds: Number(trip.time_modifier_seconds), tripStartedAt: trip.trip_started_at, now });
  const totalFuel = calculateFuelCost(trip.route_distance_meters);
  const fuel = Math.max(0, Math.ceil(totalFuel * projection.progress) - Number(trip.gas_consumed || 0));
  const gasRemaining = Number(agent.gas_remaining) - fuel;
  const cutoff = new Date(now) >= new Date(agent.ends_at);
  const complete = projection.completed && !cutoff && gasRemaining >= 0;
  const stalled = gasRemaining < 0;
  const cutoffPark = cutoff && !complete && !stalled;
  const nextStatus = stalled ? 'STALLED' : cutoffPark ? 'PARKED' : complete ? 'COMPLETED' : 'ON_TRIP';
  await client.query(`UPDATE agent_trips SET progress=$1, gas_consumed=gas_consumed+$2, projected_arrival=$3, status=$4, next_action_at=$5, state_version=state_version+1 WHERE id=$6`, [projection.progress, fuel, projection.projectedArrival, nextStatus, projection.projectedArrival, trip.id]);
  await client.query(`UPDATE agent_shift_states SET gas_remaining=GREATEST(0,gas_remaining-$1), status=$2, active_trip_id=$3, fares_completed=fares_completed+$4, state_version=state_version+1, next_action_at=$5, updated_at=now() WHERE id=$6`, [fuel, stalled ? 'STALLED' : cutoffPark ? 'PARKED' : complete ? 'ACTIVE' : 'ON_TRIP', complete ? null : trip.id, complete ? 1 : 0, projection.projectedArrival, agent.id]);
  if (complete) await client.query(`UPDATE daily_fares SET status='COMPLETED', completed_at=now() WHERE id=$1`, [trip.fare_id]);
  let consumedCommand = null;
  if (complete) {
    const pending = await client.query(`SELECT * FROM agent_commands WHERE agent_id=$1 AND shift_id=$2 AND target='NEXT_DECISION' AND status='PENDING' AND expires_at > $3 ORDER BY created_at ASC LIMIT 1 FOR UPDATE`, [session.agent_id, agent.shift_id, now]);
    if (pending.rowCount) {
      const command = pending.rows[0];
      const transitionId = randomUUID();
      await client.query(`UPDATE agent_commands SET status='CONSUMED',consumed_at=$1,consuming_transition_id=$2 WHERE id=$3`, [now, transitionId, command.id]);
      await client.query(`UPDATE agent_shift_states SET strategy=$1::jsonb WHERE id=$2`, [JSON.stringify(command.payload), agent.id]);
      consumedCommand = { id: command.id, type: command.command_type, payload: command.payload, transitionId };
    }
  }
  await insertEvent(client, [randomUUID(), agent.shift_id, session.agent_id, key, complete ? 'FARE_COMPLETED' : stalled ? 'FARE_STALLED' : cutoffPark ? 'AGENT_PARKED' : 'TRIP_ADVANCED', trip.fare_id, -fuel, JSON.stringify({ progress: projection.progress, gasCost: fuel, cutoff })]);
  return { duplicate: false, consumedCommand, snapshot: await currentSnapshot(client, session.agent_id, agent.shift_id) };
}

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') return respond(response, 405, { error: 'method_not_allowed' });
  try {
    const session = await requireSession(request);
    if (!session) return respond(response, 401, { error: 'agent_session_required' });
    const body = bodyOf(request);
    const action = body.action;
    const result = await withDatabaseTransaction(async (client) => {
      if (action === 'claim_fare') return claimFare(client, session, body);
      if (action === 'start_trip') return startTrip(client, session, body);
      if (action === 'advance_trip') return advanceTrip(client, session, body);
      throw fail('unsupported_transition', 400);
    });
    return respond(response, 200, result);
  } catch (error) {
    if (error.code === 'DATABASE_URL_MISSING') return respond(response, 503, { error: 'database_unconfigured' });
    if (error.publicStatus) return respond(response, error.publicStatus, { error: error.message });
    console.error('agent transition failed', error);
    return respond(response, 500, { error: 'agent_transition_failed' });
  }
};
