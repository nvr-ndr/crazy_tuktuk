# Crazy Tuk — World Expansion Addendum / Outer Bangkok Zones

## 0. Purpose

This document is **Part 2** of the Crazy Tuk world/location spec.

The current map is geographically too concentrated around:

```text
Siam
Silom / Lumpini
Asok
Thonglor
Ratchada
```

That produces two problems:

1. NPC fare icons visually pile up near the center.
2. Even when locations are different, many trips feel geographically similar.

This addendum deliberately pushes authored fare locations into the emptier parts of the current Bangkok map.

The goal is **not** to make every part of Bangkok equally dense.

The goal is to create:

```text
inner-city fares
+
outer-neighborhood fares
+
cross-river fares
+
long diagonal trips
+
occasional "why are you sending me THERE?" trips
```

Locations remain invisible unless used by a fare/trip.

---

# 1. Expansion Strategy

Add **9 outer / secondary zones**.

Recommended new zones:

```text
11 bang_phlat       Bang Phlat / ChangChui
12 talat_phlu       Talat Phlu / Thonburi
13 bang_wa          Bang Wa / Phasi Charoen
14 bang_krachao     Bang Krachao
15 bang_kho_laem    Bang Kho Laem / Rama III
16 bang_na          Bang Na / Udom Suk
17 huai_khwang      Huai Khwang / Din Daeng
18 lat_phrao        Lat Phrao
19 bang_kapi        Ramkhamhaeng / Bang Kapi
```

These are intended to fill the currently empty west, southwest, south, northeast, and far-east portions of the map.

---

# 2. Important Map Rule

These locations **do not become permanent map labels**.

They only create visible geography when a fare spawns there.

Example:

```text
no fare:
nothing rendered

fare spawned:
        [NPC]
   CHANGCHUI
```

This means we can safely author a much larger location library without making the map visually crowded.

---

# 3. Coordinate Status

Same convention as the main world file:

```text
VERIFIED
REPRESENTATIVE
ART_DIRECTED
```

**VERIFIED**  
Coordinate checked against a public geographic source.

**REPRESENTATIVE**  
Real place using a practical map point rather than doorway-level precision.

**ART_DIRECTED**  
Fictional Crazy Tuk location deliberately placed at a plausible neighborhood coordinate.

---

# ZONE 11 — BANG PHLAT / CHANGCHUI

Suggested zone label anchor:

```text
lat: 13.7868
lng: 100.4748
```

This gives us a strong location cluster west/northwest of Old Town and across the river.

## 53. ChangChui Creative Park

```text
id: bp_changchui
name: ChangChui Creative Park
shortName: ChangChui
type: REAL
category: arts / market / nightlife
lat: 13.78953
lng: 100.47058
coordStatus: VERIFIED

pickupEligible: true
destinationEligible: true
spawnEligible: true
```

## 54. Airplane Afterparty

```text
id: bp_airplane_afterparty
name: Airplane Afterparty
shortName: Airplane Afterparty
type: FICTIONAL
category: nightlife / music
lat: 13.79215
lng: 100.47420
coordStatus: ART_DIRECTED

pickupEligible: true
destinationEligible: true
spawnEligible: false

flavorLine: "The plane is not going anywhere. You are."
```

## 55. Wrong Side of the River Studio

```text
id: bp_wrong_side_studio
name: Wrong Side of the River Studio
shortName: Wrong Side Studio
type: FICTIONAL
category: arts / studio
lat: 13.78372
lng: 100.46892
coordStatus: ART_DIRECTED

pickupEligible: true
destinationEligible: true
spawnEligible: false

flavorLine: "Your passenger swears this is the shortcut."
```

## 56. Uncle's Vintage Speaker Warehouse

```text
id: bp_vintage_speaker
name: Uncle's Vintage Speaker Warehouse
shortName: Vintage Speaker Warehouse
type: FICTIONAL
category: retail / music / warehouse
lat: 13.79434
lng: 100.47871
coordStatus: ART_DIRECTED

pickupEligible: true
destinationEligible: true
spawnEligible: false

flavorLine: "Cash only. The speakers are enormous."
```

---

# ZONE 12 — TALAT PHLU / THONBURI

Suggested zone label anchor:

```text
lat: 13.7214
lng: 100.4819
```

This is a very useful cross-river food/neighborhood zone.

