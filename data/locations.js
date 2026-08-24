// Canonical Crazy Tuk world registry sourced from CRAZY_TUK_WORLD.md.
import { OUTER_LOCATIONS, OUTER_ZONE_ANCHORS } from './locationExpansion.js';

export const ZONE_ANCHORS = [
  {
    "id": "old_town",
    "label": "Old Town / Khao San",
    "coordinates": [
      100.4977,
      13.7568
    ]
  },
  {
    "id": "yaowarat",
    "label": "Yaowarat / Chinatown",
    "coordinates": [
      100.5094,
      13.7404
    ]
  },
  {
    "id": "siam",
    "label": "Siam / Chidlom",
    "coordinates": [
      100.5361,
      13.746
    ]
  },
  {
    "id": "silom",
    "label": "Silom / Sathorn / Lumpini",
    "coordinates": [
      100.535,
      13.7278
    ]
  },
  {
    "id": "asok",
    "label": "Asok / Phrom Phong",
    "coordinates": [
      100.5637,
      13.7338
    ]
  },
  {
    "id": "thonglor",
    "label": "Thonglor / Ekkamai",
    "coordinates": [
      100.5821,
      13.7249
    ]
  },
  {
    "id": "ratchada",
    "label": "Ratchada / Phetchaburi",
    "coordinates": [
      100.5746,
      13.7527
    ]
  },
  {
    "id": "ari",
    "label": "Ari / Chatuchak",
    "coordinates": [
      100.5477,
      13.7885
    ]
  },
  {
    "id": "river",
    "label": "Charoen Krung / Riverside",
    "coordinates": [
      100.5145,
      13.724
    ]
  },
  {
    "id": "phra_khanong",
    "label": "Phra Khanong / Punnawithi",
    "coordinates": [
      100.6012,
      13.7003
    ]
  },
  ...OUTER_ZONE_ANCHORS
];

