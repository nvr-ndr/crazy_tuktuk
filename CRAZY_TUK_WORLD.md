# Crazy Tuk — Final World / Map Location Spec

## 0. Decision Summary

This pass locks the playable Bangkok geography for the MVP and fixes the current map problem where fictional destinations spawn directly on top of a zone label.

Crazy Tuk uses **10 playable zones + 2 special airport destinations**.

Each zone has:
- one **zone label / anchor** used only for the map-area name,
- several **locations** with their own coordinates,
- real, fictional, and crypto-community destinations mixed together.

**Important:** a zone anchor is never itself a passenger destination.

Locations are **not persistently rendered or labeled on the map**. They exist as world data and become visible only when gameplay references them — most commonly as the **location label beneath an NPC fare icon**, or later in active-trip UI after pickup.

For fictional locations, coordinates are intentionally **art-directed map positions**: plausible points on streets inside the correct neighborhood, not claims that a real business exists there.

---

# 1. Final Zone List

```text
01 old_town       Old Town / Khao San
02 yaowarat       Yaowarat / Chinatown
03 siam           Siam / Chidlom
04 silom          Silom / Sathorn / Lumpini
05 asok           Asok / Phrom Phong
06 thonglor       Thonglor / Ekkamai
07 ratchada       Ratchada / Phetchaburi
08 ari            Ari / Chatuchak
09 river          Charoen Krung / Riverside
10 phra_khanong   Phra Khanong / Punnawithi
```

Special destinations outside the normal zone system:

```text
airport_bkk       Suvarnabhumi Airport
airport_dmk       Don Mueang Airport
```

This is preferable to treating airports as a normal zone because they should remain rare, high-risk destination reveals.

---

# 2. Zone Anchor Rule

Zone anchors exist only for text placement / neighborhood identity.

They should render at lower visual priority than location markers.

```text
base map geography
  ↓
Crazy Tuk zone label
  ↓
NPC fare icon
  ↓
location name directly beneath that fare icon
```

There is **no permanent Crazy Tuk location-marker layer**.

A zone label should never share the exact coordinate of a location marker.

Recommended zone-label behavior:
- no icon,
- muted text,
- non-clickable,
- visible only at appropriate zoom,
- never repeated as a destination label.

---

# 3. Coordinate Status

Each map point uses one of:

```text
VERIFIED
REPRESENTATIVE
ART_DIRECTED
```

**VERIFIED**
A real venue coordinate/address was checked against a public source.

**REPRESENTATIVE**
A real landmark uses a practical representative point suitable for the game map. It does not need doorway-level navigation accuracy.

**ART_DIRECTED**
A fictional location is deliberately placed at a plausible point inside its neighborhood. This coordinate is part of Crazy Tuk's authored world.

---

# 4. Zone Anchors

| Zone | Anchor Latitude | Anchor Longitude |
|---|---:|---:|
| Old Town / Khao San | 13.7568 | 100.4977 |
| Yaowarat / Chinatown | 13.7404 | 100.5094 |
| Siam / Chidlom | 13.7460 | 100.5361 |
| Silom / Sathorn / Lumpini | 13.7278 | 100.5350 |
| Asok / Phrom Phong | 13.7338 | 100.5637 |
| Thonglor / Ekkamai | 13.7249 | 100.5821 |
| Ratchada / Phetchaburi | 13.7527 | 100.5746 |
| Ari / Chatuchak | 13.7885 | 100.5477 |
| Charoen Krung / Riverside | 13.7240 | 100.5145 |
| Phra Khanong / Punnawithi | 13.7003 | 100.6012 |

---

# 5. Final Location List

## ZONE 01 — OLD TOWN / KHAO SAN

### 01. Khao San Road
```text
id: old_khao_san
type: REAL
category: nightlife / tourism
lat: 13.7589
lng: 100.4971
coordStatus: REPRESENTATIVE
pickupEligible: true
destinationEligible: true
spawnEligible: true
```

