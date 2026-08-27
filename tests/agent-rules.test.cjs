const test = require('node:test');
const assert = require('node:assert/strict');
const { chooseRouteVariant, calculateFuelCost, getRouteSummary } = require('../api/_lib/routes');
const { calculateFuelEarned, matchesFareCondition } = require('../api/_lib/agentRules');
const { applyEventEffects, weightedChoice } = require('../api/_lib/events');
const { consumeGas } = require('../api/_lib/gas');

test('route cache exposes deterministic metrics and primary fallback', () => {
  const summary = getRouteSummary('old_khao_san', 'yao_yaowarat_road');
  assert.ok(summary);
  assert.equal(summary.version, '20260827routes4');
  assert.ok(['primary', 'alternative'].includes(chooseRouteVariant(summary).variant));
  assert.equal(calculateFuelCost(3000), 1);
});

test('fare and fuel rules preserve existing thresholds', () => {
  assert.equal(calculateFuelEarned(3), 3);
  assert.equal(calculateFuelEarned(0.5), 0);
  assert.equal(matchesFareCondition({ usdValue: 3 }, { condition: 'ANY_SWAP' }).qualifies, true);
  assert.equal(matchesFareCondition({ usdValue: 1 }, { condition: 'MIN_USD', minimumUsd: 2 }).qualifies, false);
});

test('event effects and gas are pure and bounded', () => {
  assert.deepEqual(applyEventEffects({}, { timeSeconds: 3, fuel: -2, crazy: 20 }), { timeModifierSeconds: 3, gasModifier: -2, scoreModifier: 20, tipModifier: 0 });
  assert.equal(weightedChoice([{ id: 'a', weight: 1 }], 0).id, 'a');
  assert.deepEqual(consumeGas(2, 5), { before: 2, spent: 2, remaining: 0, stalled: true });
});
