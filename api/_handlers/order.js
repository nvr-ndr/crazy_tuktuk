const DFLOW_ORDER_URL = process.env.DFLOW_ORDER_URL || 'https://dev-quote-api.dflow.net/order';
const { addPlatformFeeParams } = require('../_lib/dflowFees');
const TEST_MODE_MAX_SOL = Number(process.env.PRODUCTION_TEST_MAX_SOL || '0.01');

const TOKEN_MINTS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6HhH8rA7s7F1pPB263',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  PENGU: '2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv'
};

function sendJson(response, status, body) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(body));
}

module.exports = async function handler(request, response) {
  if (request.method !== 'GET') {
    return sendJson(response, 405, { error: 'method_not_allowed' });
  }

  const apiKey = process.env.DFLOW_API_KEY;

  const inputMint = TOKEN_MINTS[request.query.inputMint] || request.query.inputMint;
  const outputMint = TOKEN_MINTS[request.query.outputMint] || request.query.outputMint;
  const amount = String(request.query.amount || '');
  const slippageBps = String(request.query.slippageBps || '50');
  const testMode = String(request.query.testMode || '').toLowerCase() === 'true';

  if (!inputMint || !outputMint || inputMint === outputMint || !/^\d+$/.test(amount) || amount === '0') {
    return sendJson(response, 400, { error: 'invalid_order_parameters' });
  }
  if (testMode) {
    if (process.env.PRODUCTION_TEST_MODE_ENABLED !== 'true') return sendJson(response, 403, { error: 'production_test_mode_disabled' });
    const allowedPair = (inputMint === TOKEN_MINTS.SOL && outputMint === TOKEN_MINTS.USDC)
      || (inputMint === TOKEN_MINTS.USDC && outputMint === TOKEN_MINTS.SOL);
    if (!allowedPair) return sendJson(response, 400, { error: 'production_test_pair_not_allowed' });
    if (inputMint === TOKEN_MINTS.SOL && (!Number.isFinite(TEST_MODE_MAX_SOL) || Number(amount) > Math.floor(TEST_MODE_MAX_SOL * 1e9))) {
      return sendJson(response, 400, { error: 'production_test_amount_exceeds_limit', maxAtomicAmount: Math.floor(TEST_MODE_MAX_SOL * 1e9) });
    }
  }

  const orderUrl = new URL(DFLOW_ORDER_URL);
  orderUrl.searchParams.set('inputMint', inputMint);
  orderUrl.searchParams.set('outputMint', outputMint);
  orderUrl.searchParams.set('amount', amount);
  orderUrl.searchParams.set('slippageBps', slippageBps);
  try {
    addPlatformFeeParams(orderUrl);
  } catch (error) {
    return sendJson(response, 503, { error: 'dflow_platform_fee_unconfigured' });
  }
  if (request.query.userPublicKey) {
    orderUrl.searchParams.set('userPublicKey', request.query.userPublicKey);
  }

  try {
    const headers = apiKey ? { 'x-api-key': apiKey } : {};
    const dflowResponse = await fetch(orderUrl, { headers });
    const body = await dflowResponse.text();
    response.statusCode = dflowResponse.status;
    response.setHeader('Content-Type', dflowResponse.headers.get('content-type') || 'application/json');
    response.setHeader('Cache-Control', 'no-store');
    response.end(body);
  } catch (error) {
    sendJson(response, 502, { error: 'dflow_unreachable', message: error.message });
  }
};