### 02. Grand Palace
```text
id: old_grand_palace
type: REAL
category: landmark / tourism
lat: 13.7500
lng: 100.4913
coordStatus: REPRESENTATIVE
pickupEligible: false
destinationEligible: true
spawnEligible: true
```

### 03. Lost Backpack Hostel
```text
id: old_lost_backpack
type: FICTIONAL
category: hostel
lat: 13.7607
lng: 100.4993
coordStatus: ART_DIRECTED
pickupEligible: true
destinationEligible: true
spawnEligible: true
flavorLine: "The backpack is not coming back."
```

### 04. Scorpion & Smoothie Cart
```text
id: old_scorpion_smoothie
type: FICTIONAL
category: street_food
lat: 13.7572
lng: 100.5006
coordStatus: ART_DIRECTED
pickupEligible: true
destinationEligible: true
spawnEligible: true
flavorLine: "Protein is protein."
```

### 05. Quiet Temple Side Gate
```text
id: old_temple_gate
type: FICTIONAL
category: temple / neighborhood
lat: 13.7543
lng: 100.4954
coordStatus: ART_DIRECTED
pickupEligible: true
destinationEligible: true
spawnEligible: true
flavorLine: "Please do not block the gate."
```

---

## ZONE 02 — YAOWARAT / CHINATOWN

### 06. Yaowarat Road
```text
id: yao_yaowarat_road
type: REAL
category: street / food / nightlife
lat: 13.7398
lng: 100.5095
coordStatus: REPRESENTATIVE
pickupEligible: true
destinationEligible: true
spawnEligible: true
```

### 07. Wat Mangkon
```text
id: yao_wat_mangkon
type: REAL
category: temple / landmark
lat: 13.7421
lng: 100.5092
coordStatus: REPRESENTATIVE
pickupEligible: true
destinationEligible: true
spawnEligible: true
```

### 08. Midnight Noodle Shop
```text
id: yao_midnight_noodles
type: FICTIONAL
category: food
lat: 13.7383
lng: 100.5118
coordStatus: ART_DIRECTED
pickupEligible: true
destinationEligible: true
spawnEligible: true
flavorLine: "Closed once in 2017."
```

### 09. Definitely Legal Mahjong Club
```text
id: yao_mahjong
type: FICTIONAL
category: nightlife / mystery
lat: 13.7416
lng: 100.5065
coordStatus: ART_DIRECTED
pickupEligible: true
destinationEligible: true
spawnEligible: true
flavorLine: "You didn't hear about it from us."
```

### 10. Lucky Lucky Gold & Phone Repair
```text
id: yao_lucky_gold_phone
type: FICTIONAL
category: retail
lat: 13.7369
lng: 100.5141
coordStatus: ART_DIRECTED
pickupEligible: true
destinationEligible: true
spawnEligible: true
flavorLine: "Cash, gold, batteries, chargers. Probably."
```

---

## ZONE 03 — SIAM / CHIDLOM

### 11. MBK Center
```text
id: siam_mbk
type: REAL
category: mall / retail
lat: 13.7446
lng: 100.5296
coordStatus: REPRESENTATIVE
pickupEligible: true
destinationEligible: true
spawnEligible: true
```

### 12. Siam Square
```text
id: siam_square
type: REAL
category: shopping / youth
lat: 13.7441
lng: 100.5347
coordStatus: REPRESENTATIVE
pickupEligible: true
destinationEligible: true
spawnEligible: true
```

### 13. Bangkok Art & Culture Centre
```text
id: siam_bacc
type: REAL
category: arts
lat: 13.7465
lng: 100.5300
coordStatus: REPRESENTATIVE
pickupEligible: true
destinationEligible: true
spawnEligible: true
```

### 14. 240 Baht Bubble Tea
```text
id: siam_bubble_tea
type: FICTIONAL
category: cafe
lat: 13.7463
lng: 100.5368
coordStatus: ART_DIRECTED
pickupEligible: true
destinationEligible: true
spawnEligible: true
flavorLine: "The pearls cost extra."
```

