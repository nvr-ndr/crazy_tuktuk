// Outer Bangkok location pack sourced from CRAZY_TUK_WORLD_EXPANSION.md.

export const OUTER_ZONE_ANCHORS = [
  { id: 'bang_phlat', label: 'Bang Phlat / ChangChui', coordinates: [100.4748, 13.7868] },
  { id: 'talat_phlu', label: 'Talat Phlu / Thonburi', coordinates: [100.4819, 13.7214] },
  { id: 'bang_wa', label: 'Bang Wa / Phasi Charoen', coordinates: [100.4592, 13.718] },
  { id: 'bang_krachao', label: 'Bang Krachao', coordinates: [100.568, 13.696] },
  { id: 'bang_kho_laem', label: 'Bang Kho Laem / Rama III', coordinates: [100.5102, 13.6947] },
  { id: 'bang_na', label: 'Bang Na / Udom Suk', coordinates: [100.612, 13.6768] },
  { id: 'huai_khwang', label: 'Huai Khwang / Din Daeng', coordinates: [100.5808, 13.7808] },
  { id: 'lat_phrao', label: 'Lat Phrao', coordinates: [100.568, 13.8168] },
  { id: 'bang_kapi', label: 'Ramkhamhaeng / Bang Kapi', coordinates: [100.6265, 13.7587] },
];

const makeLocation = ({
  id,
  name,
  shortName,
  zoneId,
  zoneLabel,
  type,
  coordStatus,
  categories,
  coordinates,
  flavorLine = '',
}) => ({
  type: 'Feature',
  id,
  properties: {
    name,
    shortName,
    zoneId,
    zoneLabel,
    type,
    coordStatus,
    categories,
    kind: categories[0] || 'place',
    startingLocation: false,
    farePickup: true,
    fareDestination: true,
    spawnEligible: true,
    rarity: 'common',
    flavorLine,
    eventTags: [],
    researchNote: '',
  },
  geometry: { type: 'Point', coordinates },
});

