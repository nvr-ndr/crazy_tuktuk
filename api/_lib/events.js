function weightedChoice(items, random = Math.random()) {
  const candidates = (items || []).filter((item) => Number(item.weight) > 0);
  const total = candidates.reduce((sum, item) => sum + Number(item.weight), 0);
  if (!total) return null;
  let cursor = random * total;
  return candidates.find((item) => (cursor -= Number(item.weight)) < 0) || candidates[candidates.length - 1];
}

function applyEventEffects(state, effects = {}) {
  return {
    ...state,
    timeModifierSeconds: Number(state.timeModifierSeconds || 0) + Number(effects.timeSeconds || 0),
    gasModifier: Number(state.gasModifier || 0) + Number(effects.fuel || 0),
    scoreModifier: Number(state.scoreModifier || 0) + Number(effects.crazy || 0),
    tipModifier: Number(state.tipModifier || 0) + Number(effects.tip || 0)
  };
}

module.exports = { weightedChoice, applyEventEffects };
