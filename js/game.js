// Crazy Tuk Game Logic
// Core game loop and fare management

import { CONFIG } from '../data/config.js';
import { getRandomNPC, createFare } from '../data/npcs.js?v=20260823w';
import { ROUTES, getRoute, getRoutesFromLocation } from '../data/routes.js';
import { PLAYER_STATES } from '../data/config.js';
import { PLAYER_KEY, getPlayer, loadOrCreatePlayer, updatePlayer, hasEnoughFuel, loadLeaderboard, saveLeaderboard } from '../data/player.js';

const FARES_KEY = "crazytuk_faresV2";

export function getAvailableFares() {
  const saved = localStorage.getItem(FARES_KEY);
  return saved ? JSON.parse(saved) : [];
}

export function saveFares(fares) {
  localStorage.setItem(FARES_KEY, JSON.stringify(fares));
  return fares;
}

export function addFare(fare) {
  const fares = getAvailableFares();
  fares.push(fare);
  return saveFares(fares);
}

export function removeFare(fareId) {
  const fares = getAvailableFares().filter(f => f.id !== fareId);
  return saveFares(fares);
}

export function updateFare(fareId, updates) {
  const fares = getAvailableFares();
  const index = fares.findIndex(f => f.id === fareId);
  if (index === -1) return null;

  fares[index] = { ...fares[index], ...updates };
  return saveFares(fares);
}

// Generate initial set of available fares
export function generateInitialFares(playerWallet) {
  const fares = [];
  const usedNPCs = new Set();

  while (fares.length < CONFIG.MIN_ACTIVE_FARES) {
    const randomNPC = getRandomNPC();
    const npcId = randomNPC.id;

    // Don't generate too many from same NPC
    if (usedNPCs.has(npcId) && usedNPCs.size > 3) break;
    usedNPCs.add(npcId);

    const fare = createFare(playerWallet, npcId);
    if (fare) {
      fares.push(fare);
    }
  }

  if (fares[0]) {
    fares[0] = { ...fares[0], condition: 'ANY_SWAP', minimumUsd: 1 };
  }

  return saveFares(fares);
}

export function refreshFares(playerWallet) {
  // Remove expired fares
  const remainingFares = getAvailableFares().filter(f => f.expiresAt > Date.now());

  // Replace expired/completed fares
  while (remainingFares.length < CONFIG.MIN_ACTIVE_FARES) {
    const randomNPC = getRandomNPC();
    const fare = createFare(playerWallet, randomNPC.id);
    if (fare) {
      remainingFares.push(fare);
    }
  }

  if (!remainingFares.some((fare) => fare.condition === 'ANY_SWAP' && fare.minimumUsd <= 5) && remainingFares[0]) {
    remainingFares[0] = { ...remainingFares[0], condition: 'ANY_SWAP', minimumUsd: 1 };
  }

  return saveFares(remainingFares);
}

export function getPlayerFare(playerWallet, fareId) {
  const fares = getAvailableFares();
  return fares.find(f => f.id === fareId && f.wallet === playerWallet)
    || fares.find(f => f.id === fareId)
    || null;
}

// Test if location has available routes
export function hasRoutesFromLocation(locationId) {
  return getRoutesFromLocation(locationId).length > 0;
}

// Calculate pickup fuel cost for a location
export function getPickupFuelCost(locationId, fromLocationId = null) {
  const player = getPlayer();
  const startId = fromLocationId || player?.locationId;
  if (!startId || !locationId || startId === locationId) return 0;

  const costs = new Map([[startId, 0]]);
  const queue = [{ id: startId, cost: 0 }];
  while (queue.length) {
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift();
    if (current.id === locationId) return current.cost;
    if (current.cost !== costs.get(current.id)) continue;

    Object.values(ROUTES).forEach((route) => {
      let nextId = null;
      if (route.from === current.id) nextId = route.to;
      if (route.reversible && route.to === current.id) nextId = route.from;
      if (!nextId) return;
      const nextCost = current.cost + route.fuelCost;
      if (nextCost < (costs.get(nextId) ?? Infinity)) {
        costs.set(nextId, nextCost);
        queue.push({ id: nextId, cost: nextCost });
      }
    });
  }
  return Infinity;
}

