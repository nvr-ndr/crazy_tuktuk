// Crazy Tuk Swap Interpretation
// Authoritative bridge between confirmed swaps and game actions

import { CONFIG } from '../data/config.js';
import { FARE_CONDITION_TYPES } from '../data/config.js';
import { FUEL_TIERS } from '../data/config.js';
import {
  loadOrCreatePlayer,
  updatePlayer,
  addFuel,
  useFuel,
  addPoints,
  setSelectedFare,
  clearSelectedFare,
  startTrip,
  completeFare,
  resumeTrip,
  isStalled,
  getStallDuration,
  getPlayer
} from '../data/player.js';
import {
  matchesFareCondition,
  findQualifyingFares,
  autoMatchFare,
  getReachableFares
} from './fareMatcher.js';
import {
  getAvailableFares,
  updateFare,
  getPlayerFare,
  removeFare,
  refreshFares
} from './game.js';
import { CONFIG as GAME_CONFIG } from '../data/config.js';

const SWAP_EVENTS_KEY = "crazytuk_swapEventsV1";

// Store swap events for signature uniqueness check
export function getSwapEvents() {
  const saved = localStorage.getItem(SWAP_EVENTS_KEY);
  return saved ? JSON.parse(saved) : [];
}

export function saveSwapEvents(events) {
  localStorage.setItem(SWAP_EVENTS_KEY, JSON.stringify(events));
  return events;
}

// Check if signature was already processed
export function isSignatureProcessed(signature) {
  const events = getSwapEvents();
  return events.some(e => e.signature === signature);
}

// Normalize swap event
export function normalizeSwapEvent(swapEvent) {
  return {
    signature: swapEvent.signature,
    wallet: swapEvent.wallet,
    inputMint: swapEvent.inputMint,
    outputMint: swapEvent.outputMint,
    inputAmount: swapEvent.inputAmount,
    outputAmount: swapEvent.outputAmount,
    usdValue: swapEvent.usdValue,
    confirmedAt: swapEvent.confirmedAt
  };
}