export const OUTER_LOCATIONS = [
  makeLocation({ id: 'bp_changchui', name: 'ChangChui Creative Park', shortName: 'ChangChui', zoneId: 'bang_phlat', zoneLabel: 'Bang Phlat / ChangChui', type: 'REAL', coordStatus: 'VERIFIED', categories: ['arts', 'market', 'nightlife'], coordinates: [100.47058, 13.78953] }),
  makeLocation({ id: 'bp_airplane_afterparty', name: 'Airplane Afterparty', shortName: 'Airplane Afterparty', zoneId: 'bang_phlat', zoneLabel: 'Bang Phlat / ChangChui', type: 'FICTIONAL', coordStatus: 'ART_DIRECTED', categories: ['nightlife', 'music'], coordinates: [100.4742, 13.79215], flavorLine: 'The plane is not going anywhere. You are.' }),
  makeLocation({ id: 'bp_wrong_side_studio', name: 'Wrong Side of the River Studio', shortName: 'Wrong Side Studio', zoneId: 'bang_phlat', zoneLabel: 'Bang Phlat / ChangChui', type: 'FICTIONAL', coordStatus: 'ART_DIRECTED', categories: ['arts', 'studio'], coordinates: [100.46892, 13.78372], flavorLine: 'Your passenger swears this is the shortcut.' }),
  makeLocation({ id: 'bp_vintage_speaker', name: "Uncle's Vintage Speaker Warehouse", shortName: 'Vintage Speaker Warehouse', zoneId: 'bang_phlat', zoneLabel: 'Bang Phlat / ChangChui', type: 'FICTIONAL', coordStatus: 'ART_DIRECTED', categories: ['retail', 'music', 'warehouse'], coordinates: [100.47871, 13.79434], flavorLine: 'Cash only. The speakers are enormous.' }),

  makeLocation({ id: 'tp_talat_phlu_market', name: 'Talat Phlu Market', shortName: 'Talat Phlu', zoneId: 'talat_phlu', zoneLabel: 'Talat Phlu / Thonburi', type: 'REAL', coordStatus: 'VERIFIED', categories: ['market', 'food'], coordinates: [100.47702, 13.72139] }),
  makeLocation({ id: 'tp_railway', name: 'Talat Phlu Railway Stop', shortName: 'Talat Phlu Railway', zoneId: 'talat_phlu', zoneLabel: 'Talat Phlu / Thonburi', type: 'REAL', coordStatus: 'REPRESENTATIVE', categories: ['transit', 'neighborhood'], coordinates: [100.47806, 13.72039] }),
  makeLocation({ id: 'tp_five_bowls', name: 'Five Bowls Before Noon', shortName: 'Five Bowls', zoneId: 'talat_phlu', zoneLabel: 'Talat Phlu / Thonburi', type: 'FICTIONAL', coordStatus: 'ART_DIRECTED', categories: ['food'], coordinates: [100.47424, 13.72456], flavorLine: 'The sixth bowl is where people make mistakes.' }),
  makeLocation({ id: 'tp_freezer_repair', name: "Auntie's Freezer Repair", shortName: 'Freezer Repair', zoneId: 'talat_phlu', zoneLabel: 'Talat Phlu / Thonburi', type: 'FICTIONAL', coordStatus: 'ART_DIRECTED', categories: ['repair', 'neighborhood'], coordinates: [100.48136, 13.7182], flavorLine: 'If the ice cream melts, this becomes urgent.' }),

  makeLocation({ id: 'bw_bang_wa', name: 'Bang Wa BTS / MRT', shortName: 'Bang Wa', zoneId: 'bang_wa', zoneLabel: 'Bang Wa / Phasi Charoen', type: 'REAL', coordStatus: 'VERIFIED', categories: ['transit'], coordinates: [100.45972, 13.7225] }),
  makeLocation({ id: 'bw_canal_pier', name: 'Canal Shortcut Pier', shortName: 'Canal Shortcut Pier', zoneId: 'bang_wa', zoneLabel: 'Bang Wa / Phasi Charoen', type: 'FICTIONAL', coordStatus: 'ART_DIRECTED', categories: ['riverside', 'transit'], coordinates: [100.4633, 13.71492], flavorLine: 'The boat left thirty seconds ago.' }),
  makeLocation({ id: 'bw_wedding_envelope', name: 'Wedding Envelope Emergency', shortName: 'Wedding Envelope', zoneId: 'bang_wa', zoneLabel: 'Bang Wa / Phasi Charoen', type: 'FICTIONAL', coordStatus: 'ART_DIRECTED', categories: ['wedding', 'retail'], coordinates: [100.45252, 13.71906], flavorLine: 'Cash. Envelope. Ceremony already started.' }),
  makeLocation({ id: 'bw_last_printer', name: 'Last Printer Before the Ring Road', shortName: 'Last Printer', zoneId: 'bang_wa', zoneLabel: 'Bang Wa / Phasi Charoen', type: 'FICTIONAL', coordStatus: 'ART_DIRECTED', categories: ['print', 'office'], coordinates: [100.45701, 13.71061], flavorLine: 'The PDF is still loading.' }),

  makeLocation({ id: 'bk_green_lung_park', name: 'Sri Nakhon Khuean Khan Park', shortName: 'Green Lung Park', zoneId: 'bang_krachao', zoneLabel: 'Bang Krachao', type: 'REAL', coordStatus: 'VERIFIED', categories: ['park', 'cycling'], coordinates: [100.5667, 13.69681] }),
  makeLocation({ id: 'bk_bike_auntie', name: 'Bicycle Rental Auntie', shortName: 'Bicycle Rental Auntie', zoneId: 'bang_krachao', zoneLabel: 'Bang Krachao', type: 'FICTIONAL', coordStatus: 'ART_DIRECTED', categories: ['cycling', 'neighborhood'], coordinates: [100.56072, 13.69963], flavorLine: 'She thinks the tuk-tuk is unnecessary.' }),
  makeLocation({ id: 'bk_secret_jungle_cafe', name: 'Secret Jungle Cafe', shortName: 'Jungle Cafe', zoneId: 'bang_krachao', zoneLabel: 'Bang Krachao', type: 'FICTIONAL', coordStatus: 'ART_DIRECTED', categories: ['cafe', 'park'], coordinates: [100.57312, 13.69197], flavorLine: 'There are three signs. All point different ways.' }),
  makeLocation({ id: 'bk_monitor_crossing', name: 'Monitor Lizard Crossing', shortName: 'Monitor Lizard Crossing', zoneId: 'bang_krachao', zoneLabel: 'Bang Krachao', type: 'FICTIONAL', coordStatus: 'ART_DIRECTED', categories: ['park', 'mystery'], coordinates: [100.57084, 13.70214], flavorLine: 'The lizard has right of way.' }),

  makeLocation({ id: 'bkl_asiatique', name: 'Asiatique The Riverfront', shortName: 'Asiatique', zoneId: 'bang_kho_laem', zoneLabel: 'Bang Kho Laem / Rama III', type: 'REAL', coordStatus: 'VERIFIED', categories: ['market', 'nightlife', 'tourism'], coordinates: [100.50277, 13.70419] }),
  makeLocation({ id: 'bkl_breakup_wheel', name: 'Ferris Wheel Breakup Point', shortName: 'Ferris Wheel', zoneId: 'bang_kho_laem', zoneLabel: 'Bang Kho Laem / Rama III', type: 'FICTIONAL', coordStatus: 'ART_DIRECTED', categories: ['nightlife', 'tourism'], coordinates: [100.50542, 13.70203], flavorLine: 'One passenger. Two return tickets.' }),
  makeLocation({ id: 'bkl_furniture_kingdom', name: 'Rama III Furniture Kingdom', shortName: 'Furniture Kingdom', zoneId: 'bang_kho_laem', zoneLabel: 'Bang Kho Laem / Rama III', type: 'FICTIONAL', coordStatus: 'ART_DIRECTED', categories: ['retail', 'warehouse'], coordinates: [100.51768, 13.68677], flavorLine: 'No, the sofa will not fit.' }),
  makeLocation({ id: 'bkl_wedding_hotel', name: 'Riverside Wedding Hotel', shortName: 'Riverside Wedding', zoneId: 'bang_kho_laem', zoneLabel: 'Bang Kho Laem / Rama III', type: 'FICTIONAL', coordStatus: 'ART_DIRECTED', categories: ['hotel', 'wedding'], coordinates: [100.49883, 13.69712], flavorLine: 'They are taking the group photo now.' }),

  makeLocation({ id: 'bn_bitec', name: 'BITEC Bang Na', shortName: 'BITEC', zoneId: 'bang_na', zoneLabel: 'Bang Na / Udom Suk', type: 'REAL', coordStatus: 'VERIFIED', categories: ['convention', 'event'], coordinates: [100.60854, 13.66973] }),
  makeLocation({ id: 'bn_udom_suk', name: 'Udom Suk BTS', shortName: 'Udom Suk', zoneId: 'bang_na', zoneLabel: 'Bang Na / Udom Suk', type: 'REAL', coordStatus: 'REPRESENTATIVE', categories: ['transit'], coordinates: [100.60944, 13.67917] }),
  makeLocation({ id: 'bn_badge_printer', name: 'Convention Badge Printer', shortName: 'Badge Printer', zoneId: 'bang_na', zoneLabel: 'Bang Na / Udom Suk', type: 'FICTIONAL', coordStatus: 'ART_DIRECTED', categories: ['event', 'print'], coordinates: [100.61472, 13.67345], flavorLine: 'Your name is spelled wrong.' }),
  makeLocation({ id: 'bn_mega_furniture', name: 'Mega Furniture Pickup', shortName: 'Furniture Pickup', zoneId: 'bang_na', zoneLabel: 'Bang Na / Udom Suk', type: 'FICTIONAL', coordStatus: 'ART_DIRECTED', categories: ['retail', 'logistics'], coordinates: [100.62085, 13.66372], flavorLine: 'Passenger included one small chair. It is not small.' }),

  makeLocation({ id: 'hk_huai_khwang_mrt', name: 'Huai Khwang MRT', shortName: 'Huai Khwang', zoneId: 'huai_khwang', zoneLabel: 'Huai Khwang / Din Daeng', type: 'REAL', coordStatus: 'VERIFIED', categories: ['transit'], coordinates: [100.57357, 13.77869] }),
  makeLocation({ id: 'hk_hotpot_tower', name: 'Midnight Hotpot Tower', shortName: 'Midnight Hotpot', zoneId: 'huai_khwang', zoneLabel: 'Huai Khwang / Din Daeng', type: 'FICTIONAL', coordStatus: 'ART_DIRECTED', categories: ['food', 'nightlife'], coordinates: [100.58061, 13.78294], flavorLine: 'Table booked for 1:30 AM.' }),
  makeLocation({ id: 'hk_karaoke_17', name: 'Karaoke Floor 17', shortName: 'Karaoke Floor 17', zoneId: 'huai_khwang', zoneLabel: 'Huai Khwang / Din Daeng', type: 'FICTIONAL', coordStatus: 'ART_DIRECTED', categories: ['nightlife'], coordinates: [100.58431, 13.77658], flavorLine: 'Nobody remembers booking Floor 17.' }),
  makeLocation({ id: 'hk_durian_delivery', name: 'Emergency Durian Delivery', shortName: 'Durian Emergency', zoneId: 'huai_khwang', zoneLabel: 'Huai Khwang / Din Daeng', type: 'FICTIONAL', coordStatus: 'ART_DIRECTED', categories: ['food', 'delivery'], coordinates: [100.57591, 13.78602], flavorLine: 'Windows down.' }),

  makeLocation({ id: 'lp_union_mall', name: 'Union Mall', shortName: 'Union Mall', zoneId: 'lat_phrao', zoneLabel: 'Lat Phrao', type: 'REAL', coordStatus: 'VERIFIED', categories: ['mall', 'shopping'], coordinates: [100.56191, 13.81357] }),
  makeLocation({ id: 'lp_ha_yaek', name: 'Ha Yaek Lat Phrao', shortName: 'Lat Phrao', zoneId: 'lat_phrao', zoneLabel: 'Lat Phrao', type: 'REAL', coordStatus: 'REPRESENTATIVE', categories: ['transit'], coordinates: [100.56142, 13.81645] }),
  makeLocation({ id: 'lp_condo_lobby_b', name: 'Condo Lobby B', shortName: 'Lobby B', zoneId: 'lat_phrao', zoneLabel: 'Lat Phrao', type: 'FICTIONAL', coordStatus: 'ART_DIRECTED', categories: ['condo', 'residential'], coordinates: [100.57084, 13.82172], flavorLine: 'There are six Lobby Bs.' }),
  makeLocation({ id: 'lp_pet_cafe', name: 'Pet Cafe Incident', shortName: 'Pet Cafe', zoneId: 'lat_phrao', zoneLabel: 'Lat Phrao', type: 'FICTIONAL', coordStatus: 'ART_DIRECTED', categories: ['cafe', 'mystery'], coordinates: [100.57393, 13.81021], flavorLine: "The passenger is carrying someone else's cat." }),

  makeLocation({ id: 'bkp_rajamangala', name: 'Rajamangala National Stadium', shortName: 'Rajamangala', zoneId: 'bang_kapi', zoneLabel: 'Ramkhamhaeng / Bang Kapi', type: 'REAL', coordStatus: 'VERIFIED', categories: ['stadium', 'event'], coordinates: [100.62213, 13.75541] }),
  makeLocation({ id: 'bkp_hua_mak_bus', name: 'Hua Mak Night Bus', shortName: 'Hua Mak Night Bus', zoneId: 'bang_kapi', zoneLabel: 'Ramkhamhaeng / Bang Kapi', type: 'FICTIONAL', coordStatus: 'ART_DIRECTED', categories: ['transit'], coordinates: [100.63217, 13.74948], flavorLine: 'Nobody is sure where the bus stops.' }),
  makeLocation({ id: 'bkp_wrong_gate', name: 'Stadium Gate Nobody Uses', shortName: 'Wrong Stadium Gate', zoneId: 'bang_kapi', zoneLabel: 'Ramkhamhaeng / Bang Kapi', type: 'FICTIONAL', coordStatus: 'ART_DIRECTED', categories: ['stadium', 'event'], coordinates: [100.62691, 13.75983], flavorLine: 'Your ticket says Gate E. There is no Gate E.' }),
  makeLocation({ id: 'bkp_exam_panic', name: 'Ramkhamhaeng Exam Panic', shortName: 'Exam Panic', zoneId: 'bang_kapi', zoneLabel: 'Ramkhamhaeng / Bang Kapi', type: 'FICTIONAL', coordStatus: 'ART_DIRECTED', categories: ['university', 'student'], coordinates: [100.61705, 13.76355], flavorLine: 'Attendance closes in seven minutes.' }),
];
