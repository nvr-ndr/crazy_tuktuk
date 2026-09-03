const { allocatePrizePool } = require('./rewards');
const { rankEpochScores } = require('./rewardEpochs');

const MAINNET_USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const dueEpochQuery = `SELECT id,pool,status,threshold_atomic,pool_atomic,payout_at
  FROM reward_epochs
  WHERE pool=$1 AND status='PAYOUT_PENDING' AND payout_at IS NOT NULL AND payout_at <= now()
  ORDER BY payout_at ASC
  FOR UPDATE`;

function settlementNetwork(env = process.env) {
  const rpc = String(env.SOLANA_RPC_URL || '').trim();
  const mint = String(env.REWARD_MINT || '').trim();
  const configuredTestMint = String(env.REWARD_TEST_MINT || '').trim();
  // Allow the local env file to reference the configured test mint without
  // duplicating a value alongside local wallet credentials.
  const testMint = configuredTestMint === '${REWARD_MINT}' ? mint : configuredTestMint;
  const devnetRpc = /^https?:\/\/[^/]*devnet[^/]*/i.test(rpc);
  const enabled = env.REWARD_DEVNET_ENABLED === 'true' && devnetRpc && Boolean(mint) && mint === testMint && mint !== MAINNET_USDC_MINT;
  return { enabled, rpc, mint, reason: enabled ? null : 'devnet_reward_payout_not_enabled' };
}

function payoutEntries({ poolAtomic, scores }) {
  const ranked = rankEpochScores(scores).slice(0, 3);
  if (ranked.length !== 3) return [];
  return allocatePrizePool(poolAtomic, ranked).map((entry) => ({ playerWallet: entry.player_wallet, rank: entry.rank, shareBps: entry.shareBps, amountAtomic: entry.amountAtomic }));
}

module.exports = { MAINNET_USDC_MINT, dueEpochQuery, settlementNetwork, payoutEntries };
