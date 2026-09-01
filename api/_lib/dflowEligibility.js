function isQualifyingDflowSwap(row) {
  return row?.mode === 'STANDARD'
    && row.status === 'CONFIRMED'
    && row.confirmed_at != null
    && ['NORMAL', 'PRODUCTION_TEST'].includes(row.environment);
}

module.exports = { isQualifyingDflowSwap };
