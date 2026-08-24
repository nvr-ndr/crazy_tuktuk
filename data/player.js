// Crazy Tuk Player State
// Player state management for Crazy Tuk

import { CONFIG, PLAYER_STATES } from './config.js';
import { getStartingLocation, getRandomLocation } from './locations.js?v=20260824world1';
import { FUEL_TIERS } from './config.js';

export const PLAYER_KEY = "crazytuk_playerV1";
export const LEADERBOARD_KEY = "crazytuk_leaderboardV1";

export function getEmptyPlayer() {
  return {
    wallet: null,
    locationId: null,
    fuel: CONFIG.STARTING_FUEL,
    points: 0,
    completedFares: 0,
    stallCount: 0,
    status: PLAYER_STATES.AVAILABLE,
    selectedFareId: null,
    activeFareId: null,
    activeTrip: null,
    createdAt: null,
    updatedAt: null
  };
}

export function getPlayer() {
  const saved = localStorage.getItem(PLAYER_KEY);
  return saved ? JSON.parse(saved) : null;
}

export function savePlayer(player) {
  player.updatedAt = Date.now();
  localStorage.setItem(PLAYER_KEY, JSON.stringify(player));
  return player;
}

export function createNewPlayer(wallet) {
  const startingLocation = getStartingLocation();

  const player = getEmptyPlayer();
  player.wallet = wallet;
  player.locationId = startingLocation.id;
  player.status = PLAYER_STATES.AVAILABLE;
  player.createdAt = Date.now();
  player.updatedAt = Date.now();

  return player;
}

export function loadOrCreatePlayer(wallet) {
  let player = getPlayer();

  if (!player || player.wallet !== wallet) {
    player = createNewPlayer(wallet);
    savePlayer(player);
  }

  return player;
}

export function updatePlayer(fn) {
  const player = getPlayer();
  if (!player) return null;

  const updated = fn(player);
  if (updated) {
    savePlayer(updated);
  }

  return updated;
}

// Fuel management

export function addFuel(amount) {
  return updatePlayer(player => {
    player.fuel += amount;
    return player;
  });
}

export function useFuel(amount) {
  return updatePlayer(player => {
    if (player.fuel >= amount) {
      player.fuel -= amount;
      return player;
    }
    return null;
  });
}

export function getFuelFromUsd(usdValue) {
  // Find the fuel tier that covers this USD value
  const tier = FUEL_TIERS.find(
    tier => usdValue >= tier.minUsd && usdValue <= tier.maxUsd
  );

  return tier ? tier.fuel : 0;
}

export function hasEnoughFuel(amount) {
  const player = getPlayer();
  return player && player.fuel >= amount;
}

// Points management

export function addPoints(amount) {
  return updatePlayer(player => {
    player.points += amount;
    player.completedFares += 1;
    return player;
  });
}

// Fare management

export function setSelectedFare(fareId) {
  return updatePlayer(player => {
    player.selectedFareId = fareId;
    return player;
  });
}

export function clearSelectedFare() {
  return updatePlayer(player => {
    player.selectedFareId = null;
    return player;
  });
}

export function setSelectedFareAndStart(fareId) {
  return updatePlayer(player => {
    player.selectedFareId = fareId;
    player.status = PLAYER_STATES.PICKUP;

    // Start pickup animation
    const pickupAnimation = { startedAt: Date.now() };

    return player;
  });
}

export function setActiveFare(fareId) {
  return updatePlayer(player => {
    player.activeFareId = fareId;
    return player;
  });
}

export function completeFare(fareId) {
  return updatePlayer(player => {
    if (player.activeFareId !== fareId) return null;

    const trip = player.activeTrip;
    if (!trip) return null;

    player.activeFareId = null;
    player.activeTrip = null;
    player.locationId = trip.destinationId;
    player.status = PLAYER_STATES.AVAILABLE;

    // Reset fare
    player.selectedFareId = null;

    return player;
  });
}

