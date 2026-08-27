const MIN_GAME_SWAP_USD = 1;
const FUEL_TIERS = [
  { minUsd: 1, maxUsd: 4.99, fuel: 3 }, { minUsd: 5, maxUsd: 9.99, fuel: 5 },
  { minUsd: 10, maxUsd: 24.99, fuel: 8 }, { minUsd: 25, maxUsd: 49.99, fuel: 12 },
  { minUsd: 50, maxUsd: 99.99, fuel: 16 }, { minUsd: 100, maxUsd: Infinity, fuel: 20 }
];

function calculateFuelEarned(usdValue) {
  const tier = FUEL_TIERS.find((item) => Number(usdValue) >= item.minUsd && Number(usdValue) <= item.maxUsd);
  return tier ? tier.fuel : 0;
}

function matchesFareCondition(swap, fare) {
  if (!swap || !fare) return { qualifies: false, reasons: [] };
  const reasons = [];
  if (Number(swap.usdValue) < MIN_GAME_SWAP_USD) reasons.push('MIN_USD_VALUE');
  const minimum = Number(fare.minimumUsd || 0);
  const condition = fare.condition;
  const categories = (input, output) => swap.inputCategory === input && swap.outputCategory === output;
  const qualifies = condition === 'ANY_SWAP' ? Number(swap.usdValue) >= MIN_GAME_SWAP_USD
    : condition === 'SOL_PAIR' ? (swap.inputToken === 'SOL' || swap.outputToken === 'SOL') && Number(swap.usdValue) >= minimum
    : condition === 'STABLE_TO_STABLE' ? categories('stable', 'stable') && Number(swap.usdValue) >= minimum
    : condition === 'STABLE_TO_VOLATILE' ? categories('stable', 'volatile') && Number(swap.usdValue) >= minimum
    : condition === 'VOLATILE_TO_STABLE' ? categories('volatile', 'stable') && Number(swap.usdValue) >= minimum
    : condition === 'MIN_USD' ? Number(swap.usdValue) >= minimum : false;
  if (qualifies) reasons.push(condition);
  return { qualifies, reasons };
}

function calculateFareEconomy({ pickupFuel, rideDistanceKm, rideDurationSeconds, hasAlternative = false }) {
  const totalFuel = Number(pickupFuel || 0) + Math.max(0, Math.ceil(Number(rideDistanceKm || 0) / 3));
  const longTripBonus = Math.floor(Number(rideDistanceKm || 0) / 4) * 5;
  const fuelPressureBonus = Math.max(0, totalFuel - 3) * 4;
  const alternativeBonus = hasAlternative ? 5 : 0;
  const pointValue = Math.min(120, Math.max(15, Math.round((20 + longTripBonus + fuelPressureBonus + alternativeBonus) / 5) * 5));
  return { totalFuel, durationSeconds: Number(rideDurationSeconds || 0), pointValue };
}

module.exports = { MIN_GAME_SWAP_USD, FUEL_TIERS, calculateFuelEarned, matchesFareCondition, calculateFareEconomy };
