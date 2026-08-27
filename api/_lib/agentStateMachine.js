const VALID_STATES = new Set(['READY_NEXT_SHIFT', 'ACTIVE', 'EVALUATING_FARES', 'FARE_ACCEPTED', 'ROUTE_SELECTED', 'ON_TRIP', 'STALLED', 'PARKED', 'SHIFT_COMPLETE']);
const transitions = {
  READY_NEXT_SHIFT: new Set(['ACTIVE']), ACTIVE: new Set(['EVALUATING_FARES', 'SHIFT_COMPLETE', 'UNDERFUNDED']),
  EVALUATING_FARES: new Set(['ACTIVE', 'FARE_ACCEPTED']), FARE_ACCEPTED: new Set(['ROUTE_SELECTED']),
  ROUTE_SELECTED: new Set(['ON_TRIP']), ON_TRIP: new Set(['ON_TRIP', 'TRIP_COMPLETED', 'STALLED', 'PARKED']),
  STALLED: new Set(['SHIFT_COMPLETE']), PARKED: new Set(['SHIFT_COMPLETE']), SHIFT_COMPLETE: new Set()
};

function assertState(state) { if (!VALID_STATES.has(state)) throw new Error('invalid_agent_state'); }
function assertTransition(from, to) { assertState(from); if (to === 'TRIP_COMPLETED') to = 'ACTIVE'; if (!transitions[from]?.has(to)) throw new Error(`invalid_transition:${from}->${to}`); return to; }

function claimFare({ fare, agent, idempotencyKey, now = new Date() }) {
  if (!fare || fare.expiresAt <= new Date(now).toISOString()) throw new Error('fare_expired_or_missing');
  if (fare.claimedBy && fare.claimedBy !== agent.id) throw new Error('fare_unavailable');
  if (agent.status !== 'EVALUATING_FARES') throw new Error('agent_not_observing_fares');
  return { ...fare, claimedBy: agent.id, claimedAt: new Date(now).toISOString(), claimKey: idempotencyKey };
}

function startTrip({ agent, fare, route, shiftId, tripId, now = new Date() }) {
  if (agent.status !== 'FARE_ACCEPTED' || fare.claimedBy !== agent.id) throw new Error('fare_not_accepted_by_agent');
  if (!route?.variant || !route?.version || !Number.isFinite(Number(route.distanceMeters)) || !Number.isFinite(Number(route.durationSeconds))) throw new Error('authoritative_route_required');
  const started = new Date(now).toISOString();
  return { id: tripId, shiftId, agentId: agent.id, fareId: fare.id, routeVariant: route.variant, routeVersion: route.version, routeGeometry: route.geometry || null, routeDistanceMeters: Number(route.distanceMeters), baseDurationSeconds: Number(route.durationSeconds), tripStartedAt: started, progress: 0, timeModifierSeconds: 0, gasModifier: 0, scoreModifier: 0, status: 'ON_TRIP', nextActionAt: started };
}

function advanceTrip({ trip, now, gasRemaining, gasCost = 0, elapsedSeconds, timeModifierSeconds = trip.timeModifierSeconds }) {
  if (!trip || trip.status !== 'ON_TRIP') throw new Error('trip_not_active');
  const base = Number(trip.baseDurationSeconds); const duration = Math.max(0, base + Number(timeModifierSeconds || 0));
  const elapsed = Math.max(0, Number(elapsedSeconds ?? ((new Date(now).getTime() - new Date(trip.tripStartedAt).getTime()) / 1000)));
  const completed = Math.max(0, elapsed); const remaining = Math.max(0, duration - completed);
  const gas = Math.max(0, Number(gasRemaining) - Math.max(0, Number(gasCost)));
  const status = gasCost > Number(gasRemaining) ? 'STALLED' : remaining === 0 ? 'COMPLETED' : 'ON_TRIP';
  return { ...trip, progress: duration ? Math.min(1, completed / duration) : 1, timeModifierSeconds: Number(timeModifierSeconds || 0), gasRemaining: gas, status, projectedArrival: new Date(new Date(now).getTime() + remaining * 1000).toISOString(), remainingSeconds: remaining };
}

module.exports = { VALID_STATES, assertTransition, claimFare, startTrip, advanceTrip };
