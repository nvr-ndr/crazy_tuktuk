// Crazy Tuk Route Data
// Predefined routes between Bangkok locations for gameplay

export const ROUTES = {
  "khao-san-yaowarat": {
    id: "khao-san-yaowarat",
    from: "khao-san",
    to: "yaowarat",
    durationMs: 12000,
    fuelCost: 3,
    coordinates: [
      [100.5032, 13.7490],
      [100.5085, 13.7510],
      [100.5129, 13.7530],
      [100.5170, 13.7560],
      [100.5197, 13.7623]
    ],
    reversible: true
  },
  "khao-san-siam": {
    id: "khao-san-siam",
    from: "khao-san",
    to: "siam",
    durationMs: 9000,
    fuelCost: 2,
    coordinates: [
      [100.5032, 13.7490],
      [100.5090, 13.7475],
      [100.5120, 13.7460],
      [100.5140, 13.7450],
      [100.5160, 13.7440],
      [100.5180, 13.7430],
      [100.5235, 13.7404]
    ],
    reversible: true
  },
  "yaowarat-silom": {
    id: "yaowarat-silom",
    from: "yaowarat",
    to: "silom",
    durationMs: 15000,
    fuelCost: 5,
    coordinates: [
      [100.5197, 13.7623],
      [100.5220, 13.7600],
      [100.5245, 13.7570],
      [100.5265, 13.7540],
      [100.5280, 13.7500],
      [100.5293, 13.7248]
    ],
    reversible: true
  },
  "siam-silom": {
    id: "siam-silom",
    from: "siam",
    to: "silom",
    durationMs: 11000,
    fuelCost: 3,
    coordinates: [
      [100.5235, 13.7404],
      [100.5255, 13.7380],
      [100.5275, 13.7350],
      [100.5285, 13.7320],
      [100.5293, 13.7248]
    ],
    reversible: true
  },
  "siam-lumpini": {
    id: "siam-lumpini",
    from: "siam",
    to: "lumpini",
    durationMs: 14000,
    fuelCost: 4,
    coordinates: [
      [100.5235, 13.7404],
      [100.5290, 13.7420],
      [100.5330, 13.7460],
      [100.5362, 13.7674]
    ],
    reversible: true
  },
  "yaowarat-lumpini": {
    id: "yaowarat-lumpini",
    from: "yaowarat",
    to: "lumpini",
    durationMs: 16000,
    fuelCost: 6,
    coordinates: [
      [100.5197, 13.7623],
      [100.5230, 13.7640],
      [100.5265, 13.7660],
      [100.5290, 13.7670],
      [100.5315, 13.7675],
      [100.5362, 13.7674]
    ],
    reversible: true
  },
  "siam-asok": {
    id: "siam-asok",
    from: "siam",
    to: "asok",
    durationMs: 10000,
    fuelCost: 3,
    coordinates: [
      [100.5235, 13.7404],
      [100.5350, 13.7350],
      [100.5400, 13.7330],
      [100.5430, 13.7320],
      [100.5440, 13.7310],
      [100.5450, 13.7300],
      [100.5548, 13.7306]
    ],
    reversible: true
  },
  "yaowarat-asok": {
    id: "yaowarat-asok",
    from: "yaowarat",
    to: "asok",
    durationMs: 18000,
    fuelCost: 7,
    coordinates: [
      [100.5197, 13.7623],
      [100.5250, 13.7600],
      [100.5300, 13.7580],
      [100.5350, 13.7560],
      [100.5400, 13.7540],
      [100.5430, 13.7320],
      [100.5548, 13.7306]
    ],
    reversible: true
  },
  "siam-sathorn": {
    id: "siam-sathorn",
    from: "siam",
    to: "sathorn",
    durationMs: 9000,
    fuelCost: 2,
    coordinates: [
      [100.5235, 13.7404],
      [100.5250, 13.7380],
      [100.5270, 13.7350],
      [100.5290, 13.7320],
      [100.5300, 13.7280],
      [100.5305, 13.7260],
      [100.5310, 13.7230],
      [100.5231, 13.7142]
    ],
    reversible: true
  },
  "lumpini-chatuchak": {
    id: "lumpini-chatuchak",
    from: "lumpini",
    to: "chatuchak",
    durationMs: 22000,
    fuelCost: 8,
    coordinates: [
      [100.5362, 13.7674],
      [100.5420, 13.7650],
      [100.5480, 13.7600],
      [100.5500, 13.7550],
      [100.5310, 13.7950],
      [100.5250, 13.8150],
      [100.5327, 13.8308]
    ],
    reversible: true
  },
  "chatuchak-siam": {
    id: "chatuchak-siam",
    from: "chatuchak",
    to: "siam",
    durationMs: 20000,
    fuelCost: 7,
    coordinates: [
      [100.5327, 13.8308],
      [100.5300, 13.8100],
      [100.5250, 13.7950],
      [100.5200, 13.7800],
      [100.5150, 13.7650],
      [100.5130, 13.7530],
      [100.5120, 13.7460],
      [100.5235, 13.7404]
    ],
    reversible: true
  },
  "thonglor-siam": {
    id: "thonglor-siam",
    from: "thonglor",
    to: "siam",
    durationMs: 11000,
    fuelCost: 4,
    coordinates: [
      [100.5635, 13.7300],
      [100.5600, 13.7320],
      [100.5550, 13.7340],
      [100.5520, 13.7340],
      [100.5480, 13.7330],
      [100.5440, 13.7310],
      [100.5400, 13.7330],
      [100.5380, 13.7350],
      [100.5360, 13.7360],
      [100.5250, 13.7430],
      [100.5235, 13.7404]
    ],
    reversible: true
  }
};

// Route lookup function
export function getRoute(fromId, toId, reversible = false) {
  // Try exact route
  let route = ROUTES[`${fromId}-${toId}`];

  // Try reversed if allowed
  if (!route && reversible) {
    route = ROUTES[`${toId}-${fromId}`];
  }

  return route || null;
}

// Find all routes from a location
export function getRoutesFromLocation(locationId) {
  return Object.values(ROUTES).filter(
    route => route.from === locationId
  );
}

// Validate that a route has valid coordinates
export function validateRoute(route) {
  if (!route) return false;
  if (route.coordinates.length < 2) return false;
  if (route.durationMs <= 0) return false;
  if (route.fuelCost < 0) return false;

  // Check coordinates format
  return route.coordinates.every(coord => {
    return Array.isArray(coord) &&
           coord.length === 2 &&
           typeof coord[0] === 'number' &&
           typeof coord[1] === 'number';
  });
}

// Test all routes at startup
export function validateRoutes() {
  Object.keys(ROUTES).forEach(routeId => {
    const route = ROUTES[routeId];
    if (!validateRoute(route)) {
      console.error(`Invalid route: ${routeId}`, route);
    }
  });
  console.log(`${Object.keys(ROUTES).length} routes validated successfully`);
}

// Get random route
export function getRandomRoute(fromId = null, toId = null) {
  const routes = fromId && toId
    ? [ROUTES[`${fromId}-${toId}`]]
    : Object.values(ROUTES);

  return routes[Math.floor(Math.random() * routes.length)];
}