// Trip management

export function startTrip(pickupLocationId, destinationLocationId, fuelCost) {
  return updatePlayer(player => {
    player.status = PLAYER_STATES.DRIVING;

    player.activeTrip = {
      startedAt: Date.now(),
      pickupLocationId: pickupLocationId,
      destinationLocationId: destinationLocationId,
      fuelCost: fuelCost,
      fuelSpent: 0,
      progress: 0,
      progressAtStall: null,
      stalledAt: null
    };

    return player;
  });
}

export function updateTripProgress(fuelSpent, fuelNeededTotal) {
  return updatePlayer(player => {
    const trip = player.activeTrip;

    if (!trip || trip.stalledAt) return null;

    // Calculate progress based on fuel used vs total fuel needed
    const possibleProgress = player.fuel / fuelNeededTotal;
    trip.progress = Math.max(0, Math.min(1, possibleProgress));
    trip.fuelSpent = fuelSpent;

    // Check if stalled
    if (player.fuel <= 0 && trip.progress < 1) {
      trip.progressAtStall = trip.progress;
      trip.stalledAt = Date.now();
      player.status = PLAYER_STATES.STALLED;
    }

    return player;
  });
}

export function resumeTrip(fuelAdded, fuelNeededRemaining) {
  return updatePlayer(player => {
    const trip = player.activeTrip;

    if (!trip) return null;

    trip.fuelSpent += fuelAdded;
    trip.progress = Math.min(1, trip.fuelSpent / trip.fuelCost);

    // Check if trip completes
    if (trip.progress >= 1) {
      player.status = PLAYER_STATES.AVAILABLE;
      trip.stalledAt = null;
    }

    return player;
  });
}

// Status management

export function setPlayerStatus(status) {
  return updatePlayer(player => {
    if (PLAYER_STATES[status.toUpperCase()] && player.status !== status) {
      player.status = status;
      player.updatedAt = Date.now();
    }
    return player;
  });
}

// Get current fare info
export function getSelectedFare() {
  const player = getPlayer();
  if (!player || !player.selectedFareId) return null;
  return {
    fareId: player.selectedFareId,
    // Would fetch from fares store in actual implementation
  };
}

export function getActiveFare() {
  const player = getPlayer();
  if (!player || !player.activeFareId) return null;
  return {
    fareId: player.activeFareId,
    // Would fetch from fares store in actual implementation
  };
}

export function isStalled() {
  const player = getPlayer();
  return player && player.status === PLAYER_STATES.STALLED;
}

export function getStallDuration() {
  const player = getPlayer();
  if (!player || !player.activeTrip || !player.activeTrip.stalledAt) {
    return 0;
  }

  const stalledAt = player.activeTrip.stalledAt;
  const now = Date.now();
  return Math.floor((now - stalledAt) / 1000); // seconds
}

// Leaderboard management

export function loadLeaderboard() {
  const saved = localStorage.getItem(LEADERBOARD_KEY);
  return saved ? JSON.parse(saved) : [];
}

export function saveLeaderboard(leaderboard) {
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
}

export function getTopPlayers(limit = 100) {
  const leaderboard = loadLeaderboard();
  return leaderboard
    .sort((a, b) => b.points - a.points)
    .slice(0, limit);
}

// Validation

export function validatePlayer(player) {
  const requiredFields = [
    'wallet',
    'locationId',
    'fuel',
    'points',
    'status',
    'createdAt',
    'updatedAt'
  ];

  return requiredFields.every(field => field in player) &&
         typeof player.fuel === 'number' &&
         typeof player.points === 'number';
}

export function getPlayerDisplayName() {
  const player = getPlayer();
  // Could check if player has custom name, but for MVP use wallet
  return player ? `${player.wallet.slice(0, 4)}...${player.wallet.slice(-4)}` : 'Guest';
}