## 57. Talat Phlu Market

```text
id: tp_talat_phlu_market
name: Talat Phlu Market
shortName: Talat Phlu
type: REAL
category: market / food
lat: 13.72139
lng: 100.47702
coordStatus: VERIFIED

pickupEligible: true
destinationEligible: true
spawnEligible: true
```

## 58. Talat Phlu Railway Stop

```text
id: tp_railway
name: Talat Phlu Railway Stop
shortName: Talat Phlu Railway
type: REAL
category: transit / neighborhood
lat: 13.72039
lng: 100.47806
coordStatus: REPRESENTATIVE

pickupEligible: true
destinationEligible: true
spawnEligible: false
```

## 59. Five Bowls Before Noon

```text
id: tp_five_bowls
name: Five Bowls Before Noon
shortName: Five Bowls
type: FICTIONAL
category: food
lat: 13.72456
lng: 100.47424
coordStatus: ART_DIRECTED

pickupEligible: true
destinationEligible: true
spawnEligible: false

flavorLine: "The sixth bowl is where people make mistakes."
```

## 60. Auntie's Freezer Repair

```text
id: tp_freezer_repair
name: Auntie's Freezer Repair
shortName: Freezer Repair
type: FICTIONAL
category: repair / neighborhood
lat: 13.71820
lng: 100.48136
coordStatus: ART_DIRECTED

pickupEligible: true
destinationEligible: true
spawnEligible: false

flavorLine: "If the ice cream melts, this becomes urgent."
```

---

# ZONE 13 — BANG WA / PHASI CHAROEN

Suggested zone label anchor:

```text
lat: 13.7180
lng: 100.4592
```

This pushes gameplay even farther southwest.

## 61. Bang Wa BTS / MRT

```text
id: bw_bang_wa
name: Bang Wa BTS / MRT
shortName: Bang Wa
type: REAL
category: transit
lat: 13.72250
lng: 100.45972
coordStatus: VERIFIED

pickupEligible: true
destinationEligible: true
spawnEligible: true
```

## 62. Canal Shortcut Pier

```text
id: bw_canal_pier
name: Canal Shortcut Pier
shortName: Canal Shortcut Pier
type: FICTIONAL
category: riverside / transit
lat: 13.71492
lng: 100.46330
coordStatus: ART_DIRECTED

pickupEligible: true
destinationEligible: true
spawnEligible: false

flavorLine: "The boat left thirty seconds ago."
```

## 63. Wedding Envelope Emergency

```text
id: bw_wedding_envelope
name: Wedding Envelope Emergency
shortName: Wedding Envelope
type: FICTIONAL
category: wedding / retail
lat: 13.71906
lng: 100.45252
coordStatus: ART_DIRECTED

pickupEligible: true
destinationEligible: true
spawnEligible: false

flavorLine: "Cash. Envelope. Ceremony already started."
```

## 64. Last Printer Before the Ring Road

```text
id: bw_last_printer
name: Last Printer Before the Ring Road
shortName: Last Printer
type: FICTIONAL
category: print / office
lat: 13.71061
lng: 100.45701
coordStatus: ART_DIRECTED

pickupEligible: true
destinationEligible: true
spawnEligible: false

flavorLine: "The PDF is still loading."
```

---

# ZONE 14 — BANG KRACHAO

Suggested zone label anchor:

```text
lat: 13.6960
lng: 100.5680
```

Bang Krachao gives the map a very different geographic silhouette and creates excellent cross-river routes.

## 65. Sri Nakhon Khuean Khan Park

```text
id: bk_green_lung_park
name: Sri Nakhon Khuean Khan Park
shortName: Green Lung Park
type: REAL
category: park / cycling
lat: 13.69681
lng: 100.56670
coordStatus: VERIFIED

pickupEligible: true
destinationEligible: true
spawnEligible: true
```

## 66. Bicycle Rental Auntie

```text
id: bk_bike_auntie
name: Bicycle Rental Auntie
shortName: Bicycle Rental Auntie
type: FICTIONAL
category: cycling / neighborhood
lat: 13.69963
lng: 100.56072
coordStatus: ART_DIRECTED

pickupEligible: true
destinationEligible: true
spawnEligible: false

flavorLine: "She thinks the tuk-tuk is unnecessary."
```

## 67. Secret Jungle Cafe