// Game event emitter
export function emitGameEvent(type, payload) {
  const event = {
    type,
    payload,
    timestamp: Date.now()
  };

  console.log('Game event:', event);

  // Store in game state (in-memory for MVP)
  if (!window.CrazyTukGameState) {
    window.CrazyTukGameState = {
      events: []
    };
  }
  window.CrazyTukGameState.events.push(event);
}

// Main game tick - called every frame
export function gameLoop() {
  const player = loadOrCreatePlayer(null); // Get current player
  if (!player) return;

  // Check for expired fares
  if (player.status === PLAYER_STATES.AVAILABLE) {
    refreshFares(player.wallet);
  }

  // Check fare expiration while active
  if (player.activeFareId) {
    const fare = getPlayerFare(player.wallet, player.activeFareId);
    if (fare && fare.expiresAt < Date.now()) {
      // Fare expired
      player.status = PLAYER_STATES.AVAILABLE;
      player.activeFareId = null;
      player.selectedFareId = null;
      player.activeTrip = null;
      updatePlayer(player);
      emitGameEvent('FARE_EXPIRED', { fareId: player.activeFareId });
    }
  }

  return player;
}

// Select a fare (player action)
export function selectFare(fareId, playerWallet) {
  return updatePlayer(player => {
    const fare = getPlayerFare(playerWallet, fareId);
    if (!fare) return null;

    player.selectedFareId = fareId;
    player.status = PLAYER_STATES.AVAILABLE;

    emitGameEvent('FARE_SELECTED', { fareId });

    return player;
  });
}

// Claim fare (after making a swap)
export function claimFare(fareId, playerWallet) {
  return updatePlayer(player => {
    if (player.selectedFareId !== fareId) return null;

    const fare = getPlayerFare(playerWallet, fareId);
    if (!fare) return null;

    // Calculate pickup fuel cost
    const pickupFuel = getPickupFuelCost(fare.pickupLocationId);

    // Check if player has enough fuel
    if (!hasEnoughFuel(pickupFuel)) {
      return null; // Not enough fuel for pickup
    }

    player.fuel -= pickupFuel;

    player.selectedFareId = null;
    player.status = PLAYER_STATES.PICKUP;

    // Start pickup animation
    player.activeTrip = {
      startedAt: Date.now(),
      locationId: fare.pickupLocationId,
      destinationLocationId: fare.destinationLocationId,
      fuelSpent: pickupFuel,
      fuelCost: pickupFuel,
      progress: 0
    };

    player.activeFareId = fareId;

    updateFare(fareId, {
      status: 'SELECTED'
    });

    emitGameEvent('FARE_CLAIMED', { fareId, pickupLocationId: fare.pickupLocationId });

    return player;
  });
}

// Finish pickup animation
export function completePickup(fareId, playerWallet) {
  return updatePlayer(player => {
    const fare = getPlayerFare(playerWallet, fareId);
    if (!fare) return null;

    player.status = PLAYER_STATES.DRIVING;

    // Get route
    const route = getRoute(fare.pickupLocationId, fare.destinationLocationId, true) || {
      id: `direct-${fare.pickupLocationId}-${fare.destinationLocationId}`,
      fuelCost: 5,
      durationMs: 6000
    };

    player.activeTrip = {
      startedAt: Date.now(),
      pickupLocationId: fare.pickupLocationId,
      destinationLocationId: fare.destinationLocationId,
      fuelCost: route.fuelCost,
      fuelSpent: 0,
      progress: 0,
      routeId: route.id
    };

    player.activeFareId = fareId;
    player.locationId = fare.pickupLocationId;

    updateFare(fareId, {
      status: 'ACTIVE'
    });

    emitGameEvent('PICKUP_REACHED', { fareId, destinationId: fare.destinationLocationId });

    return player;
  });
}