### 15. Phone Repair Guy
```text
id: siam_phone_repair
type: FICTIONAL
category: electronics
lat: 13.7431
lng: 100.5320
coordStatus: ART_DIRECTED
pickupEligible: true
destinationEligible: true
spawnEligible: true
flavorLine: "Come back in twenty minutes."
```

---

## ZONE 04 — SILOM / SATHORN / LUMPINI

### 16. Lumpini Park
```text
id: sil_lumpini
type: REAL
category: park
lat: 13.7310
lng: 100.5418
coordStatus: REPRESENTATIVE
pickupEligible: true
destinationEligible: true
spawnEligible: true
```

### 17. Sala Daeng / Silom
```text
id: sil_sala_daeng
type: REAL
category: transit / nightlife
lat: 13.7286
lng: 100.5341
coordStatus: REPRESENTATIVE
pickupEligible: true
destinationEligible: true
spawnEligible: true
```

### 18. Face Factory Clinic
```text
id: sil_face_factory
type: FICTIONAL
category: beauty / clinic
lat: 13.7248
lng: 100.5331
coordStatus: ART_DIRECTED
pickupEligible: true
destinationEligible: true
spawnEligible: true
flavorLine: "Do not ask about the bandages."
```

### 19. Crypto Coworking Dungeon
```text
id: sil_crypto_dungeon
type: FICTIONAL
category: coworking / crypto
lat: 13.7262
lng: 100.5296
coordStatus: ART_DIRECTED
pickupEligible: true
destinationEligible: true
spawnEligible: true
flavorLine: "It worked locally."
```

### 20. Lunch Auntie
```text
id: sil_lunch_auntie
type: FICTIONAL
category: food
lat: 13.7297
lng: 100.5278
coordStatus: ART_DIRECTED
pickupEligible: true
destinationEligible: true
spawnEligible: true
flavorLine: "You look thin. Eat."
```

---

## ZONE 05 — ASOK / PHROM PHONG

### 21. Terminal 21
```text
id: asok_terminal21
type: REAL
category: mall
lat: 13.7378
lng: 100.5602
coordStatus: REPRESENTATIVE
pickupEligible: true
destinationEligible: true
spawnEligible: true
```

### 22. Asok BTS / Sukhumvit MRT
```text
id: asok_station
type: REAL
category: transit
lat: 13.7370
lng: 100.5604
coordStatus: REPRESENTATIVE
pickupEligible: true
destinationEligible: true
spawnEligible: true
```

### 23. Benjakitti Park
```text
id: asok_benjakitti
type: REAL
category: park
lat: 13.7304
lng: 100.5585
coordStatus: REPRESENTATIVE
pickupEligible: true
destinationEligible: true
spawnEligible: true
```

### 24. Visa Run Travel Agency
```text
id: asok_visa_run
type: FICTIONAL
category: travel
lat: 13.7391
lng: 100.5633
coordStatus: ART_DIRECTED
pickupEligible: true
destinationEligible: true
spawnEligible: true
flavorLine: "Passport?"
```

### 25. Omakase You Can't Afford
```text
id: asok_omakase
type: FICTIONAL
category: restaurant
lat: 13.7327
lng: 100.5679
coordStatus: ART_DIRECTED
pickupEligible: true
destinationEligible: true
spawnEligible: true
flavorLine: "If you have to ask..."
```

---

## ZONE 06 — THONGLOR / EKKAMAI

### 26. Based Studio
```text
id: thong_based_studio
type: CRYPTO_REAL
category: studio / coworking / event
lat: 13.7249752
lng: 100.5799154
coordStatus: VERIFIED
pickupEligible: true
destinationEligible: true
spawnEligible: true
eventTags:
  - solana
  - superteam
  - dflow
```

### 27. Thong Lor BTS
```text
id: thong_thonglor_bts
type: REAL
category: transit / nightlife
lat: 13.7241
lng: 100.5784
coordStatus: REPRESENTATIVE
pickupEligible: true
destinationEligible: true
spawnEligible: true
```

### 28. Ekkamai BTS
```text
id: thong_ekkamai_bts
type: REAL
category: transit
lat: 13.7194
lng: 100.5850
coordStatus: REPRESENTATIVE
pickupEligible: true
destinationEligible: true
spawnEligible: true
```

