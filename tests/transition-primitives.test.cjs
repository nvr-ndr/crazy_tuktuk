const test = require('node:test');
const assert = require('node:assert/strict');
const { withTransaction } = require('../api/_lib/db');
const { CLAIM_DUE_STATES_SQL, makeLeaseToken } = require('../api/_lib/transition');
const { validateIdempotencyKey, transitionKey } = require('../api/_lib/idempotency');
const { projectTrip } = require('../api/_lib/trip');

test('transaction helper commits and rolls back', async () => {
  const calls = [];
  const client = { query: async (sql) => { calls.push(sql); if (sql === 'FAIL') throw new Error('boom'); } };
  await withTransaction(client, async () => 'ok');
  assert.deepEqual(calls, ['BEGIN', 'COMMIT']);
  await assert.rejects(() => withTransaction(client, async () => { throw new Error('boom'); }));
  assert.deepEqual(calls.slice(2), ['BEGIN', 'ROLLBACK']);
});

test('trip projection preserves elapsed progress when duration changes', () => {
  const projection = projectTrip({ tripStartedAt: '2026-01-01T00:00:00.000Z', now: '2026-01-01T00:05:00.000Z', baseDurationSeconds: 600, timeModifierSeconds: 120, elapsedSeconds: 300 });
  assert.equal(projection.durationSeconds, 720);
  assert.equal(projection.progress, 300 / 720);
  assert.equal(projection.remainingSeconds, 420);
  const shortcut = projectTrip({ tripStartedAt: '2026-01-01T00:00:00.000Z', now: '2026-01-01T00:05:00.000Z', baseDurationSeconds: 600, timeModifierSeconds: -120, elapsedSeconds: 300 });
  assert.equal(shortcut.durationSeconds, 480);
  assert.equal(shortcut.remainingSeconds, 180);
  const crossed = projectTrip({ tripStartedAt: '2026-01-01T00:00:00.000Z', now: '2026-01-01T00:11:00.000Z', baseDurationSeconds: 600, timeModifierSeconds: -120, elapsedSeconds: 660 });
  assert.equal(crossed.completed, true);
  assert.equal(crossed.remainingSeconds, 0);
});

test('due-state claim uses row locks and skip-locked batching', () => {
  assert.match(CLAIM_DUE_STATES_SQL, /FOR UPDATE SKIP LOCKED/);
  assert.match(CLAIM_DUE_STATES_SQL, /LIMIT \$1/);
  assert.notEqual(makeLeaseToken(), makeLeaseToken());
});

test('idempotency keys are validated and deterministic', () => {
  assert.equal(validateIdempotencyKey('fare:abc:123456'), true);
  assert.equal(validateIdempotencyKey('short'), false);
  assert.equal(transitionKey({ agentId: 'a', shiftId: 's', action: 'advance', version: 2 }), 'a:s:advance:2');
});