export const LOCATIONS = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "old_khao_san",
      "properties": {
        "name": "Khao San Road",
        "shortName": "Khao San Road",
        "zoneId": "old_town",
        "zoneLabel": "Old Town / Khao San",
        "type": "REAL",
        "coordStatus": "REPRESENTATIVE",
        "categories": [
          "nightlife",
          "tourism"
        ],
        "kind": "nightlife",
        "startingLocation": true,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.4971,
          13.7589
        ]
      }
    },
    {
      "type": "Feature",
      "id": "old_grand_palace",
      "properties": {
        "name": "Grand Palace",
        "shortName": "Grand Palace",
        "zoneId": "old_town",
        "zoneLabel": "Old Town / Khao San",
        "type": "REAL",
        "coordStatus": "REPRESENTATIVE",
        "categories": [
          "landmark",
          "tourism"
        ],
        "kind": "landmark",
        "startingLocation": false,
        "farePickup": false,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.4913,
          13.75
        ]
      }
    },
    {
      "type": "Feature",
      "id": "old_lost_backpack",
      "properties": {
        "name": "Lost Backpack Hostel",
        "shortName": "Lost Backpack Hostel",
        "zoneId": "old_town",
        "zoneLabel": "Old Town / Khao San",
        "type": "FICTIONAL",
        "coordStatus": "ART_DIRECTED",
        "categories": [
          "hostel"
        ],
        "kind": "hostel",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "The backpack is not coming back.",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.4993,
          13.7607
        ]
      }
    },
    {
      "type": "Feature",
      "id": "old_scorpion_smoothie",
      "properties": {
        "name": "Scorpion & Smoothie Cart",
        "shortName": "Scorpion & Smoothie Cart",
        "zoneId": "old_town",
        "zoneLabel": "Old Town / Khao San",
        "type": "FICTIONAL",
        "coordStatus": "ART_DIRECTED",
        "categories": [
          "street_food"
        ],
        "kind": "street_food",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "Protein is protein.",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.5006,
          13.7572
        ]
      }
    },
    {
      "type": "Feature",
      "id": "old_temple_gate",
      "properties": {
        "name": "Quiet Temple Side Gate",
        "shortName": "Quiet Temple Side Gate",
        "zoneId": "old_town",
        "zoneLabel": "Old Town / Khao San",
        "type": "FICTIONAL",
        "coordStatus": "ART_DIRECTED",
        "categories": [
          "temple",
          "neighborhood"
        ],
        "kind": "temple",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "Please do not block the gate.",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.4954,
          13.7543
        ]
      }
    },
    {
      "type": "Feature",
      "id": "yao_yaowarat_road",
      "properties": {
        "name": "Yaowarat Road",
        "shortName": "Yaowarat Road",
        "zoneId": "yaowarat",
        "zoneLabel": "Yaowarat / Chinatown",
        "type": "REAL",
        "coordStatus": "REPRESENTATIVE",
        "categories": [
          "street",
          "food",
          "nightlife"
        ],
        "kind": "street",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.5095,
          13.7398
        ]
      }
    },
    {
      "type": "Feature",
      "id": "yao_wat_mangkon",
      "properties": {
        "name": "Wat Mangkon",
        "shortName": "Wat Mangkon",
        "zoneId": "yaowarat",
        "zoneLabel": "Yaowarat / Chinatown",
        "type": "REAL",
        "coordStatus": "REPRESENTATIVE",
        "categories": [
          "temple",
          "landmark"
        ],
        "kind": "temple",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.5092,
          13.7421
        ]
      }
    },
    {
      "type": "Feature",
      "id": "yao_midnight_noodles",
      "properties": {
        "name": "Midnight Noodle Shop",
        "shortName": "Midnight Noodle Shop",
        "zoneId": "yaowarat",
        "zoneLabel": "Yaowarat / Chinatown",
        "type": "FICTIONAL",
        "coordStatus": "ART_DIRECTED",
        "categories": [
          "food"
        ],
        "kind": "food",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "Closed once in 2017.",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.5118,
          13.7383
        ]
      }
    },
    {
      "type": "Feature",
      "id": "yao_mahjong",
      "properties": {
        "name": "Definitely Legal Mahjong Club",
        "shortName": "Definitely Legal Mahjong Club",
        "zoneId": "yaowarat",
        "zoneLabel": "Yaowarat / Chinatown",
        "type": "FICTIONAL",
        "coordStatus": "ART_DIRECTED",
        "categories": [
          "nightlife",
          "mystery"
        ],
        "kind": "nightlife",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "You didn't hear about it from us.",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.5065,
          13.7416
        ]
      }
    },
    {
      "type": "Feature",
      "id": "yao_lucky_gold_phone",
      "properties": {
        "name": "Lucky Lucky Gold & Phone Repair",
        "shortName": "Lucky Lucky Gold & Phone Repair",
        "zoneId": "yaowarat",
        "zoneLabel": "Yaowarat / Chinatown",
        "type": "FICTIONAL",
        "coordStatus": "ART_DIRECTED",
        "categories": [
          "retail"
        ],
        "kind": "retail",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "Cash, gold, batteries, chargers. Probably.",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.5141,
          13.7369
        ]
      }
    },
    {
      "type": "Feature",
      "id": "siam_mbk",
      "properties": {
        "name": "MBK Center",
        "shortName": "MBK Center",
        "zoneId": "siam",
        "zoneLabel": "Siam / Chidlom",
        "type": "REAL",
        "coordStatus": "REPRESENTATIVE",
        "categories": [
          "mall",
          "retail"
        ],
        "kind": "mall",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.5296,
          13.7446
        ]
      }
    },
    {
      "type": "Feature",
      "id": "siam_square",
      "properties": {
        "name": "Siam Square",
        "shortName": "Siam Square",
        "zoneId": "siam",
        "zoneLabel": "Siam / Chidlom",
        "type": "REAL",
        "coordStatus": "REPRESENTATIVE",
        "categories": [
          "shopping",
          "youth"
        ],
        "kind": "shopping",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.5347,
          13.7441
        ]
      }
    },
    {
      "type": "Feature",
      "id": "siam_bacc",
      "properties": {
        "name": "Bangkok Art & Culture Centre",
        "shortName": "Bangkok Art & Culture Centre",
        "zoneId": "siam",
        "zoneLabel": "Siam / Chidlom",
        "type": "REAL",
        "coordStatus": "REPRESENTATIVE",
        "categories": [
          "arts"
        ],
        "kind": "arts",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.53,
          13.7465
        ]
      }
    },
    {
      "type": "Feature",
      "id": "siam_bubble_tea",
      "properties": {
        "name": "240 Baht Bubble Tea",
        "shortName": "240 Baht Bubble Tea",
        "zoneId": "siam",
        "zoneLabel": "Siam / Chidlom",
        "type": "FICTIONAL",
        "coordStatus": "ART_DIRECTED",
        "categories": [
          "cafe"
        ],
        "kind": "cafe",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "The pearls cost extra.",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.5368,
          13.7463
        ]
      }
    },
    {
      "type": "Feature",
      "id": "siam_phone_repair",
      "properties": {
        "name": "Phone Repair Guy",
        "shortName": "Phone Repair Guy",
        "zoneId": "siam",
        "zoneLabel": "Siam / Chidlom",
        "type": "FICTIONAL",
        "coordStatus": "ART_DIRECTED",
        "categories": [
          "electronics"
        ],
        "kind": "electronics",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "Come back in twenty minutes.",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.532,
          13.7431
        ]
      }
    },
    {
      "type": "Feature",
      "id": "sil_lumpini",
      "properties": {
        "name": "Lumpini Park",
        "shortName": "Lumpini Park",
        "zoneId": "silom",
        "zoneLabel": "Silom / Sathorn / Lumpini",
        "type": "REAL",
        "coordStatus": "REPRESENTATIVE",
        "categories": [
          "park"
        ],
        "kind": "park",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.5418,
          13.731
        ]
      }
    },
    {
      "type": "Feature",
      "id": "sil_sala_daeng",
      "properties": {
        "name": "Sala Daeng / Silom",
        "shortName": "Sala Daeng / Silom",
        "zoneId": "silom",
        "zoneLabel": "Silom / Sathorn / Lumpini",
        "type": "REAL",
        "coordStatus": "REPRESENTATIVE",
        "categories": [
          "transit",
          "nightlife"
        ],
        "kind": "transit",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.5341,
          13.7286
        ]
      }
    },
    {
      "type": "Feature",
      "id": "sil_face_factory",
      "properties": {
        "name": "Face Factory Clinic",
        "shortName": "Face Factory Clinic",
        "zoneId": "silom",
        "zoneLabel": "Silom / Sathorn / Lumpini",
        "type": "FICTIONAL",
        "coordStatus": "ART_DIRECTED",
        "categories": [
          "beauty",
          "clinic"
        ],
        "kind": "beauty",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "Do not ask about the bandages.",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.5331,
          13.7248
        ]
      }
    },
    {
      "type": "Feature",
      "id": "sil_crypto_dungeon",
      "properties": {
        "name": "Crypto Coworking Dungeon",
        "shortName": "Crypto Coworking Dungeon",
        "zoneId": "silom",
        "zoneLabel": "Silom / Sathorn / Lumpini",
        "type": "FICTIONAL",
        "coordStatus": "ART_DIRECTED",
        "categories": [
          "coworking",
          "crypto"
        ],
        "kind": "coworking",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "It worked locally.",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.5296,
          13.7262
        ]
      }
    },
    {
      "type": "Feature",
      "id": "sil_lunch_auntie",
      "properties": {
        "name": "Lunch Auntie",
        "shortName": "Lunch Auntie",
        "zoneId": "silom",
        "zoneLabel": "Silom / Sathorn / Lumpini",
        "type": "FICTIONAL",
        "coordStatus": "ART_DIRECTED",
        "categories": [
          "food"
        ],
        "kind": "food",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "You look thin. Eat.",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.5278,
          13.7297
        ]
      }
    },
    {
      "type": "Feature",
      "id": "asok_terminal21",
      "properties": {
        "name": "Terminal 21",
        "shortName": "Terminal 21",
        "zoneId": "asok",
        "zoneLabel": "Asok / Phrom Phong",
        "type": "REAL",
        "coordStatus": "REPRESENTATIVE",
        "categories": [
          "mall"
        ],
        "kind": "mall",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.5602,
          13.7378
        ]
      }
    },
    {
      "type": "Feature",
      "id": "asok_station",
      "properties": {
        "name": "Asok BTS / Sukhumvit MRT",
        "shortName": "Asok BTS / Sukhumvit MRT",
        "zoneId": "asok",
        "zoneLabel": "Asok / Phrom Phong",
        "type": "REAL",
        "coordStatus": "REPRESENTATIVE",
        "categories": [
          "transit"
        ],
        "kind": "transit",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.5604,
          13.737
        ]
      }
    },
    {
      "type": "Feature",
      "id": "asok_benjakitti",
      "properties": {
        "name": "Benjakitti Park",
        "shortName": "Benjakitti Park",
        "zoneId": "asok",
        "zoneLabel": "Asok / Phrom Phong",
        "type": "REAL",
        "coordStatus": "REPRESENTATIVE",
        "categories": [
          "park"
        ],
        "kind": "park",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.5585,
          13.7304
        ]
      }
    },
    {
      "type": "Feature",
      "id": "asok_visa_run",
      "properties": {
        "name": "Visa Run Travel Agency",
        "shortName": "Visa Run Travel Agency",
        "zoneId": "asok",
        "zoneLabel": "Asok / Phrom Phong",
        "type": "FICTIONAL",
        "coordStatus": "ART_DIRECTED",
        "categories": [
          "travel"
        ],
        "kind": "travel",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "Passport?",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.5633,
          13.7391
        ]
      }
    },
    {
      "type": "Feature",
      "id": "asok_omakase",
      "properties": {
        "name": "Omakase You Can't Afford",
        "shortName": "Omakase You Can't Afford",
        "zoneId": "asok",
        "zoneLabel": "Asok / Phrom Phong",
        "type": "FICTIONAL",
        "coordStatus": "ART_DIRECTED",
        "categories": [
          "restaurant"
        ],
        "kind": "restaurant",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "If you have to ask...",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.5679,
          13.7327
        ]
      }
    },
    {
      "type": "Feature",
      "id": "thong_based_studio",
      "properties": {
        "name": "Based Studio",
        "shortName": "Based Studio",
        "zoneId": "thonglor",
        "zoneLabel": "Thonglor / Ekkamai",
        "type": "CRYPTO_REAL",
        "coordStatus": "VERIFIED",
        "categories": [
          "studio",
          "coworking",
          "event"
        ],
        "kind": "studio",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "",
        "eventTags": [
          "solana",
          "superteam",
          "dflow"
        ],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.5799154,
          13.7249752
        ]
      }
    },
    {
      "type": "Feature",
      "id": "thong_thonglor_bts",
      "properties": {
        "name": "Thong Lor BTS",
        "shortName": "Thong Lor BTS",
        "zoneId": "thonglor",
        "zoneLabel": "Thonglor / Ekkamai",
        "type": "REAL",
        "coordStatus": "REPRESENTATIVE",
        "categories": [
          "transit",
          "nightlife"
        ],
        "kind": "transit",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.5784,
          13.7241
        ]
      }
    },
    {
      "type": "Feature",
      "id": "thong_ekkamai_bts",
      "properties": {
        "name": "Ekkamai BTS",
        "shortName": "Ekkamai BTS",
        "zoneId": "thonglor",
        "zoneLabel": "Thonglor / Ekkamai",
        "type": "REAL",
        "coordStatus": "REPRESENTATIVE",
        "categories": [
          "transit"
        ],
        "kind": "transit",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.585,
          13.7194
        ]
      }
    },
    {
      "type": "Feature",
      "id": "thong_bad_decisions",
      "properties": {
        "name": "Bad Decisions Cocktail Club",
        "shortName": "Bad Decisions Cocktail Club",
        "zoneId": "thonglor",
        "zoneLabel": "Thonglor / Ekkamai",
        "type": "FICTIONAL",
        "coordStatus": "ART_DIRECTED",
        "categories": [
          "nightlife"
        ],
        "kind": "nightlife",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "Nobody leaves after one.",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.5818,
          13.7282
        ]
      }
    },
    {
      "type": "Feature",
      "id": "thong_basement404",
      "properties": {
        "name": "Basement 404",
        "shortName": "Basement 404",
        "zoneId": "thonglor",
        "zoneLabel": "Thonglor / Ekkamai",
        "type": "FICTIONAL",
        "coordStatus": "ART_DIRECTED",
        "categories": [
          "club",
          "music"
        ],
        "kind": "club",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "No signal. Great sound system.",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.588,
          13.7218
        ]
      }
    },
    {
      "type": "Feature",
      "id": "rat_bel_club_22",
      "properties": {
        "name": "Bel Club 22",
        "shortName": "Bel Club 22",
        "zoneId": "ratchada",
        "zoneLabel": "Ratchada / Phetchaburi",
        "type": "CRYPTO_REAL",
        "coordStatus": "VERIFIED",
        "categories": [
          "padel",
          "event"
        ],
        "kind": "padel",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "",
        "eventTags": [
          "superteam",
          "padel",
          "pudgy",
          "monkedao",
          "jupiter"
        ],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.57202,
          13.74694
        ]
      }
    },
    {
      "type": "Feature",
      "id": "rat_jodd_fairs",
      "properties": {
        "name": "Jodd Fairs / Rama 9 Area",
        "shortName": "Jodd Fairs / Rama 9 Area",
        "zoneId": "ratchada",
        "zoneLabel": "Ratchada / Phetchaburi",
        "type": "REAL",
        "coordStatus": "REPRESENTATIVE",
        "categories": [
          "market",
          "nightlife"
        ],
        "kind": "market",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.5657,
          13.7577
        ]
      }
    },
    {
      "type": "Feature",
      "id": "rat_karaoke_emergency",
      "properties": {
        "name": "Ratchada Karaoke Emergency",
        "shortName": "Ratchada Karaoke Emergency",
        "zoneId": "ratchada",
        "zoneLabel": "Ratchada / Phetchaburi",
        "type": "FICTIONAL",
        "coordStatus": "ART_DIRECTED",
        "categories": [
          "nightlife"
        ],
        "kind": "nightlife",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "Your passenger has already chosen the song.",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.5767,
          13.7541
        ]
      }
    },
    {
      "type": "Feature",
      "id": "rat_founder_recovery",
      "properties": {
        "name": "Founder Recovery Massage",
        "shortName": "Founder Recovery Massage",
        "zoneId": "ratchada",
        "zoneLabel": "Ratchada / Phetchaburi",
        "type": "FICTIONAL",
        "coordStatus": "ART_DIRECTED",
        "categories": [
          "wellness",
          "startup"
        ],
        "kind": "wellness",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "Post-pitch spinal realignment.",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.5683,
          13.7499
        ]
      }
    },
    {
      "type": "Feature",
      "id": "rat_pitchdeck_printer",
      "properties": {
        "name": "Pitch Deck Printer 24H",
        "shortName": "Pitch Deck Printer 24H",
        "zoneId": "ratchada",
        "zoneLabel": "Ratchada / Phetchaburi",
        "type": "FICTIONAL",
        "coordStatus": "ART_DIRECTED",
        "categories": [
          "print",
          "startup"
        ],
        "kind": "print",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "Slide 47 is still exporting.",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.5777,
          13.7479
        ]
      }
    },
    {
      "type": "Feature",
      "id": "ari_chatuchak",
      "properties": {
        "name": "Chatuchak Weekend Market",
        "shortName": "Chatuchak Weekend Market",
        "zoneId": "ari",
        "zoneLabel": "Ari / Chatuchak",
        "type": "REAL",
        "coordStatus": "REPRESENTATIVE",
        "categories": [
          "market"
        ],
        "kind": "market",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.55,
          13.7999
        ]
      }
    },
    {
      "type": "Feature",
      "id": "ari_bts",
      "properties": {
        "name": "Ari BTS",
        "shortName": "Ari BTS",
        "zoneId": "ari",
        "zoneLabel": "Ari / Chatuchak",
        "type": "REAL",
        "coordStatus": "REPRESENTATIVE",
        "categories": [
          "transit",
          "cafe"
        ],
        "kind": "transit",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.5446,
          13.7797
        ]
      }
    },
    {
      "type": "Feature",
      "id": "ari_no_sign_cafe",
      "properties": {
        "name": "Minimalist Cafe With No Sign",
        "shortName": "Minimalist Cafe With No Sign",
        "zoneId": "ari",
        "zoneLabel": "Ari / Chatuchak",
        "type": "FICTIONAL",
        "coordStatus": "ART_DIRECTED",
        "categories": [
          "cafe"
        ],
        "kind": "cafe",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "You walked past it twice.",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.5478,
          13.7819
        ]
      }
    },
    {
      "type": "Feature",
      "id": "ari_rare_plant",
      "properties": {
        "name": "Rare Plant Emergency",
        "shortName": "Rare Plant Emergency",
        "zoneId": "ari",
        "zoneLabel": "Ari / Chatuchak",
        "type": "FICTIONAL",
        "coordStatus": "ART_DIRECTED",
        "categories": [
          "plant_shop"
        ],
        "kind": "plant_shop",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "Do not bend the monstera.",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.548,
          13.7964
        ]
      }
    },
    {
      "type": "Feature",
      "id": "ari_group_project",
      "properties": {
        "name": "Group Project Cafe",
        "shortName": "Group Project Cafe",
        "zoneId": "ari",
        "zoneLabel": "Ari / Chatuchak",
        "type": "FICTIONAL",
        "coordStatus": "ART_DIRECTED",
        "categories": [
          "cafe",
          "student"
        ],
        "kind": "cafe",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "Only one person did the slides.",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.543,
          13.7838
        ]
      }
    },
    {
      "type": "Feature",
      "id": "river_river_city",
      "properties": {
        "name": "River City Bangkok",
        "shortName": "River City Bangkok",
        "zoneId": "river",
        "zoneLabel": "Charoen Krung / Riverside",
        "type": "REAL",
        "coordStatus": "REPRESENTATIVE",
        "categories": [
          "arts",
          "riverside"
        ],
        "kind": "arts",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.5131,
          13.7294
        ]
      }
    },
    {
      "type": "Feature",
      "id": "river_bangkok_island",
      "properties": {
        "name": "Bangkok Island",
        "shortName": "Bangkok Island",
        "zoneId": "river",
        "zoneLabel": "Charoen Krung / Riverside",
        "type": "REAL",
        "coordStatus": "REPRESENTATIVE",
        "categories": [
          "music",
          "boat",
          "nightlife"
        ],
        "kind": "music",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "",
        "eventTags": [],
        "researchNote": "Treat as nightlife/boat venue. Do not attach specific Solana history unless separately verified."
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.5135,
          13.7187
        ]
      }
    },
    {
      "type": "Feature",
      "id": "river_warehouse30",
      "properties": {
        "name": "Warehouse 30",
        "shortName": "Warehouse 30",
        "zoneId": "river",
        "zoneLabel": "Charoen Krung / Riverside",
        "type": "REAL",
        "coordStatus": "REPRESENTATIVE",
        "categories": [
          "arts",
          "creative"
        ],
        "kind": "arts",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.5157,
          13.7271
        ]
      }
    },
    {
      "type": "Feature",
      "id": "river_warehouse_rave",
      "properties": {
        "name": "River Warehouse Rave",
        "shortName": "River Warehouse Rave",
        "zoneId": "river",
        "zoneLabel": "Charoen Krung / Riverside",
        "type": "FICTIONAL",
        "coordStatus": "ART_DIRECTED",
        "categories": [
          "music",
          "arts"
        ],
        "kind": "music",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "The event ends when the police ask nicely.",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.5167,
          13.7235
        ]
      }
    },
    {
      "type": "Feature",
      "id": "river_wrong_pier",
      "properties": {
        "name": "Photographer's Wrong Pier",
        "shortName": "Photographer's Wrong Pier",
        "zoneId": "river",
        "zoneLabel": "Charoen Krung / Riverside",
        "type": "FICTIONAL",
        "coordStatus": "ART_DIRECTED",
        "categories": [
          "photo_spot",
          "riverside"
        ],
        "kind": "photo_spot",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "The light is better at the other pier.",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.511,
          13.7204
        ]
      }
    },
    {
      "type": "Feature",
      "id": "pk_true_digital_park",
      "properties": {
        "name": "True Digital Park",
        "shortName": "True Digital Park",
        "zoneId": "phra_khanong",
        "zoneLabel": "Phra Khanong / Punnawithi",
        "type": "CRYPTO_REAL",
        "coordStatus": "VERIFIED",
        "categories": [
          "tech",
          "startup",
          "event"
        ],
        "kind": "tech",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "",
        "eventTags": [
          "solana",
          "builders",
          "technical_workshop"
        ],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.61131,
          13.68558
        ]
      }
    },
    {
      "type": "Feature",
      "id": "pk_phra_khanong_bts",
      "properties": {
        "name": "Phra Khanong BTS",
        "shortName": "Phra Khanong BTS",
        "zoneId": "phra_khanong",
        "zoneLabel": "Phra Khanong / Punnawithi",
        "type": "REAL",
        "coordStatus": "REPRESENTATIVE",
        "categories": [
          "transit"
        ],
        "kind": "transit",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.5912,
          13.7152
        ]
      }
    },
    {
      "type": "Feature",
      "id": "pk_w_district",
      "properties": {
        "name": "W District",
        "shortName": "W District",
        "zoneId": "phra_khanong",
        "zoneLabel": "Phra Khanong / Punnawithi",
        "type": "REAL",
        "coordStatus": "REPRESENTATIVE",
        "categories": [
          "food",
          "nightlife"
        ],
        "kind": "food",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.5934,
          13.7143
        ]
      }
    },
    {
      "type": "Feature",
      "id": "pk_rider_canteen",
      "properties": {
        "name": "Delivery Rider Canteen",
        "shortName": "Delivery Rider Canteen",
        "zoneId": "phra_khanong",
        "zoneLabel": "Phra Khanong / Punnawithi",
        "type": "FICTIONAL",
        "coordStatus": "ART_DIRECTED",
        "categories": [
          "food",
          "neighborhood"
        ],
        "kind": "food",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "Everyone here knows a faster route than you.",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.5982,
          13.7091
        ]
      }
    },
    {
      "type": "Feature",
      "id": "pk_deployment_store",
      "properties": {
        "name": "Deployment Convenience Store",
        "shortName": "Deployment Convenience Store",
        "zoneId": "phra_khanong",
        "zoneLabel": "Phra Khanong / Punnawithi",
        "type": "FICTIONAL",
        "coordStatus": "ART_DIRECTED",
        "categories": [
          "convenience_store",
          "builder"
        ],
        "kind": "convenience_store",
        "startingLocation": false,
        "farePickup": true,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "common",
        "flavorLine": "Energy drink. Charger. One more deploy.",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.6054,
          13.6946
        ]
      }
    },
    {
      "type": "Feature",
      "id": "special_bkk_airport",
      "properties": {
        "name": "Suvarnabhumi Airport",
        "shortName": "Suvarnabhumi Airport",
        "zoneId": null,
        "zoneLabel": "Greater Bangkok",
        "type": "SPECIAL",
        "coordStatus": "REPRESENTATIVE",
        "categories": [
          "airport"
        ],
        "kind": "airport",
        "startingLocation": false,
        "farePickup": false,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "rare",
        "flavorLine": "",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.7501,
          13.69
        ]
      }
    },
    {
      "type": "Feature",
      "id": "special_dmk_airport",
      "properties": {
        "name": "Don Mueang Airport",
        "shortName": "Don Mueang Airport",
        "zoneId": null,
        "zoneLabel": "Greater Bangkok",
        "type": "SPECIAL",
        "coordStatus": "REPRESENTATIVE",
        "categories": [
          "airport"
        ],
        "kind": "airport",
        "startingLocation": false,
        "farePickup": false,
        "fareDestination": true,
        "spawnEligible": true,
        "rarity": "rare",
        "flavorLine": "",
        "eventTags": [],
        "researchNote": ""
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          100.6067,
          13.9126
        ]
      }
    },
    ...OUTER_LOCATIONS
  ]
};