### 29. Bad Decisions Cocktail Club
```text
id: thong_bad_decisions
type: FICTIONAL
category: nightlife
lat: 13.7282
lng: 100.5818
coordStatus: ART_DIRECTED
pickupEligible: true
destinationEligible: true
spawnEligible: true
flavorLine: "Nobody leaves after one."
```

### 30. Basement 404
```text
id: thong_basement404
type: FICTIONAL
category: club / music
lat: 13.7218
lng: 100.5880
coordStatus: ART_DIRECTED
pickupEligible: true
destinationEligible: true
spawnEligible: true
flavorLine: "No signal. Great sound system."
```

---

## ZONE 07 — RATCHADA / PHETCHABURI

### 31. Bel Club 22
```text
id: rat_bel_club_22
type: CRYPTO_REAL
category: padel / event
lat: 13.74694
lng: 100.57202
coordStatus: VERIFIED
pickupEligible: true
destinationEligible: true
spawnEligible: true
eventTags:
  - superteam
  - padel
  - pudgy
  - monkedao
  - jupiter
```

### 32. Jodd Fairs / Rama 9 Area
```text
id: rat_jodd_fairs
type: REAL
category: market / nightlife
lat: 13.7577
lng: 100.5657
coordStatus: REPRESENTATIVE
pickupEligible: true
destinationEligible: true
spawnEligible: true
```

### 33. Ratchada Karaoke Emergency
```text
id: rat_karaoke_emergency
type: FICTIONAL
category: nightlife
lat: 13.7541
lng: 100.5767
coordStatus: ART_DIRECTED
pickupEligible: true
destinationEligible: true
spawnEligible: true
flavorLine: "Your passenger has already chosen the song."
```

### 34. Founder Recovery Massage
```text
id: rat_founder_recovery
type: FICTIONAL
category: wellness / startup
lat: 13.7499
lng: 100.5683
coordStatus: ART_DIRECTED
pickupEligible: true
destinationEligible: true
spawnEligible: true
flavorLine: "Post-pitch spinal realignment."
```

### 35. Pitch Deck Printer 24H
```text
id: rat_pitchdeck_printer
type: FICTIONAL
category: print / startup
lat: 13.7479
lng: 100.5777
coordStatus: ART_DIRECTED
pickupEligible: true
destinationEligible: true
spawnEligible: true
flavorLine: "Slide 47 is still exporting."
```

---

## ZONE 08 — ARI / CHATUCHAK

### 36. Chatuchak Weekend Market
```text
id: ari_chatuchak
type: REAL
category: market
lat: 13.7999
lng: 100.5500
coordStatus: REPRESENTATIVE
pickupEligible: true
destinationEligible: true
spawnEligible: true
```

### 37. Ari BTS
```text
id: ari_bts
type: REAL
category: transit / cafe
lat: 13.7797
lng: 100.5446
coordStatus: REPRESENTATIVE
pickupEligible: true
destinationEligible: true
spawnEligible: true
```

### 38. Minimalist Cafe With No Sign
```text
id: ari_no_sign_cafe
type: FICTIONAL
category: cafe
lat: 13.7819
lng: 100.5478
coordStatus: ART_DIRECTED
pickupEligible: true
destinationEligible: true
spawnEligible: true
flavorLine: "You walked past it twice."
```

### 39. Rare Plant Emergency
```text
id: ari_rare_plant
type: FICTIONAL
category: plant_shop
lat: 13.7964
lng: 100.5480
coordStatus: ART_DIRECTED
pickupEligible: true
destinationEligible: true
spawnEligible: true
flavorLine: "Do not bend the monstera."
```

### 40. Group Project Cafe
```text
id: ari_group_project
type: FICTIONAL
category: cafe / student
lat: 13.7838
lng: 100.5430
coordStatus: ART_DIRECTED
pickupEligible: true
destinationEligible: true
spawnEligible: true
flavorLine: "Only one person did the slides."
```

---

## ZONE 09 — CHAROEN KRUNG / RIVERSIDE

