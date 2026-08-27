const test = require('node:test');
const assert = require('node:assert/strict');
const { assertTransition, claimFare, startTrip, advanceTrip } = require('../api/_lib/agentStateMachine');

test('legal and illegal Agent transitions are enforced', () => {
  assert.equal(assertTransition('ACTIVE', 'EVALUATING_FARES'), 'EVALUATING_FARES');
  assert.throws(() => assertTransition('ON_TRIP', 'FARE_ACCEPTED'), /invalid_transition/);
});
test('fare claims are exclusive and idempotency data is retained', () => {
  const fare = { id: 'fare-1', expiresAt: '2027-01-01T00:00:00.000Z' };
  const agent = { id: 'agent-a', status: 'EVALUATING_FARES' };
  assert.equal(claimFare({ fare, agent, idempotencyKey: 'claim:1', now: '2026-01-01T00:00:00.000Z' }).claimedBy, 'agent-a');
  assert.throws(() => claimFare({ fare: { ...fare, claimedBy: 'agent-b' }, agent, idempotencyKey: 'claim:2', now: '2026-01-01T00:00:00.000Z' }), /fare_unavailable/);
});
test('trip starts with authoritative route and advances without browser state', () => {
  const trip = startTrip({ agent: { id: 'agent-a', status: 'FARE_ACCEPTED' }, fare: { id: 'fare-1', claimedBy: 'agent-a' }, route: { variant: 'alternative', version: 'routes-v1', distanceMeters: 1000, durationSeconds: 600, geometry: [[1, 2], [3, 4]] }, shiftId: 'shift-1', tripId: 'trip-1', now: '2026-01-01T00:00:00.000Z' });
  const advanced = advanceTrip({ trip, now: '2026-01-01T00:05:00.000Z', gasRemaining: 10, gasCost: 2, elapsedSeconds: 300, timeModifierSeconds: 720 - 600 });
  assert.equal(advanced.status, 'ON_TRIP');
  assert.equal(advanced.remainingSeconds, 420);
  assert.equal(advanced.progress, 300 / 720);
  assert.equal(advanced.routeVariant, 'alternative');
});
test('gas boundary stalls and completion boundary is safe', () => {
  const trip = startTrip({ agent: { id: 'a', status: 'FARE_ACCEPTED' }, fare: { id: 'f', claimedBy: 'a' }, route: { variant: 'primary', version: 'v1', distanceMeters: 1, durationSeconds: 600 }, shiftId: 's', tripId: 't', now: '2026-01-01T00:00:00.000Z' });
  assert.equal(advanceTrip({ trip, now: '2026-01-01T00:05:00.000Z', gasRemaining: 1, gasCost: 2, elapsedSeconds: 300 }).status, 'STALLED');
  assert.equal(advanceTrip({ trip, now: '2026-01-01T00:10:00.000Z', gasRemaining: 10, gasCost: 1, elapsedSeconds: 600, timeModifierSeconds: -120 }).status, 'COMPLETED');
});
