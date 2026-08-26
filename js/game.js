// Crazy Tuk Game Logic
// Core game loop and fare management

import { CONFIG } from '../data/config.js';
import { getRandomNPC, getNPCById, createFare } from '../data/npcs.js?v=20260824world1';
import { getLocationById } from '../data/locations.js?v=20260824world1';
import { ROUTES, getRoute, getRoutesFromLocation } from '../data/routes.js';
import { PLAYER_STATES } from '../data/config.js';
import { scheduleEventsForRide, getStartingPassengerMood, getPassengerMoodLabel } from './events.js';
import { PLAYER_KEY, getPlayer, loadOrCreatePlayer, updatePlayer, hasEnoughFuel, loadLeaderboard, saveLeaderboard } from '../data/player.js?v=20260824world2';

const FARES_KEY = "crazytuk_faresV4";
const GAME_EVENTS_KEY = "crazytuk_gameEventsV1";

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
  const usedZones = new Set();
  let attempts = 0;

  while (fares.length < CONFIG.MIN_ACTIVE_FARES && attempts < 100) {
    attempts += 1;
    const randomNPC = getRandomNPC();
    const npcId = randomNPC.id;
    if (usedNPCs.has(npcId)) continue;
    usedNPCs.add(npcId);

    const fare = createFare(playerWallet, npcId);
    if (fare) {
      const pickupZone = getFarePickupZone(fare);
      if (usedZones.has(pickupZone)) continue;
      fares.push(fare);
      usedZones.add(pickupZone);
    }
  }

  if (fares[0]) {
    fares[0] = { ...fares[0], condition: 'ANY_SWAP', minimumUsd: 1 };
  }

  return saveFares(keepOneFarePerPickupZone(fares));
}

