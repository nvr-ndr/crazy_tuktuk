const assert = require('node:assert/strict');

const {
  dueEpochQuery,
  payoutEntries,
  settlementNetwork,
} = require('../api/_lib/rewardSettlement');

assert.match(dueEpochQuery, /status='PAYOUT_PENDING'/);
assert.match(dueEpochQuery, /payout_at <= now\(\)/);
assert.match(dueEpochQuery, /pool/);
assert.match(dueEpochQuery, /FOR UPDATE/);

const entries = payoutEntries({
  poolAtomic: 101n,
  scores: [
    { player_wallet: 'z', points: 5, days_played: 1 },
    { player_wallet: 'b', points: 10, days_played: 2 },
    { player_wallet: 'a', points: 10, days_played: 2 },
    { player_wallet: 'c', points: 9, days_played: 3 },
  ],
});
assert.deepEqual(entries.map(({ playerWallet, rank, shareBps, amountAtomic }) => [playerWallet, rank, shareBps, amountAtomic]), [
  ['a', 1, 6000, 60n], ['b', 2, 2500, 25n], ['c', 3, 1500, 16n],
]);
assert.equal(payoutEntries({ poolAtomic: 100n, scores: [{ player_wallet: 'only', points: 1, days_played: 1 }] }).length, 0);

const validNetwork = settlementNetwork({
  REWARD_DEVNET_ENABLED: 'true',
  SOLANA_RPC_URL: 'https://api.devnet.solana.com',
  REWARD_MINT: 'DevnetTestMint1111111111111111111111111111111',
  REWARD_TEST_MINT: 'DevnetTestMint1111111111111111111111111111111',
});
assert.equal(validNetwork.enabled, true);
assert.equal(settlementNetwork({
  REWARD_DEVNET_ENABLED: 'true', SOLANA_RPC_URL: 'https://api.mainnet-beta.solana.com',
  REWARD_MINT: 'DevnetTestMint1111111111111111111111111111111', REWARD_TEST_MINT: 'DevnetTestMint1111111111111111111111111111111',
}).enabled, false);
assert.equal(settlementNetwork({
  REWARD_DEVNET_ENABLED: 'true', SOLANA_RPC_URL: 'https://api.devnet.solana.com',
  REWARD_MINT: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', REWARD_TEST_MINT: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
}).enabled, false);

const source = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'api', '_handlers', 'rewards.js'), 'utf8');
assert.match(source, /ON CONFLICT \(pool,epoch_id\)/);
assert.match(source, /ON CONFLICT \(pool,epoch_id\) WHERE epoch_id IS NOT NULL/);
assert.doesNotMatch(source, /ON CONFLICT \(trigger_key\)/);
assert.doesNotMatch(source, /daily_reward_awards/);
assert.doesNotMatch(source, /standard_daily_reward_awards/);
assert.match(source, /request\.method === 'POST'/);
assert.match(source, /status IN \('PENDING','FAILED'\)/);
assert.doesNotMatch(source, /status IN \('SUBMITTED','PARTIAL','CONFIRMED'\)/);
assert.match(source, /\['READY','SUBMITTED','PARTIAL'\]\.includes\(batch\.status\)/);

console.log('reward epoch settlement tests passed');