```text
id: bk_secret_jungle_cafe
name: Secret Jungle Cafe
shortName: Jungle Cafe
type: FICTIONAL
category: cafe / park
lat: 13.69197
lng: 100.57312
coordStatus: ART_DIRECTED

pickupEligible: true
destinationEligible: true
spawnEligible: false

flavorLine: "There are three signs. All point different ways."
```

## 68. Monitor Lizard Crossing

```text
id: bk_monitor_crossing
name: Monitor Lizard Crossing
shortName: Monitor Lizard Crossing
type: FICTIONAL
category: park / mystery
lat: 13.70214
lng: 100.57084
coordStatus: ART_DIRECTED

pickupEligible: true
destinationEligible: true
spawnEligible: false

flavorLine: "The lizard has right of way."
```

---

# ZONE 15 — BANG KHO LAEM / RAMA III

Suggested zone label anchor:

```text
lat: 13.6947
lng: 100.5102
```

This stretches the river gameplay significantly south of Charoen Krung.

## 69. Asiatique The Riverfront

```text
id: bkl_asiatique
name: Asiatique The Riverfront
shortName: Asiatique
type: REAL
category: market / nightlife / tourism
lat: 13.70419
lng: 100.50277
coordStatus: VERIFIED

pickupEligible: true
destinationEligible: true
spawnEligible: true
```

## 70. Ferris Wheel Breakup Point

```text
id: bkl_breakup_wheel
name: Ferris Wheel Breakup Point
shortName: Ferris Wheel
type: FICTIONAL
category: nightlife / tourism
lat: 13.70203
lng: 100.50542
coordStatus: ART_DIRECTED

pickupEligible: true
destinationEligible: true
spawnEligible: false

flavorLine: "One passenger. Two return tickets."
```

## 71. Rama III Furniture Kingdom

```text
id: bkl_furniture_kingdom
name: Rama III Furniture Kingdom
shortName: Furniture Kingdom
type: FICTIONAL
category: retail / warehouse
lat: 13.68677
lng: 100.51768
coordStatus: ART_DIRECTED

pickupEligible: true
destinationEligible: true
spawnEligible: false

flavorLine: "No, the sofa will not fit."
```

## 72. Riverside Wedding Hotel

```text
id: bkl_wedding_hotel
name: Riverside Wedding Hotel
shortName: Riverside Wedding
type: FICTIONAL
category: hotel / wedding
lat: 13.69712
lng: 100.49883
coordStatus: ART_DIRECTED

pickupEligible: true
destinationEligible: true
spawnEligible: false

flavorLine: "They are taking the group photo now."
```

---

# ZONE 16 — BANG NA / UDOM SUK

Suggested zone label anchor:

```text
lat: 13.6768
lng: 100.6120
```

This creates long east/southeast routes and makes Suvarnabhumi feel less isolated.

## 73. BITEC Bang Na

```text
id: bn_bitec
name: BITEC Bang Na
shortName: BITEC
type: REAL
category: convention / event
lat: 13.66973
lng: 100.60854
coordStatus: VERIFIED

pickupEligible: true
destinationEligible: true
spawnEligible: true
```

## 74. Udom Suk BTS

```text
id: bn_udom_suk
name: Udom Suk BTS
shortName: Udom Suk
type: REAL
category: transit
lat: 13.67917
lng: 100.60944
coordStatus: REPRESENTATIVE

pickupEligible: true
destinationEligible: true
spawnEligible: true
```

## 75. Convention Badge Printer

```text
id: bn_badge_printer
name: Convention Badge Printer
shortName: Badge Printer
type: FICTIONAL
category: event / print
lat: 13.67345
lng: 100.61472
coordStatus: ART_DIRECTED

pickupEligible: true
destinationEligible: true
spawnEligible: false

flavorLine: "Your name is spelled wrong."
```

## 76. Mega Furniture Pickup

```text
id: bn_mega_furniture
name: Mega Furniture Pickup
shortName: Furniture Pickup
type: FICTIONAL
category: retail / logistics
lat: 13.66372
lng: 100.62085
coordStatus: ART_DIRECTED

pickupEligible: true
destinationEligible: true
spawnEligible: false

flavorLine: "Passenger included one small chair. It is not small."
```

---

# ZONE 17 — HUAI KHWANG / DIN DAENG

Suggested zone label anchor:

```text
lat: 13.7808
lng: 100.5808
```