### 41. River City Bangkok
```text
id: river_river_city
type: REAL
category: arts / riverside
lat: 13.7294
lng: 100.5131
coordStatus: REPRESENTATIVE
pickupEligible: true
destinationEligible: true
spawnEligible: true
```

### 42. Bangkok Island
```text
id: river_bangkok_island
type: REAL
category: music / boat / nightlife
lat: 13.7187
lng: 100.5135
coordStatus: REPRESENTATIVE
pickupEligible: true
destinationEligible: true
spawnEligible: true
researchNote: "Treat as nightlife/boat venue. Do not attach specific Solana history unless separately verified."
```

### 43. Warehouse 30
```text
id: river_warehouse30
type: REAL
category: arts / creative
lat: 13.7271
lng: 100.5157
coordStatus: REPRESENTATIVE
pickupEligible: true
destinationEligible: true
spawnEligible: true
```

### 44. River Warehouse Rave
```text
id: river_warehouse_rave
type: FICTIONAL
category: music / arts
lat: 13.7235
lng: 100.5167
coordStatus: ART_DIRECTED
pickupEligible: true
destinationEligible: true
spawnEligible: true
flavorLine: "The event ends when the police ask nicely."
```

### 45. Photographer's Wrong Pier
```text
id: river_wrong_pier
type: FICTIONAL
category: photo_spot / riverside
lat: 13.7204
lng: 100.5110
coordStatus: ART_DIRECTED
pickupEligible: true
destinationEligible: true
spawnEligible: true
flavorLine: "The light is better at the other pier."
```

---

## ZONE 10 — PHRA KHANONG / PUNNAWITHI

### 46. True Digital Park
```text
id: pk_true_digital_park
type: CRYPTO_REAL
category: tech / startup / event
lat: 13.68558
lng: 100.61131
coordStatus: VERIFIED
pickupEligible: true
destinationEligible: true
spawnEligible: true
eventTags:
  - solana
  - builders
  - technical_workshop
```

### 47. Phra Khanong BTS
```text
id: pk_phra_khanong_bts
type: REAL
category: transit
lat: 13.7152
lng: 100.5912
coordStatus: REPRESENTATIVE
pickupEligible: true
destinationEligible: true
spawnEligible: true
```

### 48. W District
```text
id: pk_w_district
type: REAL
category: food / nightlife
lat: 13.7143
lng: 100.5934
coordStatus: REPRESENTATIVE
pickupEligible: true
destinationEligible: true
spawnEligible: true
```

### 49. Delivery Rider Canteen
```text
id: pk_rider_canteen
type: FICTIONAL
category: food / neighborhood
lat: 13.7091
lng: 100.5982
coordStatus: ART_DIRECTED
pickupEligible: true
destinationEligible: true
spawnEligible: true
flavorLine: "Everyone here knows a faster route than you."
```

### 50. Deployment Convenience Store
```text
id: pk_deployment_store
type: FICTIONAL
category: convenience_store / builder
lat: 13.6946
lng: 100.6054
coordStatus: ART_DIRECTED
pickupEligible: true
destinationEligible: true
spawnEligible: true
flavorLine: "Energy drink. Charger. One more deploy."
```

---

# 6. Special / Long-Distance Destinations

### 51. Suvarnabhumi Airport
```text
id: special_bkk_airport
type: SPECIAL / REAL
category: airport
lat: 13.6900
lng: 100.7501
coordStatus: REPRESENTATIVE
pickupEligible: false
destinationEligible: true
spawnEligible: true
rarity: rare
```

### 52. Don Mueang Airport
```text
id: special_dmk_airport
type: SPECIAL / REAL
category: airport
lat: 13.9126
lng: 100.6067
coordStatus: REPRESENTATIVE
pickupEligible: false
destinationEligible: true
spawnEligible: true
rarity: rare
```

---

# 7. Verified Superteam / Solana Easter Eggs

The Superteam Thailand Luma calendar supports several useful real-world Easter eggs.

## Based Studio

Use **Based Studio as the main recurring Solana home-base Easter egg**.

