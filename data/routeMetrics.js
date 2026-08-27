import { CONFIG } from './config.js';
import { getLocationById } from './locations.js?v=20260824world1';
import { getRouteVariantSummary } from './routeCacheSubset.js?v=20260827routes4';

const DEFAULT_TUK_SPEED_KMH = 22;

function haversineDistanceKm(fromId, toId) {
  const from = getLocationById(fromId);
  const to = getLocationById(toId);
  if (!from || !to) return Infinity;

  const [fromLng, fromLat] = from.geometry.coordinates;
  const [toLng, toLat] = to.geometry.coordinates;
  const toRadians = value => value * Math.PI / 180;
  const latDelta = toRadians(toLat - fromLat);
  const lngDelta = toRadians(toLng - fromLng);
  const a = Math.sin(latDelta / 2) ** 2
    + Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(lngDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getRouteMetrics(fromId, toId, variant = 'primary') {
  if (!fromId || !toId) return null;
  if (fromId === toId) {
    return {
      from: fromId,
      to: toId,
      source: 'stationary',
      variant,
      distanceMeters: 0,
      durationSeconds: 0,
      distanceKm: 0,
      fuelCost: 0,
      difficulty: 'CLEAR',
      hasAlternative: false,
    };
  }

  const summary = getRouteVariantSummary(fromId, toId);
  const selected = variant === 'alternative' && summary?.alternative ? summary.alternative : summary?.primary;
  const distanceKm = selected?.distanceMeters
    ? selected.distanceMeters / 1000
    : haversineDistanceKm(fromId, toId);
  const durationSeconds = selected?.durationSeconds
    || (Number.isFinite(distanceKm) ? (distanceKm / DEFAULT_TUK_SPEED_KMH) * 3600 : 0);
  const fuelCost = Number.isFinite(distanceKm)
    ? Math.max(1, Math.ceil(distanceKm * CONFIG.FUEL_PER_ROUTE_KM))
    : Infinity;

  return {
    from: fromId,
    to: toId,
    source: selected ? 'cached-subset' : 'fallback-estimate',
    variant: selected === summary?.alternative ? 'alternative' : 'primary',
    distanceMeters: Number.isFinite(distanceKm) ? Math.round(distanceKm * 1000) : Infinity,
    durationSeconds: Math.round(durationSeconds),
    distanceKm,
    fuelCost,
    difficulty: fuelCost >= 7 ? 'DIFFICULT' : fuelCost >= 4 ? 'MODERATE' : 'CLEAR',
    hasAlternative: Boolean(summary?.alternative),
  };
}

export function getCombinedRouteMetrics(legs) {
  const metrics = legs.map(({ fromId, toId, variant }) => getRouteMetrics(fromId, toId, variant));
  if (metrics.some(metric => !metric)) return null;
  const fuelCost = metrics.reduce((total, metric) => total + metric.fuelCost, 0);
  const distanceMeters = metrics.reduce((total, metric) => total + metric.distanceMeters, 0);
  const durationSeconds = metrics.reduce((total, metric) => total + metric.durationSeconds, 0);

  return {
    legs: metrics,
    source: metrics.every(metric => metric.source === 'cached-subset') ? 'cached-subset' : 'mixed',
    distanceMeters,
    durationSeconds,
    distanceKm: distanceMeters / 1000,
    fuelCost,
    difficulty: fuelCost >= 10 ? 'DIFFICULT' : fuelCost >= 6 ? 'MODERATE' : 'CLEAR',
    hasAlternative: metrics.some(metric => metric.hasAlternative),
  };
}

export function calculateFareEconomy({ currentLocationId, pickupLocationId, destinationLocationId, variant = 'primary' }) {
  const pickup = getRouteMetrics(currentLocationId, pickupLocationId);
  const ride = getRouteMetrics(pickupLocationId, destinationLocationId, variant);
  if (!pickup || !ride) return null;

  const totalFuel = pickup.fuelCost + ride.fuelCost;
  const totalDistanceKm = pickup.distanceKm + ride.distanceKm;
  const totalDurationSeconds = pickup.durationSeconds + ride.durationSeconds;
  const longTripBonus = Math.floor(totalDistanceKm / 4) * 5;
  const fuelPressureBonus = Math.max(0, totalFuel - 3) * 4;
  const alternativeBonus = ride.hasAlternative ? 5 : 0;
  const pointValue = Math.min(120, Math.max(15, Math.round((20 + longTripBonus + fuelPressureBonus + alternativeBonus) / 5) * 5));

  return {
    pickup,
    ride,
    source: pickup.source === 'cached-subset' && ride.source === 'cached-subset' ? 'cached-subset' : 'mixed',
    totalFuel,
    totalDistanceKm,
    totalDurationSeconds,
    pointValue,
    roadTrafficLevel: totalFuel >= 10 ? 'RED' : totalFuel >= 6 ? 'YELLOW' : 'GREEN',
    routeQuality: totalFuel >= 10 ? 'DIFFICULT' : totalFuel >= 6 ? 'MODERATE' : 'CLEAR',
    patienceMinutes: Math.max(
      CONFIG.FARE_EXPIRY_MINUTES,
      Math.min(CONFIG.FARE_EXPIRY_MAX_MINUTES, Math.ceil(totalDurationSeconds / 60) + 6)
    ),
  };
}
