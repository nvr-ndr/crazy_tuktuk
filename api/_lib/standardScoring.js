const CONDITION_BONUS = {
  ANY_SWAP: 0, MIN_USD: 4, SOL_PAIR: 6,
  STABLE_TO_STABLE: 3, STABLE_TO_VOLATILE: 7, VOLATILE_TO_STABLE: 9,
};
const STAR_MULTIPLIER = { 1: 0.8, 2: 0.9, 3: 1, 4: 1.1, 5: 1.2 };
const SCORE_CAP = 120;

function calculateStandardFareScore({ distanceKm = 0, totalFuel = 0, condition = 'ANY_SWAP', finalStars = 3, eventPoints = 0, zoneMultiplier = 1 }) {
  const distance = Math.max(0, Math.min(100, Number(distanceKm) || 0));
  const fuel = Math.max(0, Math.min(100, Number(totalFuel) || 0));
  const stars = Number(finalStars);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) throw new Error('invalid_standard_stars');
  const objectiveRaw = 10 + distance * 3.5 + Math.max(0, fuel - 2) * 3 + (CONDITION_BONUS[condition] ?? 0);
  const objectiveFareValue = Math.min(SCORE_CAP, Math.max(15, Math.round(objectiveRaw / 5) * 5));
  const passengerMultiplier = STAR_MULTIPLIER[stars];
  const boundedEventPoints = Math.max(-40, Math.min(40, Number(eventPoints) || 0));
  const appliedZoneMultiplier = Math.max(1, Math.min(1.25, Number(zoneMultiplier) || 1));
  const finalScore = Math.max(0, Math.round((objectiveFareValue * passengerMultiplier + boundedEventPoints) * appliedZoneMultiplier));
  return { objectiveFareValue, passengerMultiplier, zoneMultiplier: appliedZoneMultiplier, eventPoints: boundedEventPoints, finalScore };
}

module.exports = { CONDITION_BONUS, STAR_MULTIPLIER, SCORE_CAP, calculateStandardFareScore };