Verified public location:
```text
Based Studio
87 Sukhumvit Rd
Khlong Tan Nuea, Watthana
Bangkok 10110
13.7249752, 100.5799154
```

Superteam Thailand's calendar repeatedly lists Solana co-working and workshops at Based Studio.

The DFlow × Superteam Thailand Buildathon Demo Day on September 3, 2026 is also listed as taking place at Based Studio.

Recommended event overlays:

```text
SOLANA CO-WORKING BKK
SUPERTEAM WORKSHOP
DFlow × SUPERTEAM DEMO DAY
BUILDERS DEMO DAY
```

---

## Bel Club 22

Verified public location:
```text
Bel Club 22
1938 Phetchaburi Rd
Bangkok
approx. 13.74694, 100.57202
```

Superteam Thailand lists a co-working session with Melee Markets at Bel Club 22.

The broader Padel Rave event at the same venue included Superteam Thailand, Pudgy Penguins, Solana, MonkeDAO, Jupiter Global and other partners.

Recommended overlays:

```text
SUPERTEAM × MELEE CO-WORKING
PADEL RAVE
PUDGY PADEL
MONKEDAO COURT
JUPITER MATCH POINT
```

The last three can be playful event labels rather than claims that each organization independently hosted a standalone event.

---

## True Digital Park

Verified public location:
```text
True Digital Park
101 Sukhumvit Road
Bang Chak, Phra Khanong
Bangkok 10260
13.68558, 100.61131
```

Superteam Thailand lists a "Solana x AI Builders: The Road to Mainnet #5 (Bangkok)" technical workshop at True Digital Park.

Recommended overlay:

```text
SOLANA × AI BUILDERS
ROAD TO MAINNET
```

---

# 8. Other Luma-Derived Venue Candidates

These can exist later, but are not required for MVP.

```text
FYI Center
2525 Rama IV Rd
13.72145, 100.55969
```

The current Superteam Thailand calendar includes a KUB Global event at FYI Center.

```text
Town Hall Sukhumvit 49
Sukhumvit 49, Khlong Tan Nuea
```

The calendar lists Founder Wellness & Networking Series there.

```text
The Red Door BKK
89/8 Floor 3, Sukhumvit 24
Khlong Tan, Khlong Toei
```

Older Superteam calendar history lists Solana Co-Working BKK at The Red Door BKK. It is a good optional hidden-history Easter egg, but Based Studio is the much stronger recurring current anchor.

---

# 9. Crypto Content Rule

Do **not** turn every Superteam event into a permanent location.

Use:

```text
physical venue = CRYPTO_REAL location
event = CRYPTO_EVENT overlay
```

Example:

```text
Based Studio
  ↳ Solana Co-Working BKK
  ↳ TBA Workshop with Superteam Thailand
  ↳ DFlow × Superteam Demo Day
```

This prevents the map from becoming a crypto directory while still rewarding people who recognize the community references.

---

# 10. Location Coordinate Separation Rule

The current bug/visual issue comes from assigning fictional locations to the zone center.

New rule:

```text
NEVER:
location.lat = zone.lat
location.lng = zone.lng
```

Every location receives its own authored coordinate.

Minimum visual separation target:

```text
~150–250 meters between permanent markers when possible
```

If several real locations genuinely cluster closer than that, keep the real coordinates and let label-collision logic handle them.

For fictional places, move the pin to a nearby plausible block instead of stacking labels.

---

# 11. Map Label Hierarchy

There are three semantic text layers, but only two are persistent map layers.

## A. Base-map labels
MapLibre / map style.

## B. Crazy Tuk zone labels — persistent

Examples:

```text
YAOWARAT
SIAM
THONGLOR / EKKAMAI
```

These describe areas. They are never clickable destinations.

## C. Fare location labels — temporary gameplay UI

Example:

```text
      [NPC]
MIDNIGHT NOODLE SHOP
```

The location name appears **only because an NPC fare currently exists at that location**.

