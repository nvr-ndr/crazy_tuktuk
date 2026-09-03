const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { recordEpochContributionBestEffort } = require('../api/_lib/rewardEpochConfirmation');

const ids = {
  contributionId: '00000000-0000-0000-0000-000000000001',
  initialEpochId: '00000000-0000-0000-0000-000000000002',
  nextEpochId: '00000000-0000-0000-0000-000000000003',
};

function contribution(pool) {
  return {
    ...ids,
    pool,
    playerWallet: `${pool.toLowerCase()}-wallet`,
    signature: `${pool.toLowerCase()}-signature`,
    amountAtomic: 250000n,
    confirmedAt: new Date('2026-09-03T10:00:00.000Z'),
    thresholdAtomic: 50000000n,
  };
}

async function successfulContributionUsesSharedPrimitive(pool) {
  const queries = [];
  const recorded = await recordEpochContributionBestEffort({
    async query(query) {
      queries.push(query);
      return { rows: [] };
    },
  }, contribution(pool), { warn() {} });

  assert.equal(recorded, true);
  assert.equal(queries[0], 'SAVEPOINT reward_epoch_contribution');
  assert.match(queries[1].text, /^SELECT \* FROM reward_record_epoch_contribution\(/);
  assert.equal(queries[1].values[3], pool);
  assert.equal(queries[1].values[4], `${pool.toLowerCase()}-wallet`);
  assert.equal(queries[1].values[5], `${pool.toLowerCase()}-signature`);
  assert.equal(queries[2], 'RELEASE SAVEPOINT reward_epoch_contribution');
}

async function failedRewardAccountingDoesNotAbortConfirmation() {
  const queries = [];
  const warnings = [];
  const recorded = await recordEpochContributionBestEffort({
    async query(query) {
      queries.push(query);
      if (typeof query === 'object') throw new Error('reward ledger unavailable');
      return { rows: [] };
    },
  }, contribution('STANDARD'), { warn: (...args) => warnings.push(args) });

  assert.equal(recorded, false);
  assert.equal(queries[0], 'SAVEPOINT reward_epoch_contribution');
  assert.match(queries[1].text, /^SELECT \* FROM reward_record_epoch_contribution\(/);
  assert.deepEqual(queries.slice(2), ['ROLLBACK TO SAVEPOINT reward_epoch_contribution', 'RELEASE SAVEPOINT reward_epoch_contribution']);
  assert.equal(warnings.length, 1);
}

async function failedPoolMeterUpdateDoesNotAbortConfirmation() {
  const queries = [];
  const recorded = await recordEpochContributionBestEffort({
    async query(query) {
      queries.push(query);
      if (String(query).includes('UPDATE reward_pool_balances')) throw new Error('pool meter unavailable');
      return { rows: [] };
    },
  }, contribution('AGENT'), {
    beforeRecord: client => client.query("UPDATE reward_pool_balances SET accrued_atomic=accrued_atomic+1 WHERE pool='AGENT'"),
    warn() {},
  });

  assert.equal(recorded, false);
  assert.equal(queries[0], 'SAVEPOINT reward_epoch_contribution');
  assert.match(queries[1], /UPDATE reward_pool_balances/);
  assert.deepEqual(queries.slice(2), ['ROLLBACK TO SAVEPOINT reward_epoch_contribution', 'RELEASE SAVEPOINT reward_epoch_contribution']);
}

function confirmedPathsDelegateToBestEffortPrimitive() {
  const standard = fs.readFileSync(path.join(__dirname, '..', 'api', '_handlers', 'standard.js'), 'utf8');
  const agent = fs.readFileSync(path.join(__dirname, 'server.mjs'), 'utf8');
  for (const source of [standard, agent]) {
    assert.match(source, /recordEpochContributionBestEffort/);
    assert.doesNotMatch(source, /INSERT INTO reward_epoch_contributions/);
    assert.doesNotMatch(source, /UPDATE reward_epochs SET pool_atomic/);
  }
  assert.match(standard, /withDatabaseTransaction\(async client =>/);
  assert.match(agent, /withDatabaseTransaction\(async client =>/);
}

(async () => {
  await successfulContributionUsesSharedPrimitive('STANDARD');
  await successfulContributionUsesSharedPrimitive('AGENT');
  await failedRewardAccountingDoesNotAbortConfirmation();
  await failedPoolMeterUpdateDoesNotAbortConfirmation();
  confirmedPathsDelegateToBestEffortPrimitive();
  console.log('reward epoch confirmation wiring tests passed');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
