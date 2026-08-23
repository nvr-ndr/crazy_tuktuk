// Crazy Tuk Location Data
// Bangkok game locations for Crazy Tuk gameplay

export const LOCATIONS = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "khao-san",
      properties: {
        name: "Khao San Road",
        zoneId: "old-town-khao-san",
        zoneLabel: "Old Town / Khao San",
        kind: "landmark",
        icon: "khao-san",
        startingLocation: true,
        farePickup: true,
        fareDestination: false
      },
      geometry: {
        type: "Point",
        coordinates: [100.5032, 13.7490]
      }
    },
    {
      type: "Feature",
      id: "yaowarat",
      properties: {
        name: "Yaowarat Road",
        zoneId: "yaowarat-chinatown",
        zoneLabel: "Yaowarat / Chinatown",
        kind: "landmark",
        icon: "yaowarat",
        startingLocation: false,
        farePickup: true,
        fareDestination: false
      },
      geometry: {
        type: "Point",
        coordinates: [100.5197, 13.7623]
      }
    },
    {
      type: "Feature",
      id: "siam",
      properties: {
        name: "MBK Center",
        zoneId: "siam-central",
        zoneLabel: "Siam / Central",
        kind: "shopping",
        icon: "siam",
        startingLocation: false,
        farePickup: true,
        fareDestination: false
      },
      geometry: {
        type: "Point",
        coordinates: [100.5235, 13.7404]
      }
    },
    {
      type: "Feature",
      id: "silom",
      properties: {
        name: "Silom Road",
        zoneId: "silom-sathorn",
        zoneLabel: "Silom / Sathorn",
        kind: "business",
        icon: "silom",
        startingLocation: false,
        farePickup: true,
        fareDestination: false
      },
      geometry: {
        type: "Point",
        coordinates: [100.5293, 13.7248]
      }
    },
    {
      type: "Feature",
      id: "lumpini",
      properties: {
        name: "Lumpini Park",
        zoneId: "lumpini-rama-iv",
        zoneLabel: "Lumpini / Rama IV",
        kind: "park",
        icon: "lumpini",
        startingLocation: false,
        farePickup: true,
        fareDestination: false
      },
      geometry: {
        type: "Point",
        coordinates: [100.5362, 13.7674]
      }
    },
    {
      type: "Feature",
      id: "chatuchak",
      properties: {
        name: "Chatuchak Weekend Market",
        zoneId: "ari-chatuchak",
        zoneLabel: "Ari / Chatuchak",
        kind: "market",
        icon: "chatuchak",
        startingLocation: false,
        farePickup: true,
        fareDestination: false
      },
      geometry: {
        type: "Point",
        coordinates: [100.5327, 13.8308]
      }
    },
    {
      type: "Feature",
      id: "sathorn",
      properties: {
        name: "Sathorn",
        zoneId: "silom-sathorn",
        zoneLabel: "Silom / Sathorn",
        kind: "business",
        icon: "sathorn",
        startingLocation: false,
        farePickup: true,
        fareDestination: false
      },
      geometry: {
        type: "Point",
        coordinates: [100.5231, 13.7142]
      }
    },
    {
      type: "Feature",
      id: "asok",
      properties: {
        name: "Asok BTS / MRT",
        zoneId: "sukhumvit-asok",
        zoneLabel: "Sukhumvit / Asok",
        kind: "transport",
        icon: "asok",
        startingLocation: false,
        farePickup: true,
        fareDestination: false
      },
      geometry: {
        type: "Point",
        coordinates: [100.5548, 13.7306]
      }
    },
    {
      type: "Feature",
      id: "thonglor",
      properties: {
        name: "Bad Decisions Cocktail Club",
        zoneId: "thonglor-ekkamai",
        zoneLabel: "Thonglor / Ekkamai",
        kind: "neighborhood",
        icon: "thonglor",
        startingLocation: false,
        farePickup: true,
        fareDestination: false
      },
      geometry: {
        type: "Point",
        coordinates: [100.5635, 13.7300]
      }
    },
    {
      type: "Feature",
      id: "ari",
      properties: {
        name: "Minimalist Cafe With No Sign",
        zoneId: "ari-chatuchak",
        zoneLabel: "Ari / Chatuchak",
        kind: "neighborhood",
        icon: "ari",
        startingLocation: false,
        farePickup: true,
        fareDestination: false
      },
      geometry: {
        type: "Point",
        coordinates: [100.5389, 13.7764]
      }
    },
    {
      type: "Feature",
      id: "old-city",
      properties: {
        name: "Old City",
        zoneId: "old-town-khao-san",
        zoneLabel: "Old Town / Khao San",
        kind: "historic",
        icon: "old-city",
        startingLocation: false,
        farePickup: true,
        fareDestination: false
      },
      geometry: {
        type: "Point",
        coordinates: [100.5024, 13.7471]
      }
    },
    {
      type: "Feature",
      id: "suvarnabhumi",
      properties: {
        name: "Suvarnabhumi Airport",
        zoneId: "special-outer",
        zoneLabel: "Greater Bangkok",
        kind: "transport",
        icon: "airport",
        startingLocation: false,
        farePickup: false,
        fareDestination: true
      },
      geometry: {
        type: "Point",
        coordinates: [100.7550, 13.6890]
      }
    }
  ]
};

// Helper functions for location data

export function getLocationById(id) {
  return LOCATIONS.features.find(loc => loc.id === id) || null;
}

export function getStartingLocation() {
  return getLocationById("khao-san");
}

export function getLocationsByType(type) {
  return LOCATIONS.features
    .filter(loc => loc.properties.kind === type)
    .map(loc => ({
      id: loc.id,
      ...loc.properties,
      coordinates: loc.geometry.coordinates
    }));
}

// Random location selector (excluding given location)
export function getRandomLocation(excludeId = null) {
  const available = LOCATIONS.features
    .filter(loc => loc.id !== excludeId && !loc.properties.startingLocation)
    .map(loc => ({
      id: loc.id,
      ...loc.properties,
      coordinates: loc.geometry.coordinates
    }));

  return available[Math.floor(Math.random() * available.length)];
}
