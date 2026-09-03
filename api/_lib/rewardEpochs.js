const EPOCH_SCORE_ORDER = 'points DESC, days_played DESC, player_wallet ASC';
const REWARD_POOLS = new Set(['STANDARD', 'AGENT']);

function rankEpochScores(rows) {
  return [...rows].sort((left, right) => (
    Number(right.points) - Number(left.points)
    || Number(right.days_played) - Number(left.days_played)
    || String(left.player_wallet).localeCompare(String(right.player_wallet))
  ));
}

function epochContributionCall({
  contributionId,
  initialEpochId,
  nextEpochId,
  pool,
  playerWallet,
  signature,
  amountAtomic,
  confirmedAt,
  thresholdAtomic,
}) {
  if (!REWARD_POOLS.has(pool)) throw new Error('reward_pool_invalid');
  return {
    text: 'SELECT * FROM reward_record_epoch_contribution($1,$2,$3,$4,$5,$6,$7,$8,$9)',
    values: [
      contributionId,
      initialEpochId,
      nextEpochId,
      pool,
      playerWallet || null,
      signature,
      BigInt(amountAtomic).toString(),
      new Date(confirmedAt).toISOString(),
      BigInt(thresholdAtomic).toString(),
    ],
  };
}

module.exports = { EPOCH_SCORE_ORDER, REWARD_POOLS, epochContributionCall, rankEpochScores };