This expands the existing Ratchada geography north/east without overlapping the current central fare cluster.

## 77. Huai Khwang MRT

```text
id: hk_huai_khwang_mrt
name: Huai Khwang MRT
shortName: Huai Khwang
type: REAL
category: transit
lat: 13.77869
lng: 100.57357
coordStatus: VERIFIED

pickupEligible: true
destinationEligible: true
spawnEligible: true
```

## 78. Midnight Hotpot Tower

```text
id: hk_hotpot_tower
name: Midnight Hotpot Tower
shortName: Midnight Hotpot
type: FICTIONAL
category: food / nightlife
lat: 13.78294
lng: 100.58061
coordStatus: ART_DIRECTED

pickupEligible: true
destinationEligible: true
spawnEligible: false

flavorLine: "Table booked for 1:30 AM."
```

## 79. Karaoke Floor 17

```text
id: hk_karaoke_17
name: Karaoke Floor 17
shortName: Karaoke Floor 17
type: FICTIONAL
category: nightlife
lat: 13.77658
lng: 100.58431
coordStatus: ART_DIRECTED

pickupEligible: true
destinationEligible: true
spawnEligible: false

flavorLine: "Nobody remembers booking Floor 17."
```

## 80. Emergency Durian Delivery

```text
id: hk_durian_delivery
name: Emergency Durian Delivery
shortName: Durian Emergency
type: FICTIONAL
category: food / delivery
lat: 13.78602
lng: 100.57591
coordStatus: ART_DIRECTED

pickupEligible: true
destinationEligible: true
spawnEligible: false

flavorLine: "Windows down."
```

---

# ZONE 18 — LAT PHRAO

Suggested zone label anchor:

```text
lat: 13.8168
lng: 100.5680
```

This fills the large northern empty area above Ari / Chatuchak.

## 81. Union Mall

```text
id: lp_union_mall
name: Union Mall
shortName: Union Mall
type: REAL
category: mall / shopping
lat: 13.81357
lng: 100.56191
coordStatus: VERIFIED

pickupEligible: true
destinationEligible: true
spawnEligible: true
```

## 82. Ha Yaek Lat Phrao

```text
id: lp_ha_yaek
name: Ha Yaek Lat Phrao
shortName: Lat Phrao
type: REAL
category: transit
lat: 13.81645
lng: 100.56142
coordStatus: REPRESENTATIVE

pickupEligible: true
destinationEligible: true
spawnEligible: true
```

## 83. Condo Lobby B

```text
id: lp_condo_lobby_b
name: Condo Lobby B
shortName: Lobby B
type: FICTIONAL
category: condo / residential
lat: 13.82172
lng: 100.57084
coordStatus: ART_DIRECTED

pickupEligible: true
destinationEligible: true
spawnEligible: false

flavorLine: "There are six Lobby Bs."
```

## 84. Pet Cafe Incident

```text
id: lp_pet_cafe
name: Pet Cafe Incident
shortName: Pet Cafe
type: FICTIONAL
category: cafe / mystery
lat: 13.81021
lng: 100.57393
coordStatus: ART_DIRECTED

pickupEligible: true
destinationEligible: true
spawnEligible: false

flavorLine: "The passenger is carrying someone else's cat."
```

---

# ZONE 19 — RAMKHAMHAENG / BANG KAPI

Suggested zone label anchor:

```text
lat: 13.7587
lng: 100.6265
```

This is one of the most important expansion zones because it fills the large empty east/northeast side of the current map.

## 85. Rajamangala National Stadium

```text
id: bkp_rajamangala
name: Rajamangala National Stadium
shortName: Rajamangala
type: REAL
category: stadium / event
lat: 13.75541
lng: 100.62213
coordStatus: VERIFIED

pickupEligible: true
destinationEligible: true
spawnEligible: true
```

## 86. Hua Mak Night Bus

```text
id: bkp_hua_mak_bus
name: Hua Mak Night Bus
shortName: Hua Mak Night Bus
type: FICTIONAL
category: transit
lat: 13.74948
lng: 100.63217
coordStatus: ART_DIRECTED

pickupEligible: true
destinationEligible: true
spawnEligible: false

flavorLine: "Nobody is sure where the bus stops."
```

## 87. Stadium Gate Nobody Uses

