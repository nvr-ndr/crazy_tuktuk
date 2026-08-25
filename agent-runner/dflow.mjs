import { spawn } from 'node:child_process';

const command = process.env.DFLOW_BINARY || 'dflow';
const developmentQuoteUrl = 'https://dev-quote-api.dflow.net';
let nextQuoteAt = 0;
const tokenMints = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
};

export class DflowQuoteError extends Error {
  constructor(message, status = 502, retryAfterMs = null) {
    super(message);
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

function run(args, { timeoutMs = 15_000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('DFlow CLI timed out'));
    }, timeoutMs);

    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) return resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
      reject(new Error(stderr.trim() || `DFlow CLI exited with code ${code}`));
    });
  });
}

export async function getDflowCliVersion() {
  const { stdout } = await run(['--version']);
  return stdout;
}

export function tradingIsExplicitlyEnabled() {
  return process.env.DFLOW_TRADING_ENABLED === 'true';
}

export function platformFeeConfiguration() {
  const bps = Number(process.env.DFLOW_PLATFORM_FEE_BPS || '50');
  if (!Number.isInteger(bps) || bps < 0 || bps > 10_000) {
    throw new Error('DFLOW_PLATFORM_FEE_BPS must be an integer from 0 to 10000');
  }
  const mode = process.env.DFLOW_PLATFORM_FEE_MODE || 'outputMint';
  if (mode !== 'inputMint' && mode !== 'outputMint') {
    throw new Error('DFLOW_PLATFORM_FEE_MODE must be inputMint or outputMint');
  }
  return { bps, mode, feeAccount: process.env.DFLOW_PLATFORM_FEE_ACCOUNT || null };
}

export function quoteConfiguration() {
  const apiUrl = new URL(process.env.DFLOW_TRADE_API_URL || developmentQuoteUrl);
  if (apiUrl.protocol !== 'https:') throw new Error('DFLOW_TRADE_API_URL must use HTTPS');
  return {
    apiUrl: apiUrl.toString().replace(/\/$/, ''),
    development: apiUrl.hostname === 'dev-quote-api.dflow.net',
    apiKeyConfigured: Boolean(process.env.DFLOW_API_KEY)
  };
}

function boundedUsd(value, fallback, name) {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100_000) throw new Error(`${name} must be a positive USD amount`);
  return parsed;
}

export function agentGuardrails() {
  const allowedSymbols = (process.env.DFLOW_ALLOWED_TOKENS || 'SOL,USDC,USDT')
    .split(',').map((symbol) => symbol.trim().toUpperCase()).filter((symbol) => tokenMints[symbol]);
  if (!allowedSymbols.length) throw new Error('At least one allowed DFlow token is required');
  return {
    allowedSymbols,
    allowedMints: new Set(allowedSymbols.map((symbol) => tokenMints[symbol])),
    maxTradeUsd: boundedUsd(process.env.DFLOW_MAX_TRADE_USD, 5, 'DFLOW_MAX_TRADE_USD'),
    maxDailyVolumeUsd: boundedUsd(process.env.DFLOW_MAX_DAILY_VOLUME_USD, 20, 'DFLOW_MAX_DAILY_VOLUME_USD'),
    maxWalletValueUsd: boundedUsd(process.env.DFLOW_MAX_WALLET_VALUE_USD, 25, 'DFLOW_MAX_WALLET_VALUE_USD')
  };
}

export function assertQuoteGuardrails({ inputMint, outputMint, notionalUsd }) {
  const guardrails = agentGuardrails();
  const value = Number(notionalUsd);
  if (!guardrails.allowedMints.has(inputMint) || !guardrails.allowedMints.has(outputMint)) {
    throw new DflowQuoteError('token_not_allowed_by_guardrails', 400);
  }
  if (!Number.isFinite(value) || value <= 0 || value > guardrails.maxTradeUsd) {
    throw new DflowQuoteError('quote_exceeds_max_trade_guardrail', 400);
  }
  return { ...guardrails, notionalUsd: value };
}

export function addPlatformFee(queryParams, modeOverride = null) {
  const fee = platformFeeConfiguration();
  if (!fee.feeAccount) throw new Error('DFLOW_PLATFORM_FEE_ACCOUNT is required for platform fees');
  const mode = modeOverride || fee.mode;
  if (mode !== 'inputMint' && mode !== 'outputMint') throw new Error('Invalid platform fee mode');
  queryParams.set('platformFeeBps', String(fee.bps));
  queryParams.set('platformFeeMode', mode);
  queryParams.set('feeAccount', fee.feeAccount);
  return { ...fee, mode };
}

export async function requestQuote({ inputMint, outputMint, amount, slippageBps = '100', platformFeeMode = null }) {
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(inputMint) || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(outputMint)) {
    throw new DflowQuoteError('inputMint and outputMint must be Solana mint addresses', 400);
  }
  if (!/^\d{1,30}$/.test(String(amount)) || BigInt(amount) <= 0n) {
    throw new DflowQuoteError('amount must be a positive scaled integer', 400);
  }
  if (!/^\d{1,5}$/.test(String(slippageBps)) || Number(slippageBps) > 10_000) {
    throw new DflowQuoteError('slippageBps must be an integer from 0 to 10000', 400);
  }

  const now = Date.now();
  if (now < nextQuoteAt) {
    throw new DflowQuoteError('DFlow development quote limit is 1 request per second', 429, nextQuoteAt - now);
  }
  nextQuoteAt = now + 1_000;

  const quote = quoteConfiguration();
  const url = new URL('/quote', quote.apiUrl);
  url.searchParams.set('inputMint', inputMint);
  url.searchParams.set('outputMint', outputMint);
  url.searchParams.set('amount', String(amount));
  url.searchParams.set('slippageBps', String(slippageBps));
  let fee;
  try {
    fee = addPlatformFee(url.searchParams, platformFeeMode);
  } catch {
    throw new DflowQuoteError('platform_fee_configuration_required', 503);
  }

  const headers = {};
  if (process.env.DFLOW_API_KEY) headers['x-api-key'] = process.env.DFLOW_API_KEY;
  let response;
  try {
    response = await fetch(url, { headers, signal: AbortSignal.timeout(10_000) });
  } catch {
    throw new DflowQuoteError('DFlow quote service is unavailable');
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new DflowQuoteError(payload.msg || 'DFlow quote was rejected', response.status === 429 ? 429 : 502);
  }
  return { quote: payload, fee };
}

export function tradingConfiguration() {
  // Buildathon development quotes are intentionally keyless. Production API
  // keys are optional here and only sent when an operator configures one.
  const missing = ['DFLOW_PASSPHRASE'].filter((key) => !process.env[key]);
  const fee = platformFeeConfiguration();
  if (!fee.feeAccount) missing.push('DFLOW_PLATFORM_FEE_ACCOUNT');
  return {
    enabled: tradingIsExplicitlyEnabled(),
    configured: missing.length === 0,
    missing,
    platformFee: fee
  };
}

// Execution is deliberately unavailable until a future, explicitly reviewed
// route applies the human-controlled funding and strategy guardrails.
export function assertTradingCanExecute() {
  const configuration = tradingConfiguration();
  if (!configuration.enabled) throw new Error('DFlow trading is disabled');
  if (!configuration.configured) throw new Error('DFlow trading configuration is incomplete');
}
