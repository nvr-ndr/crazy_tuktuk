// Crazy Tuk Game Configuration
// All tunable values should live here for easy balancing

export const CONFIG = {
  // Fuel Configuration
  FUEL_CAPACITY: 100,
  STARTING_FUEL: 20,
  FUEL_PER_ROUTE_KM: 1 / 3,
  FALLBACK_ROUTE_FUEL: 5,
  FALLBACK_ROUTE_DURATION_MS: 6000,
  ROUTE_DURATION_PER_FUEL_MS: 1800,
  PICKUP_PROGRESS_STEP: 0.02,
  RIDE_PROGRESS_STEP: 0.01,
  MIN_GAME_SWAP_USD: 1,
  PRODUCTION_TEST_DEFAULT_SOL: 0.0025,
  PRODUCTION_TEST_MAX_SOL: 0.01,

  // Fare Configuration
  MIN_ACTIVE_FARES: 8,
  MAX_ACTIVE_FARES: 8,
  FARE_EXPIRY_MINUTES: 10,
  FARE_EXPIRY_MAX_MINUTES: 45,

  // Animation Timing
  PICKUP_ANIMATION_MS: 3000,
  ROUTE_REVEAL_MS: 500,
  FARE_COMPLETE_HOLD_MS: 1500,

  // Game Mechanics
  SELECTED_FARE_STRICT: true,
  ALLOW_ROUTE_FALLBACK: true,
  DEV_MODE: true,
  // Tournament wrapper is archived; Daily Agent Mode remains the active agent surface.
  TOURNAMENT_MODE_ENABLED: false,

  // Airport Chance
  AIRPORT_DESTINATION_CHANCE: 0.07,

  // Stall Penalty
  STALL_PENALTY_CAP: 30, // minutes
  RESCUE_REWARD: 25,
  STALL_THRESHOLD: 0,

  // Tournament Configuration
  TOURNAMENT_SHIFT_DURATION_SECONDS: 600,
  TOURNAMENT_STARTING_BANKROLL: 20,
  TOURNAMENT_PIT_CALLS: 3,
  TOURNAMENT_MOCK_SWAP_USD: 3,
  TOURNAMENT_DFLOW_QUOTE_INPUT_AMOUNT_LAMPORTS: 30000000,
  DAILY_AGENT_GAS_ALLOCATION: 100,

};

// Fuel curve configuration
// Maps USD swap values to fuel rewards
export const FUEL_TIERS = [
  { minUsd: 1,   maxUsd: 4.99,  fuel: 3 },
  { minUsd: 5,   maxUsd: 9.99,  fuel: 5 },
  { minUsd: 10,  maxUsd: 24.99, fuel: 8 },
  { minUsd: 25,  maxUsd: 49.99, fuel: 12 },
  { minUsd: 50,  maxUsd: 99.99, fuel: 16 },
  { minUsd: 100, maxUsd: Infinity, fuel: 20 }
];

// Fare condition types
export const FARE_CONDITION_TYPES = [
  "ANY_SWAP",
  "SOL_PAIR",
  "STABLE_TO_STABLE",
  "STABLE_TO_VOLATILE",
  "VOLATILE_TO_STABLE",
  "MIN_USD"
];

export const TRAFFIC_LEVELS = ['GREEN', 'YELLOW', 'RED'];

// Game states for player
export const PLAYER_STATES = {
  AVAILABLE: "AVAILABLE",
  PICKUP: "PICKUP",
  DRIVING: "DRIVING",
  STALLED: "STALLED",
  ABANDONED_RESCUABLE: "ABANDONED_RESCUABLE"
};

// Supported MVP tokens
export const TOKENS = [
  { mint: 'SOL', symbol: 'SOL', name: 'Solana', decimals: 9, category: 'volatile' },
  { mint: 'USDC', symbol: 'USDC', name: 'USD Coin', decimals: 6, category: 'stable' },
  { mint: 'USDT', symbol: 'USDT', name: 'Tether', decimals: 6, category: 'stable' },
  { mint: 'BONK', symbol: 'BONK', name: 'Bonk', decimals: 5, category: 'volatile' },
  { mint: 'JUP', symbol: 'JUP', name: 'Jupiter', decimals: 6, category: 'volatile' },
  { mint: 'PENGU', symbol: 'PENGU', name: 'Pudgy Penguins', decimals: 9, category: 'volatile' }
];

// Token categories for game rules
export const STABLE_TOKENS = ['USDC', 'USDT'];
export const VOLATILE_TOKENS = ['SOL', 'BONK', 'JUP', 'PENGU'];

// Game event types for analytics
export const GAME_EVENT_TYPES = {
  WALLET_CONNECTED: "WALLET_CONNECTED",
  FARE_SELECTED: "FARE_SELECTED",
  FARE_ASSIGNED: "FARE_ASSIGNED",
  SWAP_CONFIRMED: "SWAP_CONFIRMED",
  FUEL_AWARDED: "FUEL_AWARDED",
  PICKUP_STARTED: "PICKUP_STARTED",
  PICKUP_REACHED: "PICKUP_REACHED",
  DESTINATION_REVEALED: "DESTINATION_REVEALED",
  TRIP_STARTED: "TRIP_STARTED",
  PLAYER_STALLED: "PLAYER_STALLED",
  TRIP_RESUMED: "TRIP_RESUMED",
  FARE_COMPLETED: "FARE_COMPLETED"
};