export function refreshFares(playerWallet) {
  // Remove expired fares and collapse legacy duplicates before replenishing the map.
  const usedNPCs = new Set();
  const remainingFares = keepOneFarePerPickupZone(getAvailableFares().filter((fare) => {
    if (fare.expiresAt <= Date.now() || usedNPCs.has(fare.npcId)) return false;
    usedNPCs.add(fare.npcId);
    return true;
  }));

  // Replace expired/completed fares
  let attempts = 0;
  while (remainingFares.length < CONFIG.MIN_ACTIVE_FARES && attempts < 100) {
    attempts += 1;
    const randomNPC = getRandomNPC();
    if (usedNPCs.has(randomNPC.id)) continue;
    const fare = createFare(playerWallet, randomNPC.id);
    if (fare) {
      if (remainingFares.some((entry) => getFarePickupZone(entry) === getFarePickupZone(fare))) continue;
      remainingFares.push(fare);
      usedNPCs.add(randomNPC.id);
    }
  }

  if (!remainingFares.some((fare) => fare.condition === 'ANY_SWAP' && fare.minimumUsd <= 5) && remainingFares[0]) {
    remainingFares[0] = { ...remainingFares[0], condition: 'ANY_SWAP', minimumUsd: 1 };
  }

  return saveFares(keepOneFarePerPickupZone(remainingFares));
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

function getFarePickupZone(fare) {
  const location = getLocationById(fare?.pickupLocationId);
  return location?.zoneId || `location:${fare?.pickupLocationId || 'unknown'}`;
}

function keepOneFarePerPickupZone(fares) {
  const usedZones = new Set();
  return fares.filter((fare) => {
    const zone = getFarePickupZone(fare);
    if (usedZones.has(zone)) return false;
    usedZones.add(zone);
    return true;
  });
}

// One fuel covers roughly three kilometers across the expanded Bangkok map.
export function getPickupFuelCost(locationId, fromLocationId = null) {
  const player = getPlayer();
  const startId = fromLocationId || player?.locationId;
  if (!startId || !locationId || startId === locationId) return 0;
  const distanceKm = getLocationDistanceKm(startId, locationId);
  return Number.isFinite(distanceKm) ? Math.max(1, Math.ceil(distanceKm * CONFIG.FUEL_PER_ROUTE_KM)) : Infinity;
}

export function getRemainingTripFuel(player = getPlayer()) {
  const trip = player?.activeTrip;
  return trip ? Math.max(0, (trip.fuelCost || 0) - (trip.fuelSpent || 0)) : 0;
}

export function getFareFuelBudget(fare, player = getPlayer()) {
  if (!fare) return null;
  const pickupFuel = getPickupFuelCost(fare.pickupLocationId, player?.locationId);
  const rideFuel = getPickupFuelCost(fare.destinationLocationId, fare.pickupLocationId);
  return {
    pickupFuel,
    rideFuel,
    totalRequiredFuel: Number.isFinite(pickupFuel) && Number.isFinite(rideFuel) ? pickupFuel + rideFuel : Infinity
  };
}

export function resumeStalledTrip(fareId, playerWallet) {
  return updatePlayer(player => {
    if (player.status !== PLAYER_STATES.STALLED || player.activeFareId !== fareId || !player.activeTrip) return null;
    player.activeTrip.stalledAt = null;
    player.status = player.activeTrip.leg === 'PICKUP' ? PLAYER_STATES.PICKUP : PLAYER_STATES.DRIVING;
    emitGameEvent('TRIP_RESUMED', { fareId, progress: player.activeTrip.progress || 0 });
    return player;
  });
}

export function abandonStalledFare(fareId, playerWallet) {
  return updatePlayer(player => {
    if (player.status !== PLAYER_STATES.STALLED || player.activeFareId !== fareId) return null;
    const fare = getPlayerFare(playerWallet, fareId);
    if (!fare) return null;
    player.status = PLAYER_STATES.AVAILABLE;
    player.activeFareId = null;
    player.selectedFareId = null;
    player.activeTrip = null;
    player.abandonedFares = (player.abandonedFares || 0) + 1;
    updateFare(fareId, { status: 'ABANDONED_RESCUABLE', rescueOriginLocationId: player.locationId });
    emitGameEvent('RESCUE_REQUESTED', { fareId, originLocationId: player.locationId });
    return player;
  });
}

export function claimRescueFare(fareId, playerWallet) {
  return updatePlayer(player => {
    if (player.status !== PLAYER_STATES.AVAILABLE || player.activeFareId || player.selectedFareId) return null;
    const fare = getPlayerFare(playerWallet, fareId);
    if (!fare || fare.status !== 'ABANDONED_RESCUABLE') return null;
    const rescueOrigin = fare.rescueOriginLocationId || fare.pickupLocationId;
    const claimed = updateFare(fareId, {
      status: 'RESCUE_CLAIMED',
      selectedByWallet: player.wallet,
      selectedAt: Date.now(),
      originalPickupLocationId: fare.originalPickupLocationId || fare.pickupLocationId,
      pickupLocationId: rescueOrigin,
      rescueClaimedBy: player.wallet
    });
    if (!claimed) return null;
    player.selectedFareId = fareId;
    player.rescuedFares = (player.rescuedFares || 0);
    emitGameEvent('RESCUE_ACCEPTED', { fareId, originLocationId: rescueOrigin });
    return player;
  });
}

// Game event emitter
export function emitGameEvent(type, payload) {
  const event = {
    type,
    payload,
    timestamp: Date.now()
  };

  console.log('Game event:', event);

  const persistedEvents = JSON.parse(localStorage.getItem(GAME_EVENTS_KEY) || '[]');
  persistedEvents.unshift(event);
  localStorage.setItem(GAME_EVENTS_KEY, JSON.stringify(persistedEvents.slice(0, 100)));

  // Keep the runtime cache for map/HUD consumers.
  if (!window.CrazyTukGameState) {
    window.CrazyTukGameState = {
      events: []
    };
  }
  window.CrazyTukGameState.events.push(event);
}

export function getGameEvents(limit = 50) {
  return JSON.parse(localStorage.getItem(GAME_EVENTS_KEY) || '[]').slice(0, limit);
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
      const expiredFareId = player.activeFareId;
      player.status = PLAYER_STATES.AVAILABLE;
      player.activeFareId = null;
      player.selectedFareId = null;
      player.activeTrip = null;
      updatePlayer(player);
      emitGameEvent('FARE_EXPIRED', { fareId: expiredFareId });
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
      pickupFuelCost: pickupFuel,
      totalFuelCost: pickupFuel,
      totalFuelSpent: 0,
      progress: 0
    };
    const passenger = getPlayerFare(playerWallet, fareId);
    player.activeTrip.passengerMood = getStartingPassengerMood(getNPCById(passenger?.npcId));
    player.activeTrip.passengerMoodLabel = getPassengerMoodLabel(player.activeTrip.passengerMood);
    player.activeTrip = scheduleEventsForRide(player.activeTrip);

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
    const previousTrip = player.activeTrip;

    const calculatedFuelCost = getPickupFuelCost(fare.destinationLocationId, fare.pickupLocationId);

    // Preserve authored routes where available and price new world locations by distance.
    const route = getRoute(fare.pickupLocationId, fare.destinationLocationId, true) || {
      id: `direct-${fare.pickupLocationId}-${fare.destinationLocationId}`,
      fuelCost: Number.isFinite(calculatedFuelCost) ? calculatedFuelCost : CONFIG.FALLBACK_ROUTE_FUEL,
      durationMs: Math.max(CONFIG.FALLBACK_ROUTE_DURATION_MS, (Number.isFinite(calculatedFuelCost) ? calculatedFuelCost : CONFIG.FALLBACK_ROUTE_FUEL) * CONFIG.ROUTE_DURATION_PER_FUEL_MS)
    };

    player.activeTrip = {
      startedAt: Date.now(),
      leg: 'RIDE',
      pickupLocationId: fare.pickupLocationId,
      destinationLocationId: fare.destinationLocationId,
      fuelCost: route.fuelCost,
      fuelSpent: 0,
      pickupFuelCost: player.activeTrip?.pickupFuelCost || player.activeTrip?.fuelCost || 0,
      pickupFuelSpent: player.activeTrip?.fuelSpent || 0,
      totalFuelCost: (player.activeTrip?.pickupFuelCost || player.activeTrip?.fuelCost || 0) + route.fuelCost,
      totalFuelSpent: player.activeTrip?.fuelSpent || 0,
      progress: 0,
      routeId: route.id
    };
    player.activeTrip.eventHistory = previousTrip?.eventHistory || [];
    player.activeTrip.eventResolved = Boolean(previousTrip?.eventResolved);
    player.activeTrip.passengerEventEmoji = previousTrip?.passengerEventEmoji || null;
    player.activeTrip.passengerMood = previousTrip?.passengerMood ?? 50;
    player.activeTrip.passengerMoodLabel = previousTrip?.passengerMoodLabel || getPassengerMoodLabel(player.activeTrip.passengerMood);
    if (!player.activeTrip.eventResolved && player.activeTrip.eventSchedule?.leg !== 'RIDE') player.activeTrip.eventSchedule = { leg: 'RIDE', nextProgress: .2 + Math.random() * .5 };

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
    const requestedProgress = Math.min(CONFIG.PICKUP_PROGRESS_STEP, 1 - progress);
    const requestedFuel = trip.fuelCost * requestedProgress;
    const fuelConsumed = Math.min(player.fuel, requestedFuel);
    player.fuel = Math.max(0, player.fuel - fuelConsumed);
    trip.fuelSpent = (trip.fuelSpent || 0) + fuelConsumed;
    trip.totalFuelSpent = (trip.pickupFuelSpent || 0) + trip.fuelSpent;
    trip.progress = Math.min(1, progress + (trip.fuelCost > 0 ? fuelConsumed / trip.fuelCost : requestedProgress));

    if (fuelConsumed + Number.EPSILON < requestedFuel && trip.progress < 1) {
      trip.progressAtStall = trip.progress;
      trip.stalledAt = Date.now();
      trip.remainingFuelRequired = Math.max(0, trip.fuelCost - trip.fuelSpent);
      player.status = PLAYER_STATES.STALLED;
      player.stallCount = (player.stallCount || 0) + 1;
      emitGameEvent('PLAYER_STALLED', {
        fareId,
        leg: 'PICKUP',
        progress: trip.progress,
        locationId: trip.fromLocationId || player.locationId
      });
    }

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
    updateFare(fareId, { eventHistory: trip.eventHistory || [], passengerMood: trip.passengerMood, passengerMoodLabel: trip.passengerMoodLabel });
    localStorage.setItem('crazytuk_last_event_history', JSON.stringify(trip.eventHistory || []));
    localStorage.setItem('crazytuk_last_passenger_mood', JSON.stringify({ value: trip.passengerMood, label: trip.passengerMoodLabel }));

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
    if (trip.eventStallUntil && Date.now() < trip.eventStallUntil) return player;

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
      const requestedProgress = Math.min(CONFIG.RIDE_PROGRESS_STEP, 1 - progress);
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
