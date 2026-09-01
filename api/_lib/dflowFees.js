function getPlatformFeeConfig(env = process.env) {
  const rawBps = env.DFLOW_PLATFORM_FEE_BPS;
  const bps = Number(rawBps ?? 50);
  const mode = env.DFLOW_PLATFORM_FEE_MODE || 'outputMint';
  const feeAccount = env.DFLOW_PLATFORM_FEE_ACCOUNT;

  if (!Number.isInteger(bps) || bps < 0 || bps > 10000) {
    const error = new Error('DFLOW_PLATFORM_FEE_BPS must be an integer from 0 to 10000');
    error.code = 'DFLOW_PLATFORM_FEE_INVALID_BPS';
    throw error;
  }
  if (!['inputMint', 'outputMint'].includes(mode)) {
    const error = new Error('DFLOW_PLATFORM_FEE_MODE must be inputMint or outputMint');
    error.code = 'DFLOW_PLATFORM_FEE_INVALID_MODE';
    throw error;
  }
  if (!feeAccount) {
    const error = new Error('DFLOW_PLATFORM_FEE_ACCOUNT is required');
    error.code = 'DFLOW_PLATFORM_FEE_ACCOUNT_MISSING';
    throw error;
  }
  return { bps, mode, feeAccount };
}

function addPlatformFeeParams(url, env = process.env) {
  const fee = getPlatformFeeConfig(env);
  url.searchParams.set('platformFeeBps', String(fee.bps));
  url.searchParams.set('platformFeeMode', fee.mode);
  url.searchParams.set('feeAccount', fee.feeAccount);
  return fee;
}

module.exports = { getPlatformFeeConfig, addPlatformFeeParams };
