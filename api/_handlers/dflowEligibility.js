const { withDatabase } = require('../_lib/db');

function validWallet(value) {
  return typeof value === 'string' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
}

module.exports = async function handler(request, response) {
  const wallet = request.query?.wallet;
  if (request.method !== 'GET') return response.status(405).json({ error: 'method_not_allowed' });
  if (!validWallet(wallet)) return response.status(400).json({ error: 'solana_wallet_required' });
  try {
    const result = await withDatabase((client) => client.query(
      `SELECT COUNT(*)::int AS count
       FROM standard_transactions
       WHERE player_wallet = $1
         AND mode = 'STANDARD'
         AND status = 'CONFIRMED'
         AND confirmed_at IS NOT NULL
         AND environment IN ('NORMAL', 'PRODUCTION_TEST')`,
      [wallet]
    ));
    const qualifyingSwapCount = Number(result.rows[0]?.count || 0);
    return response.status(200).json({ eligible: qualifyingSwapCount > 0, qualifyingSwapCount });
  } catch (error) {
    console.error('DFlow eligibility lookup failed', error);
    return response.status(503).json({ error: 'dflow_eligibility_unavailable' });
  }
};
