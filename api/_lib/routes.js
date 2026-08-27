const fs = require('node:fs');
const path = require('node:path');

const ROUTE_CACHE_VERSION = '20260827routes4';
let routeCache;

function loadRouteCache() {
  if (routeCache) return routeCache;
  const source = fs.readFileSync(path.join(__dirname, '../../data/routeCacheSubset.js'), 'utf8');
  const match = source.match(/export const CACHED_ROUTE_SUBSET = (\[[\s\S]*?\]);/);
  if (!match) throw new Error('cached_route_subset_unavailable');
  routeCache = JSON.parse(match[1]);
  return routeCache;
}

function getRouteSummary(fromId, toId) {
  const routes = loadRouteCache();
  const exact = routes.find((route) => route.from === fromId && route.to === toId);
  const reverse = exact ? null : routes.find((route) => route.from === toId && route.to === fromId);
  const route = exact || reverse;
  if (!route) return null;
  return {
    version: ROUTE_CACHE_VERSION,
    from: fromId, to: toId, reversed: Boolean(reverse),
    primary: route.primary && { distanceMeters: route.primary.distanceMeters, durationSeconds: route.primary.durationSeconds },
    alternative: route.alternative && { distanceMeters: route.alternative.distanceMeters, durationSeconds: route.alternative.durationSeconds }
  };
}

function chooseRouteVariant(summary) {
  if (!summary?.primary) return null;
  if (!summary.alternative) return { variant: 'primary', reason: 'primary_is_only_cached_route' };
  const cost = (route) => Number(route.distanceMeters) + Number(route.durationSeconds) * 2;
  const primaryCost = cost(summary.primary);
  const alternativeCost = cost(summary.alternative);
  return alternativeCost < primaryCost * 0.97
    ? { variant: 'alternative', reason: 'alternative_is_at_least_3_percent_lower_cost' }
    : { variant: 'primary', reason: 'primary_is_preferred_or_only_cached_route' };
}

function calculateFuelCost(distanceMeters, fuelPerRouteKm = 1 / 3) {
  if (!Number.isFinite(Number(distanceMeters))) return Infinity;
  return Math.max(1, Math.ceil((Number(distanceMeters) / 1000) * fuelPerRouteKm));
}

module.exports = { ROUTE_CACHE_VERSION, loadRouteCache, getRouteSummary, chooseRouteVariant, calculateFuelCost };
