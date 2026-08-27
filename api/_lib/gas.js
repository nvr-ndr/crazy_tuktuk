function clampGas(value, maximum = Infinity) { return Math.max(0, Math.min(Number(maximum), Number(value) || 0)); }
function consumeGas(remaining, amount) {
  const before = clampGas(remaining);
  const spent = Math.min(before, Math.max(0, Number(amount) || 0));
  return { before, spent, remaining: before - spent, stalled: spent < Math.max(0, Number(amount) || 0) };
}
module.exports = { clampGas, consumeGas };
