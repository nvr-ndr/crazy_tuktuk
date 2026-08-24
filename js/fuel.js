// Crazy Tuk Fuel Calculation
// Fuel curve and consumption logic

import { FUEL_TIERS, CONFIG } from '../data/config.js';

export function calculateFuelEarned(usdValue) {
  if (!usdValue) return 0;

  // Find matching fuel tier
  const tier = FUEL_TIERS.find(
    tier => usdValue >= tier.minUsd && usdValue <= tier.maxUsd
  );

  return tier ? tier.fuel : 0;
}

export function getFuelAmountForUsd(usdValue) {
  const fuel = calculateFuelEarned(usdValue);

  if (fuel === 0) {
    console.warn(`No fuel awarded for swap of ${usdValue} USD (below minimum)`);
  }

  return fuel;
}

// Calculate trip completion progress based on fuel used vs total fuel needed
export function calculateProgress(fuelUsed, totalFuelNeeded) {
  if (totalFuelNeeded <= 0) return 0;

  const progress = fuelUsed / totalFuelNeeded;

  // Clamp to 0-1
  return Math.max(0, Math.min(1, progress));
}

// Calculate stall point progress
export function calculateStallProgress(fuelSpent, fuelCost, fuelAvailable) {
  if (fuelCost <= 0 || fuelAvailable <= 0) {
    return 0;
  }

  // Progress based on fuel remaining vs total needed
  const progress = fuelSpent / fuelCost;

  // If fuel runs out before completion
  if (fuelAvailable <= 0 && progress < 1) {
    return 0;
  }

  return Math.max(0, Math.min(1, progress));
}

// Calculate how much fuel to add to complete a trip
export function calculateFuelNeededToComplete(fuelSpent, fuelCost) {
  const needed = fuelCost - fuelSpent;
  return Math.max(0, needed);
}

// Calculate completion ratio
export function calculateCompletionRatio(fuelSpent, fuelCost) {
  if (fuelCost <= 0) return 0;

  const ratio = fuelSpent / fuelCost;

  return Math.max(0, Math.min(1, ratio));
}

// Calculate fuel percentage used
export function calculateFuelPercentage(fuelSpent, fuelCost) {
  if (fuelCost <= 0) return 100; // All fuel used if no cost

  const percentage = (fuelSpent / fuelCost) * 100;

  return Math.max(0, Math.min(100, percentage));
}

// Estimate remaining fuel for a route
export function estimateRemainingFuel(route, fuelAvailable) {
  if (!route) return fuelAvailable;

  const fuelNeeded = route.fuelCost;
  const progress = calculateProgress(0, fuelNeeded);

  // If we've already progressed some
  if (progress > 0) {
    const fuelSpent = fuelNeeded * progress;
    return Math.max(0, fuelAvailable - fuelSpent);
  }

  return fuelAvailable;
}

// Check if trip is completable with current fuel
export function isTripCompletable(route, fuelAvailable) {
  if (!route || !route.fuelCost) return false;

  return fuelAvailable >= route.fuelCost;
}

// Check if trip can at least begin
export function canStartTrip(pickupFuel, fuelAvailable) {
  return fuelAvailable >= pickupFuel;
}

// Calculate stall risk warning
export function calculateStallWarning(pickupFuel, tripFuelCost, fuelAvailable) {
  if (fuelAvailable < pickupFuel) {
    return {
      canStart: false,
      message: 'Not enough fuel for pickup'
    };
  }

  if (fuelAvailable < tripFuelCost) {
    const progress = calculateCompletionRatio(fuelAvailable, tripFuelCost);
    return {
      canStart: true,
      warning: 'fuel_stall_warning',
      message: `Risk of stall: ${Math.round(progress * 100)}% completion with current fuel`
    };
  }

  return {
    canStart: true,
    warning: null,
    message: 'Trip can be completed'
  };
}

// Get fuel cost estimate for a trip
export function getTripFuelCost(route) {
  if (!route) return 0;

  return route.fuelCost;
}

// Calculate fuel cost from coordinates (simple Euclidean approximation for MVP)
export function calculateFuelFromCoordinates(coord1, coord2) {
  // MVP: fixed cost based on direction
  // In production, calculate based on actual route distance

  const distance = calculateDistance(coord1, coord2);
  return Math.max(1, Math.ceil(distance * CONFIG.FUEL_PER_ROUTE_KM));
}

// Recalculate fuel cost for a full route
export function recalculateFullRouteFuel(fromLocationId, toLocationId) {
  const route = window.CrazyTukGame.ROUTES
    ? window.CrazyTukGame.ROUTES[`${fromLocationId}_${toLocationId}`]
    : null;

  if (route) {
    return route.fuelCost;
  }

  const fromLoc = window.CrazyTukGame.LOCATIONS.features.find(l => l.id === fromLocationId);
  const toLoc = window.CrazyTukGame.LOCATIONS.features.find(l => l.id === toLocationId);

  if (!fromLoc || !toLoc) return 1;

  return calculateFuelFromCoordinates(fromLoc.geometry.coordinates, toLoc.geometry.coordinates);
}

// Calculate pickup fuel cost (always 1 for MVP)
export function getPickupFuelCost(locationId) {
  return 1;
}

// Calculate trip fuel cost (from route)
export function getTripFuelCostByRoute(route) {
  if (!route) return 1;

  return route.fuelCost;
}

// Estimate remaining trip duration based on progress
export function estimateRemainingDuration(progress, route) {
  if (!route || route.durationMs <= 0) return 0;

  const elapsed = route.durationMs * progress;
  const remaining = Math.max(0, route.durationMs - elapsed);

  return remaining;
}

// Get fuel as percentage (for UI display)
export function getFuelPercentageDisplay(fuel, maxFuel) {
  if (!maxFuel || maxFuel <= 0) return fuel;

  const percentage = (fuel / maxFuel) * 100;

  // Color coding based on percentage
  if (percentage < 30) return { percentage, color: 'low' };
  if (percentage < 70) return { percentage, color: 'medium' };
  return { percentage, color: 'high' };
}

// Check if fuel is low
export function isFuelLow(fuel, threshold = 5) {
  return fuel <= threshold;
}

// Check if fuel is critical
export function isFuelCritical(fuel, threshold = 2) {
  return fuel <= threshold;
}
