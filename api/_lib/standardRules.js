function normalizeEnvironment(value) {
  return value === 'PRODUCTION_TEST' ? 'PRODUCTION_TEST' : 'NORMAL';
}

function rankStandardRows(rows) {
  return [...rows]
    .filter((row) => normalizeEnvironment(row.environment) === row.environment)
    .sort((a, b) => Number(b.score || 0) - Number(a.score || 0)
      || Number(b.completedFares || 0) - Number(a.completedFares || 0)
      || String(a.playerWallet || a.wallet || '').localeCompare(String(b.playerWallet || b.wallet || '')))
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

function standardAwardWinners(rows, minimumWinners = 3) {
  const ranked = rankStandardRows(rows);
  return ranked.length >= minimumWinners ? ranked.slice(0, minimumWinners) : [];
}

module.exports = { normalizeEnvironment, rankStandardRows, standardAwardWinners };
