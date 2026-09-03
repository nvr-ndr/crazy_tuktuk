const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const {
  EPOCH_SCORE_ORDER,
  epochContributionCall,
  rankEpochScores,
} = require('../api/_lib/rewardEpochs');

assert.equal(EPOCH_SCORE_ORDER, 'points DESC, days_played DESC, player_wallet ASC');
assert.deepEqual(
  rankEpochScores([
    { player_wallet: 'z', points: 20, days_played: 2 },
    { player_wallet: 'b', points: 20, days_played: 3 },
    { player_wallet: 'a', points: 20, days_played: 3 },
    { player_wallet: 'c', points: 21, days_played: 1 },
  ]).map((row) => row.player_wallet),
  ['c', 'a', 'b', 'z'],
);

const call = epochContributionCall({
  contributionId: '00000000-0000-0000-0000-000000000001',
  initialEpochId: '00000000-0000-0000-0000-000000000002',
  nextEpochId: '00000000-0000-0000-0000-000000000003',
  pool: 'STANDARD',
  playerWallet: 'wallet',
  signature: 'signature',
  amountAtomic: 123n,
  confirmedAt: new Date('2026-09-03T10:00:00.000Z'),
  thresholdAtomic: 50000000n,
});
assert.match(call.text, /^SELECT \* FROM reward_record_epoch_contribution\(/);
assert.deepEqual(call.values.slice(0, 6), [
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  'STANDARD',
  'wallet',
  'signature',
]);
assert.deepEqual(call.values.slice(6, 8), ['123', '2026-09-03T10:00:00.000Z']);
assert.equal(call.values[8], '50000000');
assert.throws(() => epochContributionCall({ pool: 'DEMO' }), /reward_pool_invalid/);

const schema = readFileSync(join(__dirname, 'db', 'schema.sql'), 'utf8');
assert.match(
  schema,
  /SET status = 'PAYOUT_PENDING',\s+threshold_reached_at = COALESCE\(reward_epochs\.threshold_reached_at, p_confirmed_at\),\s+payout_at = COALESCE\(reward_epochs\.payout_at, p_confirmed_at \+ interval '1 hour'\)/s,
  'PL/pgSQL output fields must not shadow reward_epochs columns in the threshold update',
);
assert.match(
  schema,
  /AND reward_epochs\.threshold_reached_at IS NOT NULL\s+AND p_confirmed_at <= reward_epochs\.threshold_reached_at\s+ORDER BY reward_epochs\.threshold_reached_at DESC/s,
  'PL/pgSQL output fields must not shadow reward_epochs columns in cutoff selection',
);
assert.match(
  schema,
  /UPDATE reward_epochs SET pool_atomic = reward_epochs\.pool_atomic \+ p_amount_atomic/,
  'PL/pgSQL output fields must not shadow reward_epochs columns in pool increments',
);
assert.match(
  schema,
  /ALTER TABLE reward_epochs ADD CONSTRAINT reward_epochs_id_pool_uq UNIQUE \(id, pool\);\s+END IF;\s+EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;/s,
  'the additive epoch composite key must tolerate a pre-existing relation name on rerun',
);

console.log('reward epoch primitives tests passed');
