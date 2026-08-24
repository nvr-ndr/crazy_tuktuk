// Crazy Tuk Game Logic
// Core game loop and fare management

import { CONFIG } from '../data/config.js';
import { getRandomNPC, createFare } from '../data/npcs.js?v=20260824world1';
import { getLocationById } from '../data/locations.js?v=20260824world1';
import { ROUTES, getRoute, getRoutesFromLocation } from '../data/routes.js';
import { PLAYER_STATES } from '../data/config.js';
import { PLAYER_KEY, getPlayer, loadOrCreatePlayer, updatePlayer, hasEnoughFuel, loadLeaderboard, saveLeaderboard } from '../data/player.js';

const FARES_KEY = "crazytuk_faresV4";

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
  let attempts = 0;

  while (fares.length < CONFIG.MIN_ACTIVE_FARES && attempts < 100) {
    attempts += 1;
    const randomNPC = getRandomNPC();
    const npcId = randomNPC.id;

    if (usedNPCs.has(npcId)) continue;
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
  // Remove expired fares and collapse legacy duplicates before replenishing the map.
  const usedNPCs = new Set();
  const remainingFares = getAvailableFares().filter((fare) => {
    if (fare.expiresAt <= Date.now() || usedNPCs.has(fare.npcId)) return false;
    usedNPCs.add(fare.npcId);
    return true;
  });

  // Replace expired/completed fares
  let attempts = 0;
  while (remainingFares.length < CONFIG.MIN_ACTIVE_FARES && attempts < 100) {
    attempts += 1;
    const randomNPC = getRandomNPC();
    if (usedNPCs.has(randomNPC.id)) continue;
    const fare = createFare(playerWallet, randomNPC.id);
    if (fare) {
      remainingFares.push(fare);
      usedNPCs.add(randomNPC.id);
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

function getLocationDistanceKm(fromId, toId) {
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

// One fuel covers roughly three kilometers across the expanded Bangkok map.
export function getPickupFuelCost(locationId, fromLocationId = null) {
  const player = getPlayer();
  const startId = fromLocationId || player?.locationId;
  if (!startId || !locationId || startId === locationId) return 0;
  const distanceKm = getLocationDistanceKm(startId, locationId);
  return Number.isFinite(distanceKm) ? Math.max(1, Math.ceil(distanceKm / 3)) : Infinity;
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

    player.selectedFareId = null;
    player.status = PLAYER_STATES.PICKUP;

    // The pickup is a real route leg from the tuk-tuk's current location.
    player.activeTrip = {
      startedAt: Date.now(),
      leg: 'PICKUP',
      fromLocationId: player.locationId,
      pickupLocationId: fare.pickupLocationId,
      destinationLocationId: fare.destinationLocationId,
      fuelSpent: 0,
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

    const calculatedFuelCost = getPickupFuelCost(fare.destinationLocationId, fare.pickupLocationId);

    // Preserve authored routes where available and price new world locations by distance.
    const route = getRoute(fare.pickupLocationId, fare.destinationLocationId, true) || {
      id: `direct-${fare.pickupLocationId}-${fare.destinationLocationId}`,
      fuelCost: Number.isFinite(calculatedFuelCost) ? calculatedFuelCost : 5,
      durationMs: Math.max(6000, (Number.isFinite(calculatedFuelCost) ? calculatedFuelCost : 5) * 1800)
    };

    player.activeTrip = {
      startedAt: Date.now(),
      leg: 'RIDE',
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

// Advance the tuk-tuk from its current location to the waiting passenger.
export function simulatePickupProgress(fareId, playerWallet) {
  const updated = updatePlayer(player => {
    const trip = player.activeTrip;
    if (player.status !== PLAYER_STATES.PICKUP || !trip || trip.leg !== 'PICKUP') return null;
    if (!getPlayerFare(playerWallet, fareId)) return null;

    const progress = trip.progress || 0;
    const requestedProgress = Math.min(.02, 1 - progress);
    const requestedFuel = trip.fuelCost * requestedProgress;
    const fuelConsumed = Math.min(player.fuel, requestedFuel);
    player.fuel = Math.max(0, player.fuel - fuelConsumed);
    trip.fuelSpent = (trip.fuelSpent || 0) + fuelConsumed;
    trip.progress = Math.min(1, progress + (trip.fuelCost > 0 ? fuelConsumed / trip.fuelCost : requestedProgress));

    return player;
  });

  if (updated?.activeTrip?.progress >= 1) return completePickup(fareId, playerWallet);
  return updated;
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