// Main authoritative function: interpret confirmed swap
export function interpretConfirmedSwap(swapEvent) {
  console.log('Interpreting confirmed swap:', swapEvent);

  // 1. Reject duplicate signatures (CRITICAL INVARIANT)
  if (isSignatureProcessed(swapEvent.signature)) {
    console.warn('Duplicate signature detected, ignoring swap event');
    return {
      success: false,
      reason: 'duplicate_signature',
      fuelAwarded: 0,
      fareAssigned: null
    };
  }

  // 2. Get player state
  const player = loadOrCreatePlayer(swapEvent.wallet);
  if (!player) {
    console.error('Player not found for wallet:', swapEvent.wallet);
    return { success: false, reason: 'player_not_found', fuelAwarded: 0, fareAssigned: null };
  }

  // 3. Normalize swap event
  const normalizedSwap = normalizeSwapEvent(swapEvent);

  // 4. Save processed swap event
  const events = getSwapEvents();
  events.push(normalizedSwap);
  saveSwapEvents(events);

  // 5. Calculate fuel earned
  const fuelEarned = getFuelFromUsd(swapEvent.usdValue);

  // 6. Minimum swap rule
  if (fuelEarned === 0) {
    console.warn('Swap below minimum USD threshold, awarding no fuel');
  }

  // 7. Add fuel to player
  updatePlayer(player => {
    player.fuel += fuelEarned;
    player.updatedAt = Date.now();
    return player;
  });

  // 8. Check conditions
  const { qualifies, reasons } = matchesFareCondition(swapEvent, {
    wallet: swapEvent.wallet,
    inputToken: swapEvent.inputMint,
    outputToken: swapEvent.outputMint,
    inputCategory: CONFIG.STABLE_TOKENS.includes(swapEvent.inputMint) ? 'stable' : 'volatile',
    outputCategory: CONFIG.STABLE_TOKENS.includes(swapEvent.outputMint) ? 'stable' : 'volatile',
    usdValue: swapEvent.usdValue
  });

  let fareAssigned = null;
  let fareContext = null;

  // 9. Handle based on player state

  if (player.status === CONFIG.PLAYER_STATES.AVAILABLE) {
    // AVAILABLE state: award fuel, then handle fare
    console.log(`Player AVAILABLE: awarding ${fuelEarned} fuel`);

    if (qualifies) {
      // Check for selected fare first
      if (player.selectedFareId) {
        console.log('Selected fare exists, checking qualification');
        const selectedFare = getPlayerFare(player.wallet, player.selectedFareId);
        if (selectedFare) {
          const selectedQualifies = matchesFareCondition(
            swapEvent,
            selectedFare
          );
          if (selectedQualifies.qualifies) {
            // Selected fare qualifies - claim it
            fareAssigned = player.selectedFareId;
            fareContext = 'SELECTED_FARE';
          } else {
            // SELECTED_FARE_STRICT mode - do not auto-match
            if (CONFIG.SELECTED_FARE_STRICT) {
              console.log('Selected fare does not qualify and STRICT mode is enabled');
              fareAssigned = null;
            }
          }
        }
      }

      // If no selected fare or selected fare failed, try auto-matching
      if (!fareAssigned) {
        console.log('Attempting to auto-match qualifying fare');
        const fares = getAvailableFares();
        const reachable = getReachableFares(fares, swapEvent);

        if (reachable.length > 0) {
          const matched = autoMatchFare(reachable, swapEvent);
          if (matched) {
            fareAssigned = matched.id;
            fareContext = 'AUTO_MATCH';
            console.log('Auto-matched fare:', matched.id);
          }
        }
      }

      // Update fare status if assigned
      if (fareAssigned) {
        updateFare(fareAssigned, {
          status: 'SELECTED',
          selectedByWallet: player.wallet,
          selectedAt: Date.now()
        });

        // Mark selected fare
        player.selectedFareId = fareAssigned;
      }
    } else {
      console.log('Swap does not qualify any fare');
    }

  } else if (player.status === CONFIG.PLAYER_STATES.PICKUP) {
    // PICKUP state: just award fuel (pickup fuel already consumed)

    console.log(`Player PICKUP: awarding ${fuelEarned} fuel (for next fare)`);
    updateFare(fareAssigned, {
      status: 'SELECTED',
      selectedByWallet: player.wallet,
      selectedAt: Date.now()
    });
    player.selectedFareId = fareAssigned;

  } else if (player.status === CONFIG.PLAYER_STATES.DRIVING) {
    // DRIVING state: add fuel to ongoing trip

    console.log(`Player DRIVING: awarding ${fuelEarned} fuel to active trip`);

    if (player.activeTrip) {
      player.activeTrip.fuelSpent += fuelEarned;
      player.activeTrip.updatedAt = Date.now();
      updatePlayer(player => {
        return player;
      });

      // Check if trip can now complete
      const trip = player.activeTrip;
      const routeCost = trip.fuelCost || 0;

      if (player.fuel >= routeCost) {
        // Trip completes
        player.activeFareId = null;
        player.activeTrip = null;
        player.status = CONFIG.PLAYER_STATES.AVAILABLE;
        player.selectedFareId = null;

        const fare = getPlayerFare(player.wallet, fareAssigned);
        if (fare) {
          removeFare(fare.id);
        }

        refreshFares(player.wallet);
      }
    }

  } else if (player.status === CONFIG.PLAYER_STATES.STALLED) {
    // STALLED state: refuel and resume

    console.log(`Player STALLED: awarding ${fuelEarned} fuel, checking completion`);

    const trip = player.activeTrip;
    if (trip) {
      // Add fuel to remaining trip
      const remainingCost = trip.fuelCost - trip.fuelSpent;
      const fuelAdded = Math.min(fuelEarned, remainingCost);

      trip.fuelSpent += fuelAdded;
      trip.stalledAt = null;
      trip.updatedAt = Date.now();

      // Check if trip completes
      if (player.fuel >= trip.fuelCost) {
        player.activeFareId = null;
        player.activeTrip = null;
        player.status = CONFIG.PLAYER_STATES.AVAILABLE;
        player.selectedFareId = null;

        const fare = getPlayerFare(player.wallet, fareAssigned);
        if (fare) {
          removeFare(fare.id);
        }

        refreshFares(player.wallet);

        console.log('Trip resumed and completed');
      } else {
        console.log('Trip resumed, still stalled');
        player.status = CONFIG.PLAYER_STATES.DRIVING;
      }
    }
  }

  // 10. Return authoritative result
  return {
    success: true,
    fuelAwarded: fuelEarned,
    fareAssigned,
    fareContext,
    swapProcessed: true
  };
}

export const interpretSwap = interpretConfirmedSwap;

// Helper function to calculate fuel from USD
export function getFuelFromUsd(usdValue) {
  if (!usdValue) return 0;

  const tier = FUEL_TIERS.find(
    tier => usdValue >= tier.minUsd && usdValue <= tier.maxUsd
  );

  return tier ? tier.fuel : 0;
}

// Simulate a fake confirmed swap for testing (Demo mode)
export function simulateFakeSwap(swapEvent) {
  console.log('Simulating fake swap for testing:', swapEvent);

  // Mark as processed in game events
  const events = getSwapEvents();
  events.push({
    ...swapEvent,
    signature: `fake_${Date.now()}_${Math.random().toString(36)}`,
    confirmedAt: Date.now()
  });
  saveSwapEvents(events);

  // Call the main interpreter
  return interpretConfirmedSwap(swapEvent);
}

// Reset swap events (for testing)
export function resetSwapEvents() {
  localStorage.removeItem(SWAP_EVENTS_KEY);
  console.log('Swap events reset for testing');
}