const locationsById = new Map(LOCATIONS.features.map(location => [location.id, location]));
const LEGACY_LOCATION_ALIASES = {
  'khao-san': 'old_khao_san', 'yaowarat': 'yao_yaowarat_road', 'siam': 'siam_mbk',
  'silom': 'sil_sala_daeng', 'lumpini': 'sil_lumpini', 'chatuchak': 'ari_chatuchak',
  'sathorn': 'sil_sala_daeng', 'asok': 'asok_station', 'thonglor': 'thong_bad_decisions',
  'ari': 'ari_no_sign_cafe', 'old-city': 'old_khao_san', 'suvarnabhumi': 'special_bkk_airport'
};

export const PICKUP_LOCATIONS = LOCATIONS.features.filter(location => location.properties.farePickup);
export const DESTINATION_LOCATIONS = LOCATIONS.features.filter(location => location.properties.fareDestination);
export const SPAWN_LOCATIONS = LOCATIONS.features.filter(location => location.properties.spawnEligible);
export const CRYPTO_LOCATIONS = LOCATIONS.features.filter(location => location.properties.type === 'CRYPTO_REAL');

export function getLocationById(id) {
  return locationsById.get(id) || locationsById.get(LEGACY_LOCATION_ALIASES[id]) || null;
}

export function getStartingLocation() { return getLocationById('old_khao_san'); }

export function getLocationsByType(type) {
  return LOCATIONS.features.filter(location => location.properties.kind === type || location.properties.categories.includes(type)).map(location => ({ id: location.id, ...location.properties, coordinates: location.geometry.coordinates }));
}

export function getLocationsByZone(zoneId) { return LOCATIONS.features.filter(location => location.properties.zoneId === zoneId); }
export function getLocationsByCategory(category) { return LOCATIONS.features.filter(location => location.properties.categories.includes(category)); }

export function getRandomLocation(excludeId = null, pool = DESTINATION_LOCATIONS) {
  const available = pool.filter(location => location.id !== excludeId);
  const location = available[Math.floor(Math.random() * available.length)];
  return location ? { id: location.id, ...location.properties, coordinates: location.geometry.coordinates } : null;
}

export function getRandomPickupLocation(excludeId = null) { return getRandomLocation(excludeId, PICKUP_LOCATIONS); }
export function getRandomDestinationLocation(excludeId = null) { return getRandomLocation(excludeId, DESTINATION_LOCATIONS); }