There is no standalone permanent Crazy Tuk label for MBK Center, Based Studio, Midnight Noodle Shop, or any other location. When the fare disappears, its location label disappears with it unless another active game state is referencing that location.

# 12. Rendering Recommendation

At normal gameplay zoom:

```text
ZONE LABEL
large / muted / behind gameplay

      NPC FARE ICON
    [portrait / pickup]
     BASED STUDIO
 temporary fare-location label
```

If no NPC fare exists at a location, **nothing Crazy Tuk-specific is rendered there**.

For fake places, the fare-label visual language should be identical to real destinations. Crypto-real locations remain mechanically normal locations.

---

# 13. MVP Cut

Even though 52 locations are now authored, do not load all of them into the first gameplay test.

Recommended first **20**:

```text
Khao San Road
Lost Backpack Hostel
Yaowarat Road
Midnight Noodle Shop
MBK Center
Siam Square
Lumpini Park
Face Factory Clinic
Terminal 21
Visa Run Travel Agency
Based Studio
Bad Decisions Cocktail Club
Basement 404
Bel Club 22
Chatuchak Weekend Market
Minimalist Cafe With No Sign
River City Bangkok
River Warehouse Rave
True Digital Park
Suvarnabhumi Airport
```

This subset gives:
- all major map directions,
- short / medium / long trips,
- multiple fictional jokes,
- nightlife,
- tourist traffic,
- three verified Solana-community Easter eggs,
- one airport disaster.

---

# 14. Implementation Shape

Recommended source data:

```ts
type CrazyTukLocation = {
  id: string
  name: string
  shortName: string
  zoneId: string | null
  type: 'REAL' | 'FICTIONAL' | 'CRYPTO_REAL' | 'SPECIAL'
  lat: number
  lng: number
  coordStatus: 'VERIFIED' | 'REPRESENTATIVE' | 'ART_DIRECTED'
  category: string[]
  pickupEligible: boolean
  destinationEligible: boolean
  spawnEligible: boolean
  rarity?: 'common' | 'uncommon' | 'rare'
  flavorLine?: string
  eventTags?: string[]
}
```

Zone source data:

```ts
type CrazyTukZone = {
  id: string
  name: string
  shortName: string
  labelLat: number
  labelLng: number
}
```

**Never derive a location coordinate from the zone coordinate.**

---

# 15. Locked World Identity

The map should now read like:

> Khao San disaster → Chinatown noodles → Siam mall → Silom clinic → Asok visa run → Thonglor bad decisions → DFlow Demo Day at Based Studio → padel with Superteam at Bel Club → Chatuchak plant emergency → riverside rave → True Digital Park builder meetup → airport catastrophe.

That is the locked Crazy Tuk Bangkok geography for the MVP.

---

# 16. Code-Facing Location Registry

The location list should live in one canonical data file and be queried through small helper functions.

Recommended structure:

```text
src/game/world/zones.ts
src/game/world/locations.ts
src/game/world/locationRegistry.ts
```

Do not scatter coordinates or location names across map components, NPC definitions, or fare-generation code.

## 16.1 Canonical location type

```ts
export interface CrazyTukLocation {
  id: string
  name: string
  shortName: string
  zoneId: string | null

  type: 'REAL' | 'FICTIONAL' | 'CRYPTO_REAL' | 'SPECIAL'

  lat: number
  lng: number
  coordStatus: 'VERIFIED' | 'REPRESENTATIVE' | 'ART_DIRECTED'

  categories: string[]

  pickupEligible: boolean
  destinationEligible: boolean
  spawnEligible: boolean

  rarity?: 'common' | 'uncommon' | 'rare'
  flavorLine?: string
  eventTags?: string[]
}
```

## 16.2 Canonical registry

```ts
export const LOCATIONS: CrazyTukLocation[] = [
  {
    id: 'thong_based_studio',
    name: 'Based Studio',
    shortName: 'Based Studio',
    zoneId: 'thonglor',
    type: 'CRYPTO_REAL',

    lat: 13.7249752,
    lng: 100.5799154,
    coordStatus: 'VERIFIED',

    categories: ['studio', 'coworking', 'event', 'crypto'],

    pickupEligible: true,
    destinationEligible: true,
    spawnEligible: true,

    rarity: 'uncommon',
    eventTags: ['solana', 'superteam', 'dflow'],
  },

  // ...
]
```

