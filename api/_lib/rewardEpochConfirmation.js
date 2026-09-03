const { epochContributionCall } = require('./rewardEpochs');

async function recordEpochContributionBestEffort(client, contribution, { beforeRecord, warn = console.warn } = {}) {
  await client.query('SAVEPOINT reward_epoch_contribution');
  try {
    if (beforeRecord) await beforeRecord(client);
    await client.query(epochContributionCall(contribution));
    await client.query('RELEASE SAVEPOINT reward_epoch_contribution');
    return true;
  } catch (error) {
    try {
      await client.query('ROLLBACK TO SAVEPOINT reward_epoch_contribution');
      await client.query('RELEASE SAVEPOINT reward_epoch_contribution');
    } catch {
      // The confirmed swap transaction remains the source of truth even if
      // reward accounting cleanup is unavailable.
    }
    warn('reward epoch contribution was not recorded', error);
    return false;
  }
}

module.exports = { recordEpochContributionBestEffort };
