// Crazy Tuk NPC Data
// Placeholder NPCs for MVP

import { CONFIG, FARE_CONDITION_TYPES } from './config.js';
import { getRandomLocation } from './locations.js';
import { ROUTES } from './routes.js';

export const NPCs = {
  "tourist-dave": {
    id: "tourist-dave",
    name: "Dave",
    avatar: "🇺🇸",
    bio: "First time in Thailand. Already sunburned and ready for adventure.",
    personality: "confused tourist",
    preferredZones: ["khao-san", "siam"],
    pickupLines: [
      "Hey man, you got any recommendations for local spots?",
      "Is this the famous nightlife district?",
      "Can you drive me somewhere... safe?",
      "How much to take me to the hotel?"
    ],
    stallComments: [
      "I've been waiting forever!",
      "My flight leaves in 2 hours!",
      "You're actually going to make me miss it?",
      "Is this a bug in the game or what?"
    ],
    completionReviews: [
      "Not too bad! Pretty scenic route actually.",
      "Thanks for the ride, took a bit longer than expected but okay.",
      "Good driver, not too crazy. Would recommend.",
      "I'll remember this for my YouTube travel vlog!"
    ]
  },
  "business-polloy": {
    id: "business-polloy",
    name: "Ploy",
    avatar: "💼",
    bio: "PR manager with three phones and no patience. Catches flights every day.",
    personality: "impatient professional",
    preferredZones: ["siam", "silom", "asok"],
    pickupLines: [
      "I need to be there in 20 minutes. You can do it, right?",
      "Is traffic that bad? Tell me it's not.",
      "I have a meeting starting in 15 minutes.",
      "Just get me there. I'm paying top dollar."
    ],
    stallComments: [
      "Are you serious? I have meetings all afternoon!",
      "This is unacceptable service.",
      "You're going to lose a VIP customer.",
      "I'm going to post about this!"
    ],
    completionReviews: [
      "Fastest ride ever. You saved my career.",
      "Solid. Get me there on time next time and you're golden.",
      "Not bad for rush hour. Impressed.",
      "Efficient. Clean. Professional. Well done."
    ]
  },
  "cook-bank": {
    id: "cook-bank",
    name: "Bank",
    avatar: "🎧",
    bio: "DJ by night, cook by day. Always has a beat in their headphones.",
    personality: "chill creative",
    preferredZones: ["yaowarat", "thonglor", "old-city"],
    pickupLines: [
      "Got any good playlists for this route?",
      "Is there any drama in this neighborhood?",
      "I'm looking for inspiration. Can you drive me somewhere cool?",
      "This beats listening to the radio."
    ],
    stallComments: [
      "So long... I could have mixed another track.",
      "Guess I'll just vibe out here.",
      "Music's gotta keep playing though.",
      "At least the beat drop made the wait worth it."
    ],
    completionReviews: [
      "That vibe! Perfect driving music selection.",
      "Chill ride. Good energy. Would do again.",
      "You've got taste. The route was trippy.",
      "Just what I needed. Thanks for the journey."
    ]
  },
  "crypto-bro": {
    id: "crypto-bro",
    name: "Crypto Bob",
    avatar: "📊",
    bio: "Here for 'business.' Nobody knows what business. Probably trading.",
    personality: "mysterious investor",
    preferredZones: ["silom", "asok", "sathorn"],
    pickupLines: [
      "Any whale movements in this area?",
      "Is this a strategic spot for crypto infra?",
      "I need to get somewhere fast. If there's alpha, better than get there.",
      "Tell me I'm getting a good yield on this fare."
    ],
    stallComments: [
      "This wait is longer than a block confirmation.",
      "Are you staking on my arrival?",
      "Imagine the fees if I got here late.",
      "This volatility is unreal."
    ],
    completionReviews: [
      "That's what I call a moon mission. 10/10.",
      "Smooth ride. Hoping for my bags to pump.",
      "Market dip though. You better make it worth it.",
      "Solid route. Feels like a win."
    ]
  },
  "retired-lek": {
    id: "retired-lek",
    name: "Auntie Lek",
    avatar: "👵",
    bio: "Retired teacher. Knows every shortcut and will tell you when you're wrong.",
    personality: "know-it-all",
    preferredZones: ["old-city", "khao-san", "chatuchak"],
    pickupLines: [
      "Young man, you missed the true route there.",
      "I've lived here 50 years and never missed this way.",
      "Do you know where you're going? I can take you the better way.",
      "Keep going that direction and you'll hit the river, not my destination."
    ],
    stallComments: [
      "You've never seen a street like this in your life!",
      "This isn't even the longest way to there.",
      "You kids today are too obsessed with GPS.",
      "Imagine if I took the old routes..."
    ],
    completionReviews: [
      "An interesting detour. Not bad.",
      "You have a lot to learn about Bangkok.",
      "I've taught better taxi drivers.",
      "Interesting route, but I suppose it's okay."
    ]
  }
};

// Helper functions for NPC data

export function getNPCById(id) {
  return NPCs[id] || null;
}

export function getRandomNPC() {
  const npcIds = Object.keys(NPCs);
  return NPCs[npcIds[Math.floor(Math.random() * npcIds.length)]];
}

export function filterNPCsByZone(zone) {
  return Object.values(NPCs).filter(npc => npc.preferredZones.includes(zone));
}

// Generate a new fare for a given player
export function createFare(playerWallet, npcId) {
  const npc = getNPCById(npcId);
  if (!npc) return null;

  const availableRoutes = Object.values(ROUTES);
  const selectedRoute = availableRoutes[Math.floor(Math.random() * availableRoutes.length)];
  const reverseRoute = selectedRoute.reversible && Math.random() < .5;
  const pickupLocationId = reverseRoute ? selectedRoute.to : selectedRoute.from;
  const destinationLocationId = reverseRoute ? selectedRoute.from : selectedRoute.to;

  // Random fare condition
  const conditionTypes = Object.values(FARE_CONDITION_TYPES);
  const condition = conditionTypes[Math.floor(Math.random() * conditionTypes.length)];

  // Random point value
  const pointValues = [10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100];
  const pointValue = pointValues[Math.floor(Math.random() * pointValues.length)];
  const minimumUsdValues = [1, 1, 5, 10, 25];
  const minimumUsd = minimumUsdValues[Math.floor(Math.random() * minimumUsdValues.length)];

  // Random expiration time
  const expiryMin = CONFIG.FARE_EXPIRY_MINUTES;
  const expiryMax = CONFIG.FARE_EXPIRY_MAX_MINUTES;
  const expiryMinutes = Math.floor(Math.random() * (expiryMax - expiryMin + 1)) + expiryMin;
  const expiresAt = Date.now() + (expiryMinutes * 60 * 1000);

  return {
    id: `fare-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    wallet: playerWallet,
    npcId: npcId,
    pickupLocationId,
    destinationLocationId,
    condition: condition,
    minimumUsd: condition === "MIN_USD" ? minimumUsd : 1,
    pointValue: pointValue,
    expiresAt: expiresAt,
    status: "AVAILABLE"
  };
}