## 16.3 Lookup helpers

```ts
export const locationsById = new Map(
  LOCATIONS.map(location => [location.id, location])
)

export function getLocation(id: string) {
  return locationsById.get(id)
}

export function requireLocation(id: string) {
  const location = getLocation(id)

  if (!location) {
    throw new Error(`Unknown location: ${id}`)
  }

  return location
}

export function getLocationsByZone(zoneId: string) {
  return LOCATIONS.filter(
    location => location.zoneId === zoneId
  )
}

export function getPickupLocations() {
  return LOCATIONS.filter(
    location => location.pickupEligible
  )
}

export function getDestinationLocations() {
  return LOCATIONS.filter(
    location => location.destinationEligible
  )
}

export function getLocationsByCategory(category: string) {
  return LOCATIONS.filter(
    location => location.categories.includes(category)
  )
}
```

# 17. Fare References Locations by ID

A fare should store location IDs instead of duplicating coordinates or names.

```ts
type Fare = {
  id: string
  npcId: string

  pickupLocationId: string

  // hidden until pickup
  destinationLocationId: string

  expiresAt: number
  points: number
}
```

Example:

```ts
const fare = {
  id: 'fare_1042',
  npcId: 'beam',
  pickupLocationId: 'thong_based_studio',
  destinationLocationId: 'siam_mbk',
  expiresAt: 1787500000,
  points: 120,
}
```

# 18. Map Rendering Contract

The map must **not render `LOCATIONS` directly**.

Bad:

```tsx
LOCATIONS.map(location => (
  <LocationMarker />
))
```

Good:

```tsx
activeFares.map(fare => {
  const pickup = requireLocation(
    fare.pickupLocationId
  )

  return (
    <FareMarker
      key={fare.id}
      lat={pickup.lat}
      lng={pickup.lng}
      npcId={fare.npcId}
      locationLabel={pickup.shortName}
    />
  )
})
```

This makes the design rule automatic:

> **No fare = no location marker and no location label.**

# 19. Destination Resolution

After passenger pickup:

```ts
const destination = requireLocation(
  activeTrip.destinationLocationId
)
```

The destination object can then supply:

```text
route endpoint
distance calculation
fuel requirement
fare panel text
destination reveal
arrival detection
NPC contextual dialogue
event metadata
```

Whether an active destination receives a route-end marker is a separate UI decision. It still does not become a permanent map label.

# 20. MVP Prepared Pools

For the first build, simple exports are enough:

```ts
export const PICKUP_LOCATIONS =
  LOCATIONS.filter(l => l.pickupEligible)

export const DESTINATION_LOCATIONS =
  LOCATIONS.filter(l => l.destinationEligible)

export const SPAWN_LOCATIONS =
  LOCATIONS.filter(l => l.spawnEligible)

export const CRYPTO_LOCATIONS =
  LOCATIONS.filter(l => l.type === 'CRYPTO_REAL')
```

Later, weighted fare generation can use:

```text
NPC preferred zones
NPC preferred categories
location rarity
current event overlays
distance from player
duplicate active fares
```

without changing the registry.

# 21. Core Architecture

```text
FARE
  ↓
pickupLocationId
  ↓
LOCATION REGISTRY
  ↓
coordinate + shortName + metadata
  ↓
temporary NPC fare marker
```

Never:

```text
MAP
  ↓
renders every world location
```

And never:

```text
NPC definition
  ↓
hardcoded latitude / longitude
```

# 22. Builder Handoff Rule

> Store all Crazy Tuk locations in a single typed `LOCATIONS` registry. Game state references locations only by `locationId`. Do not render the location registry directly on the map. The map renders active fares; each fare resolves its pickup location from the registry and displays the NPC fare icon at that coordinate with the location's `shortName` directly underneath. When the fare disappears, the label disappears. Zone labels are a separate persistent map layer.
