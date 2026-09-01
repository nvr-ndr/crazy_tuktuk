const REWARD_WALLET = process.env.REWARD_TREASURY_WALLET || 'eAifgpmygs8UuhQpjpjmw1dzxW5xdM2LJMF5rnXPGug';
const REWARD_MINT = process.env.REWARD_MINT || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const DAILY_POOL_USDC = process.env.REWARD_DAILY_POOL_USDC || '1';
const SETTLEMENT_THRESHOLD_USDC = process.env.REWARD_SETTLEMENT_THRESHOLD_USDC || DAILY_POOL_USDC;
const MIN_WINNERS = Math.max(3, Number.parseInt(process.env.REWARD_MIN_WINNERS || '3', 10));

function atomicUsdc(value) {
  const text = String(value).trim();
  if (!/^\d+(?:\.\d{1,6})?$/.test(text)) throw new Error('invalid_reward_pool');
  const [whole, fraction = ''] = text.split('.');
  return BigInt(whole) * 1000000n + BigInt((fraction + '000000').slice(0, 6));
}

function allocatePrizePool(poolAtomic, winners) {
  const pool = BigInt(poolAtomic);
  const shares = [6000, 2500, 1500];
  return winners.slice(0, 3).map((winner, index) => ({
    ...winner,
    rank: index + 1,
    shareBps: shares[index],
    amountAtomic: index === 2 ? pool - (pool * 6000n / 10000n) - (pool * 2500n / 10000n) : pool * BigInt(shares[index]) / 10000n
  }));
}

function shouldSettle({ unpaidAtomic, treasuryAtomic, thresholdAtomic }) {
  const unpaid = BigInt(unpaidAtomic);
  return unpaid >= BigInt(thresholdAtomic) && BigInt(treasuryAtomic) >= unpaid;
}

function formatAtomic(value) {
  const amount = BigInt(value);
  const whole = amount / 1000000n;
  const fraction = (amount % 1000000n).toString().padStart(6, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : String(whole);
}

async function readTreasuryBalanceAtomic() {
  const rpc = process.env.SOLANA_RPC_URL || 'https://solana-rpc.publicnode.com';
  const response = await fetch(rpc, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getTokenAccountsByOwner', params: [REWARD_WALLET, { mint: REWARD_MINT }, { encoding: 'jsonParsed' }] })
  });
  if (!response.ok) throw new Error(`treasury_rpc_${response.status}`);
  const body = await response.json();
  if (body.error) throw new Error('treasury_rpc_error');
  return (body.result?.value || []).reduce((total, account) => total + BigInt(account.account?.data?.parsed?.info?.tokenAmount?.amount || 0), 0n);
}

module.exports = { REWARD_WALLET, REWARD_MINT, DAILY_POOL_USDC, SETTLEMENT_THRESHOLD_USDC, MIN_WINNERS, atomicUsdc, allocatePrizePool, shouldSettle, formatAtomic, readTreasuryBalanceAtomic };