```text
id: bkp_wrong_gate
name: Stadium Gate Nobody Uses
shortName: Wrong Stadium Gate
type: FICTIONAL
category: stadium / event
lat: 13.75983
lng: 100.62691
coordStatus: ART_DIRECTED

pickupEligible: true
destinationEligible: true
spawnEligible: false

flavorLine: "Your ticket says Gate E. There is no Gate E."
```

## 88. Ramkhamhaeng Exam Panic

```text
id: bkp_exam_panic
name: Ramkhamhaeng Exam Panic
shortName: Exam Panic
type: FICTIONAL
category: university / student
lat: 13.76355
lng: 100.61705
coordStatus: ART_DIRECTED

pickupEligible: true
destinationEligible: true
spawnEligible: false

flavorLine: "Attendance closes in seven minutes."
```

---

# 4. Recommended Expansion Priority

Do not enable all 36 new locations immediately.

## Expansion Wave A — biggest visual payoff

Enable:

```text
ChangChui Creative Park
Talat Phlu Market
Sri Nakhon Khuean Khan Park
Asiatique
BITEC
Union Mall
Rajamangala Stadium
```

These seven alone dramatically widen the map.

## Expansion Wave B — neighborhood texture

Then enable:

```text
Bang Wa
Huai Khwang MRT
Udom Suk BTS
Wrong Side Studio
Five Bowls Before Noon
Secret Jungle Cafe
Riverside Wedding Hotel
Midnight Hotpot Tower
Condo Lobby B
Stadium Gate Nobody Uses
```

## Expansion Wave C — full authored pool

Enable the remaining fictional points once fare density and label collision have been tested.

---

# 5. Outer-Fare Weighting

We should **not** select every pickup uniformly.

Suggested MVP pickup weighting:

```text
central / existing zones       65%
outer expansion zones          30%
special / unusual zones         5%
```

Suggested destination distribution:

```text
same / adjacent zone          45%
cross-city                    40%
outer / unusual               12%
airport                        3%
```

Tune after playtesting.

---

# 6. Good Cross-City Comedy Routes

```text
ChangChui → Thonglor
Talat Phlu → Based Studio
Bang Krachao → Siam
Union Mall → Asiatique
Rajamangala → Khao San
BITEC → Chatuchak
Huai Khwang → Bang Wa
```

These feel more like actual "cross Bangkok" jobs than repeatedly moving between Siam, Asok, Silom, and Thonglor.

---

# 7. Suggested Zone Registration

Append these zones to `zones.ts`:

```ts
export const OUTER_ZONES = [
  { id: 'bang_phlat', name: 'Bang Phlat / ChangChui', labelLat: 13.7868, labelLng: 100.4748 },
  { id: 'talat_phlu', name: 'Talat Phlu / Thonburi', labelLat: 13.7214, labelLng: 100.4819 },
  { id: 'bang_wa', name: 'Bang Wa / Phasi Charoen', labelLat: 13.7180, labelLng: 100.4592 },
  { id: 'bang_krachao', name: 'Bang Krachao', labelLat: 13.6960, labelLng: 100.5680 },
  { id: 'bang_kho_laem', name: 'Bang Kho Laem / Rama III', labelLat: 13.6947, labelLng: 100.5102 },
  { id: 'bang_na', name: 'Bang Na / Udom Suk', labelLat: 13.6768, labelLng: 100.6120 },
  { id: 'huai_khwang', name: 'Huai Khwang / Din Daeng', labelLat: 13.7808, labelLng: 100.5808 },
  { id: 'lat_phrao', name: 'Lat Phrao', labelLat: 13.8168, labelLng: 100.5680 },
  { id: 'bang_kapi', name: 'Ramkhamhaeng / Bang Kapi', labelLat: 13.7587, labelLng: 100.6265 },
]
```

---

# 8. Pack Structure

Keep this separate from the core world file.

```text
CRAZY_TUK_WORLD_FINAL.md
CRAZY_TUK_WORLD_EXPANSION_01.md
```

Code can combine them cleanly:

```ts
export const LOCATIONS = [
  ...CORE_LOCATIONS,
  ...OUTER_LOCATIONS,
]
```

Or enable location packs:

```ts
const ACTIVE_LOCATION_PACKS = [
  'core',
  'outer_01',
]
```

This gives us a clean path to later event packs, seasonal packs, or Superteam history packs without rewriting the core map.
