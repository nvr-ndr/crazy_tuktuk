// Crazy Tuk Fare Matcher
// Logic for fare qualification and matching

import { FARE_CONDITION_TYPES, CONFIG } from '../data/config.js';
import { LOCATIONS } from '../data/locations.js';
import { getPlayer, loadOrCreatePlayer, hasEnoughFuel } from '../data/player.js';
import { getPickupFuelCost } from './game.js';

export function matchesFareCondition(swap, fare) {
  if (!swap || !fare) return { qualifies: false, reasons: [] };

  const reasons = [];

  // Check USD value minimum
  if (swap.usdValue < CONFIG.MIN_GAME_SWAP_USD) {
    reasons.push('MIN_USD_VALUE');
  }

  // Check condition type
  const condition = fare.condition;

  switch (condition) {
    case 'ANY_SWAP':
      // Any swap above minimum qualifies
      if (swap.usdValue >= CONFIG.MIN_GAME_SWAP_USD) {
        return { qualifies: true, reasons };
      }
      break;

    case 'SOL_PAIR':
      // Swap involving SOL
      if (swap.inputToken === 'SOL' || swap.outputToken === 'SOL') {
        if (swap.usdValue >= fare.minimumUsd) {
          reasons.push('SOL_PAIR');
          return { qualifies: true, reasons };
        }
      }
      break;

    case 'STABLE_TO_STABLE':
      // Stable to stable swap
      if (swap.inputCategory === 'stable' && swap.outputCategory === 'stable') {
        if (swap.usdValue >= fare.minimumUsd) {
          reasons.push('STABLE_TO_STABLE');
          return { qualifies: true, reasons };
        }
      }
      break;

    case 'STABLE_TO_VOLATILE':
      // Stable to volatile swap
      if (swap.inputCategory === 'stable' && swap.outputCategory === 'volatile') {
        if (swap.usdValue >= fare.minimumUsd) {
          reasons.push('STABLE_TO_VOLATILE');
          return { qualifies: true, reasons };
        }
      }
      break;

    case 'VOLATILE_TO_STABLE':
      // Volatile to stable swap
      if (swap.inputCategory === 'volatile' && swap.outputCategory === 'stable') {
        if (swap.usdValue >= fare.minimumUsd) {
          reasons.push('VOLATILE_TO_STABLE');
          return { qualifies: true, reasons };
        }
      }
      break;

    case 'MIN_USD':
      // Any swap above specific minimum
      if (swap.usdValue >= fare.minimumUsd) {
        reasons.push('MIN_USD_CONDITION');
        return { qualifies: true, reasons };
      }
      break;

    default:
      return { qualifies: false, reasons: ['UNKNOWN_CONDITION'] };
  }

  return { qualifies: false, reasons };
}

// Find qualifying fares for a swap
export function findQualifyingFares(fares, swap) {
  const qualifying = fares.filter(fare => {
    const { qualifies } = matchesFareCondition(swap, fare);
    return qualifies;
  });

  return qualifying;
}

// Auto-match best fare for a swap
export function autoMatchFare(fares, swap) {
  const qualifying = findQualifyingFares(fares, swap);

  if (qualifying.length === 0) {
    return null;
  }

  // Rank by: point value DESC, expiration ASC, pickup distance ASC
  const sorted = qualifying.sort((a, b) => {
    // Primary: point value
    if (b.pointValue !== a.pointValue) {
      return b.pointValue - a.pointValue;
    }

    // Secondary: expiration
    if (a.expiresAt !== b.expiresAt) {
      return a.expiresAt - b.expiresAt;
    }

    // Tertiary: pickup location (simple distance heuristic)
    const locationA = LOCATIONS.features.find(l => l.id === a.pickupLocationId);
    const locationB = LOCATIONS.features.find(l => l.id === b.pickupLocationId);

    if (!locationA || !locationB) return 0;

    // Use simple coordinate-based distance for MVP
    const distA = calculateDistance(locationA.geometry.coordinates, swap.userLocation);
    const distB = calculateDistance(locationB.geometry.coordinates, swap.userLocation);

    return distA - distB;
  });

  return sorted[0];
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(coord1, coord2) {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // distance in km

  return distance;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

// Check if swap can reach a fare's pickup location
export function canReachFare(swap, fare) {
  const currentPlayer = loadOrCreatePlayer(null);
  if (!currentPlayer || !currentPlayer.locationId) return false;

  const playerLocation = LOCATIONS.features.find(l => l.id === currentPlayer.locationId);
  if (!playerLocation) return false;

  const fareLocation = LOCATIONS.features.find(l => l.id === fare.pickupLocationId);
  if (!fareLocation) return false;

  // Calculate player's remaining fuel
  const player = getPlayer();
  const remainingFuel = player?.fuel ?? 0;

  // Get pickup fuel cost
  const pickupFuel = getPickupFuelCost(fare.pickupLocationId);

  return remainingFuel >= pickupFuel && hasEnoughFuel(pickupFuel);
}

// Filter fares that can be reached after fuel award
export function getReachableFares(fares, swap) {
  const reachable = fares.filter(fare => {
    // Check if swap can qualify
    const { qualifies } = matchesFareCondition(swap, fare);
    if (!qualifies) return false;

    // Check if player can reach pickup
    return canReachFare(swap, fare);
  });

  return reachable;
}

// Get matching fare for a swap context
export function getMatchingFareForSwap(fares, swap) {
  // Check for selected fare first
  const player = loadOrCreatePlayer(null);
  if (player.selectedFareId) {
    const selectedFare = fares.find(f => f.id === player.selectedFareId);
    if (selectedFare) {
      const { qualifies } = matchesFareCondition(swap, selectedFare);
      if (qualifies) {
        return { fare: selectedFare, context: 'SELECTED_FARE' };
      }
    }

    // If selected fare exists but doesn't qualify, return null (due to STRICT mode)
    if (CONFIG.SELECTED_FARE_STRICT) {
      return null;
    }

    // Non-qualifying selected fare doesn't affect matching
  }

  // Try to auto-match
  const reachable = getReachableFares(fares, swap);
  const matched = autoMatchFare(reachable, swap);

  if (matched) {
    return { fare: matched, context: 'AUTO_MATCH' };
  }

  return null;
}

// Preview fare qualification without actually claiming
export function previewFareQualification(fare, swap) {
  return matchesFareCondition(swap, fare);
}