// Complete fare
export function completeFare(fareId, playerWallet) {
  return updatePlayer(player => {
    const fare = getPlayerFare(playerWallet, fareId);
    if (!fare) return null;

    if (player.activeFareId !== fareId) return null;

    const trip = player.activeTrip;
    if (!trip) return null;

    // Add points
    player.points += fare.pointValue;
    player.completedFares += 1;

    const leaderboard = loadLeaderboard();
    const playerName = player.wallet
      ? `${player.wallet.slice(0, 4)}...${player.wallet.slice(-4)}`
      : (player.name || 'Guest Driver');
    const existingEntry = leaderboard.find(entry => entry.wallet === player.wallet || entry.name === playerName);
    if (existingEntry) {
      existingEntry.points = Math.max(existingEntry.points || 0, player.points);
      existingEntry.name = playerName;
    } else {
      leaderboard.push({ name: playerName, wallet: player.wallet, points: player.points });
    }
    saveLeaderboard(leaderboard.sort((a, b) => b.points - a.points).slice(0, 100));

    player.activeFareId = null;
    player.activeTrip = null;
    player.locationId = fare.destinationLocationId;
    player.status = PLAYER_STATES.AVAILABLE;
    player.selectedFareId = null;

    // Clean up fare
    removeFare(fareId);

    // Generate refreshFares()
    generateInitialFares(playerWallet);

    emitGameEvent('FARE_COMPLETED', {
      fareId,
      points: fare.pointValue,
      locationId: fare.destinationLocationId
    });

    return player;
  });
}

// Get fare route for animation
export function getFareRoute(fareId) {
  const player = loadOrCreatePlayer(null);
  if (!player || !player.activeTrip) return null;

  return getRoute(
    player.activeTrip.pickupLocationId,
    player.activeTrip.destinationLocationId,
    false
  );
}

// Simulate a trip being driven (for demo)
export function simulateTripProgress(fareId, playerWallet, isStalled = false) {
  const updated = updatePlayer(player => {
    const trip = player.activeTrip;
    if (!trip || trip.stalledAt) return null;

    const playerFare = getPlayerFare(playerWallet, fareId);
    if (!playerFare) return null;

    // Calculate progress
    let progress = trip.progress || 0;

    if (isStalled) {
      trip.progressAtStall = progress;
      trip.stalledAt = Date.now();
      trip.remainingFuelRequired = Math.max(0, trip.fuelCost - (trip.fuelSpent || 0));
      player.status = PLAYER_STATES.STALLED;
      player.stallCount = (player.stallCount || 0) + 1;
    } else {
      const requestedProgress = Math.min(.01, 1 - progress);
      const requestedFuel = trip.fuelCost * requestedProgress;
      const fuelConsumed = Math.min(player.fuel, requestedFuel);
      player.fuel = Math.max(0, player.fuel - fuelConsumed);
      trip.fuelSpent = (trip.fuelSpent || 0) + fuelConsumed;
      progress = Math.min(1, progress + (trip.fuelCost > 0 ? fuelConsumed / trip.fuelCost : requestedProgress));
      if (fuelConsumed + Number.EPSILON < requestedFuel) {
        trip.progressAtStall = progress;
        trip.stalledAt = Date.now();
        trip.remainingFuelRequired = Math.max(0, trip.fuelCost - trip.fuelSpent);
        player.status = PLAYER_STATES.STALLED;
        player.stallCount = (player.stallCount || 0) + 1;
      }
    }

    trip.progress = progress;

    return player;
  });
  if (updated?.activeTrip?.progress >= 1) return completeFare(fareId, playerWallet);
  return updated;
}
