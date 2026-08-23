# Crazy Tuk — World Bible / Location System

## 0. Purpose

This document defines the **Crazy Tuk Bangkok world structure**: zones, locations, location metadata, and how real, fictional, and crypto-community places fit together.

It is intentionally **not** the final 50-location list yet.

For the one-day MVP, we only need enough locations to:
- prove the map works,
- create funny pickup/destination combinations,
- test fuel/distance,
- establish the content format.

Later, this document should expand to roughly **50 locations** after reviewing:
- Superteam Thailand Luma / event history,
- Solana ecosystem meetups in Bangkok,
- real venues used by Superteam / Pudgy / Solana community events,
- locally recognizable Bangkok places.

---

# 1. World Structure

Crazy Tuk uses three layers:

```text
BANGKOK
  ↓
ZONE
  ↓
LOCATION
```

Example:

```text
Bangkok
  ↓
Thonglor / Ekkamai
  ↓
Bad Decisions Cocktail Club
```

A location can be used as:

- player spawn,
- passenger pickup,
- passenger destination,
- rescue location later,
- temporary event venue,
- map landmark.

---

# 2. Location Types

Every location has one of these content types:

```text
REAL
FICTIONAL
CRYPTO_REAL
CRYPTO_EVENT
SPECIAL
```

## REAL
Actual Bangkok place or recognizable public location.

Examples:
- Lumpini Park
- Yaowarat Road
- MBK Center
- Chatuchak Market

## FICTIONAL
Invented Bangkok-flavored establishment used for comedy.

Examples:
- Bad Decisions Cocktail Club
- Omakase You Can't Afford
- Face Factory Clinic

## CRYPTO_REAL
Real physical venue used by local crypto / Solana communities.

Example:
- Based Studio

## CRYPTO_EVENT
Temporary event overlay attached to a real venue.

Example:
- Solana Superteam Meetup
- Pudgy Padel Rematch
- DFlow Demo Day

## SPECIAL
Long-distance / high-impact destination.

Examples:
- Suvarnabhumi Airport
- Don Mueang Airport

---

# 3. Location Data Schema

Each location should follow roughly this structure:

```text
id
name
shortName
zoneId
type
latitude
longitude

category
rarity

description
flavorLine

pickupEligible
destinationEligible
spawnEligible

preferredNpcTags[]
eventTags[]

verified
researchNote
```

Example:

```text
id: thonglor_bad_decisions
name: Bad Decisions Cocktail Club
shortName: Bad Decisions
zoneId: thonglor
type: FICTIONAL

category: nightlife
rarity: common

description:
A suspiciously fashionable cocktail bar where everyone says
they are only staying for one drink.

flavorLine:
"Nobody has ever left after one."

pickupEligible: true
destinationEligible: true
spawnEligible: false

preferredNpcTags:
nightlife
dj
crypto
hi_so

verified: n/a
```

---

# 4. Zone Plan

Target final world:

```text
8–10 zones
~5–7 locations per zone
~50 locations total
```

Suggested initial zones:

1. Yaowarat / Chinatown
2. Old Town / Khao San
3. Siam / Central Bangkok
4. Silom / Sathorn
5. Lumpini / Rama IV
6. Sukhumvit / Asok
7. Thonglor / Ekkamai
8. Ari / Chatuchak
9. River / Charoen Krung
10. Airports / Outer Bangkok

Not every zone needs equal density.

---

# 5. Sample World — Real + Fictional Locations

These are enough to establish format and give the MVP a believable world.

---

# ZONE 1 — YAOWARAT / CHINATOWN

## 1. Yaowarat Road
**Type:** REAL  
**Category:** street / food / nightlife  
**Use:** pickup + destination + spawn  
**Rarity:** common

**Description:**  
Bangkok's Chinatown artery: neon, food stalls, traffic, tourists, locals, and tuk-tuks competing for the same meter of road.

**Flavor:**  
*"There is always traffic. There is always food."*

**NPC fits:**  
Auntie, tourist, foodie, crypto bro, office worker.

**Research note:**  
Use a representative public coordinate on Yaowarat Road.

---

## 2. Midnight Noodle Shop
**Type:** FICTIONAL  
**Category:** food  
**Use:** pickup + destination + spawn  
**Rarity:** common

**Description:**  
A tiny late-night noodle shop that appears to be open regardless of the actual time.

**Flavor:**  
*"Closed once in 2017. Nobody remembers why."*

**NPC fits:**  
Auntie, DJ, degen, tourist.

---

## 3. Definitely Legal Mahjong Club
**Type:** FICTIONAL  
**Category:** nightlife / mystery  
**Use:** pickup + destination  
**Rarity:** uncommon

**Description:**  
Upstairs. No sign. Everyone knows where it is.

**Flavor:**  
*"You didn't hear about it from us."*

**NPC fits:**  
Auntie, mysterious businessman, whale, degen.

---

## 4. Lucky Lucky Gold & Phone Repair
**Type:** FICTIONAL  
**Category:** retail  
**Use:** pickup + destination  
**Rarity:** common

**Description:**  
Gold in the front, cracked iPhones in the back.

**Flavor:**  
*"Cash, gold, batteries, chargers. Probably."*

---

# ZONE 2 — OLD TOWN / KHAO SAN

## 5. Khao San Road
**Type:** REAL  
**Category:** nightlife / tourism  
**Use:** pickup + destination + spawn  
**Rarity:** common

**Description:**  
Backpacker chaos, buckets, hostels, and someone asking where the afterparty is.

**Flavor:**  
*"Someone here has lost a passport."*

**NPC fits:**  
Tourists, backpackers, crypto tourists, DJs.

---

## 6. Lost Backpack Hostel
**Type:** FICTIONAL  
**Category:** hostel  
**Use:** pickup + destination + spawn  
**Rarity:** common

**Description:**  
Budget beds, questionable lockers, excellent stories.

**Flavor:**  
*"The backpack is not coming back."*

---

## 7. Scorpion & Smoothie Cart
**Type:** FICTIONAL  
**Category:** street food  
**Use:** pickup + destination  
**Rarity:** uncommon

**Description:**  
One half fruit smoothies. One half things tourists photograph but rarely eat.

**Flavor:**  
*"Protein is protein."*

---

## 8. Grand Palace
**Type:** REAL  
**Category:** landmark  
**Use:** destination primarily  
**Rarity:** uncommon

**Description:**  
Major Bangkok landmark and classic tourist destination.

**Flavor:**  
*"Your passenger is not dressed correctly."*

**NPC fits:**  
Tourists, relatives visiting Bangkok, confused backpackers.

---

# ZONE 3 — SIAM / CENTRAL

## 9. MBK Center
**Type:** REAL  
**Category:** mall / retail  
**Use:** pickup + destination  
**Rarity:** common

**Description:**  
Phones, clothes, food, electronics, tourists, and ten floors of "maybe it's on the next level."

**Flavor:**  
*"Your passenger said five minutes. They're still inside."*

---

## 10. Siam Square
**Type:** REAL  
**Category:** shopping / youth  
**Use:** pickup + destination + spawn  
**Rarity:** common

**Description:**  
Dense central Bangkok shopping and hangout area.

**Flavor:**  
*"Nobody remembers which Siam they're supposed to meet at."*

---

## 11. 240 Baht Bubble Tea
**Type:** FICTIONAL  
**Category:** cafe  
**Use:** pickup + destination  
**Rarity:** common

**Description:**  
A cup of tea with rent-level confidence.

**Flavor:**  
*"The pearls cost extra."*

---

## 12. Phone Repair Guy
**Type:** FICTIONAL  
**Category:** electronics  
**Use:** pickup + destination  
**Rarity:** common

**Description:**  
No store name. No website. Somehow fixes everything.

**Flavor:**  
*"Come back in twenty minutes."*

---

# ZONE 4 — SILOM / SATHORN

## 13. Silom Road
**Type:** REAL  
**Category:** CBD / nightlife  
**Use:** pickup + destination + spawn  
**Rarity:** common

**Description:**  
Office towers by day, nightlife by night, traffic almost always.

**Flavor:**  
*"Your passenger says they're 'almost downstairs.'"*

---

## 14. Face Factory Clinic
**Type:** FICTIONAL  
**Category:** beauty / clinic  
**Use:** pickup + destination  
**Rarity:** uncommon

**Description:**  
A premium aesthetic clinic where everyone exits looking "rested."

**Flavor:**  
*"Do not ask about the bandages."*

**NPC fits:**  
Hi-so passenger, influencer, crypto bro, PR person.

---

## 15. Crypto Coworking Dungeon
**Type:** FICTIONAL  
**Category:** coworking / crypto  
**Use:** pickup + destination  
**Rarity:** uncommon

**Description:**  
No sunlight. Twelve laptops. Someone has been deploying for six hours.

**Flavor:**  
*"It worked locally."*

---

## 16. Lunch Auntie
**Type:** FICTIONAL  
**Category:** food  
**Use:** pickup + destination  
**Rarity:** common

**Description:**  
Feeds half the office workers in Silom and knows all of their business.

**Flavor:**  
*"You look thin. Eat."*

---

# ZONE 5 — LUMPINI / RAMA IV

## 17. Lumpini Park
**Type:** REAL  
**Category:** park  
**Use:** pickup + destination  
**Rarity:** common

**Description:**  
Bangkok's major central park.

**Flavor:**  
*"Watch out for the monitor lizards."*

---

## 18. Lumpini Aerobics Circle
**Type:** REAL-INSPIRED / EVENT-LIKE  
**Category:** fitness / social  
**Use:** destination  
**Rarity:** uncommon

**Description:**  
Outdoor group aerobics / dancing in the park.

**Flavor:**  
*"They're already on the second song."*

**NPC fits:**  
Auntie, office worker, fitness uncle.

**Research note:**  
Use a plausible park coordinate; no need to model a specific permanent business.

---

## 19. Soi Twelve Muay Thai
**Type:** FICTIONAL  
**Category:** gym / sports  
**Use:** pickup + destination  
**Rarity:** common

**Description:**  
A small Muay Thai gym where everybody says one more round.

**Flavor:**  
*"Your passenger smells like liniment."*

---

# ZONE 6 — SUKHUMVIT / ASOK

## 20. Terminal 21
**Type:** REAL  
**Category:** mall  
**Use:** pickup + destination  
**Rarity:** common

**Description:**  
Major Asok shopping center and useful game-world anchor.

**Flavor:**  
*"Meet at the entrance. Which entrance? Good luck."*

---

## 21. Asok BTS / MRT
**Type:** REAL  
**Category:** transit  
**Use:** pickup + destination + spawn  
**Rarity:** common

**Description:**  
One of Bangkok's busiest transit intersections.

**Flavor:**  
*"Traffic has entered the chat."*

---

## 22. Visa Run Travel Agency
**Type:** FICTIONAL  
**Category:** travel  
**Use:** pickup + destination  
**Rarity:** uncommon

**Description:**  
Flights, vans, border runs, photocopies, and one printer that never works.

**Flavor:**  
*"Passport?"*

---

# ZONE 7 — THONGLOR / EKKAMAI

## 23. Thonglor
**Type:** REAL  
**Category:** nightlife / dining  
**Use:** pickup + destination + spawn  
**Rarity:** common

**Description:**  
Nightlife, restaurants, bars, clubs, and people who absolutely said they were going home early.

**Flavor:**  
*"One drink turned into four locations."*

---

## 24. Bad Decisions Cocktail Club
**Type:** FICTIONAL  
**Category:** nightlife  
**Use:** pickup + destination  
**Rarity:** common

**Description:**  
Everyone arrives for one drink.

**Flavor:**  
*"Nobody leaves after one."*

---

## 25. Omakase You Can't Afford
**Type:** FICTIONAL  
**Category:** restaurant  
**Use:** pickup + destination  
**Rarity:** uncommon

**Description:**  
No visible prices. Very small portions. Extremely confident chef.

**Flavor:**  
*"If you have to ask..."*

---

## 26. Basement 404
**Type:** FICTIONAL  
**Category:** club / music  
**Use:** pickup + destination  
**Rarity:** uncommon

**Description:**  
Underground club. Technically exists.

**Flavor:**  
*"No signal. Great sound system."*

---

# ZONE 8 — ARI / CHATUCHAK

## 27. Chatuchak Weekend Market
**Type:** REAL  
**Category:** market  
**Use:** pickup + destination  
**Rarity:** common

**Description:**  
Massive market maze with food, clothes, plants, furniture, pets, and no obvious exit.

**Flavor:**  
*"Your passenger is at Section 17. Probably."*

---

## 28. Ari
**Type:** REAL  
**Category:** neighborhood / cafe  
**Use:** pickup + destination + spawn  
**Rarity:** common

**Description:**  
Cafe-heavy neighborhood with restaurants and quieter residential streets.

**Flavor:**  
*"Your passenger ordered coffee while waiting."*

---

## 29. Minimalist Cafe With No Sign
**Type:** FICTIONAL  
**Category:** cafe  
**Use:** pickup + destination  
**Rarity:** common

**Description:**  
White walls. Four seats. Coffee costs more than lunch.

**Flavor:**  
*"You walked past it twice."*

---

# ZONE 9 — RIVER / CHAROEN KRUNG

## 30. Charoen Krung
**Type:** REAL  
**Category:** arts / nightlife / river district  
**Use:** pickup + destination + spawn  
**Rarity:** common

**Description:**  
Old Bangkok streets mixed with galleries, bars, venues, warehouses, and river activity.

**Flavor:**  
*"Old building, new cocktail menu."*

---

## 31. Bangkok Island
**Type:** REAL — VERIFY CRYPTO HISTORY LATER  
**Category:** music / boat / nightlife  
**Use:** pickup + destination / possible crypto-event overlay  
**Rarity:** uncommon

**Description:**  
Music/event boat venue associated with Bangkok nightlife.

**Flavor:**  
*"The venue moves more than your portfolio."*

**IMPORTANT RESEARCH NOTE:**  
Verify whether this is the boat venue remembered from early 2026 Solana / Superteam Thailand events before attaching any historical crypto-event claim.

---

## 32. River Warehouse Rave
**Type:** FICTIONAL  
**Category:** music / arts  
**Use:** destination  
**Rarity:** uncommon

**Description:**  
Old warehouse, questionable ventilation, excellent projector.

**Flavor:**  
*"The event ends when the police ask nicely."*

---

# ZONE 10 — SPECIAL / OUTER

## 33. Suvarnabhumi Airport
**Type:** REAL / SPECIAL  
**Category:** airport  
**Use:** destination primarily  
**Rarity:** rare

**Description:**  
Long-distance destination designed to create fuel risk.

**Flavor:**  
*"Their flight is always sooner than they said."*

**Gameplay note:**  
Use as one of the main "oh no" destination reveals.

---

## 34. Don Mueang Airport
**Type:** REAL / SPECIAL  
**Category:** airport  
**Use:** destination primarily  
**Rarity:** rare

**Description:**  
Second major airport destination.

**Flavor:**  
*"Wrong airport jokes are mandatory."*

---

# 6. Crypto / Solana Location Stubs

These should be expanded only after researching actual event history.

---

## 35. Based Studio
**Type:** CRYPTO_REAL  
**Zone:** TBD / Sukhumvit-side based on verified coordinates  
**Category:** coworking / event venue  
**Use:** pickup + destination + event overlays  
**Rarity:** uncommon

**Known use:**  
Superteam / Solana ecosystem community activity and buildathon-related events.

**Flavor:**  
*"Someone's demo worked ten minutes ago."*

### Possible event overlays

```text
DFLOW BUILDATHON DEMO DAY
SOLANA CO-WORKING
SUPERTEAM WORKSHOP
UNOFFICIAL HACKER HOUSE
```

**TODO:**  
Verify exact event names, dates, and venue coordinates from Superteam Thailand Luma / official event pages before finalizing.

---

## 36. Bel Club 22
**Type:** CRYPTO_REAL — VERIFY DETAILS  
**Zone:** TBD  
**Category:** padel / event  
**Use:** pickup + destination + event overlays  
**Rarity:** uncommon

**Potential community history:**  
Pudgy Penguins / Superteam / Solana-related padel event.

**Flavor:**  
*"The penguins brought rackets."*

### Possible overlay

```text
PUDGY PADEL REMATCH
```

**TODO:**  
Verify exact event name, venue, date, and participating communities from Superteam Thailand / event history before finalizing.

---

# 7. Future Superteam Thailand / Luma Research Pass

Do **not** blindly add crypto venues.

For each event found on Superteam Thailand's Luma/event history, capture:

```text
event name
date
venue name
venue coordinates
organizer
partner/community
event type
source URL
whether venue is reusable
possible Crazy Tuk joke
```

Then decide whether it becomes:

```text
CRYPTO_REAL location
or
CRYPTO_EVENT overlay on an existing location
```

---

## Priority Things to Search Later

Look for:

- Superteam Thailand meetups
- Solana co-working events
- hackathons
- builder meetups
- Hacker House-style events
- DFlow Buildathon events
- Pudgy Penguins events
- Padel Rave / sports meetups
- Jupiter events
- MonkeDAO events
- Solana community parties
- river / boat events
- recurring Bangkok crypto venues

---

# 8. Temporary Event Overlay System

A location can temporarily host an event.

Example:

```text
LOCATION:
Based Studio

EVENT:
DFlow Buildathon Demo Day
```

The map may display:

```text
◎ BASED STUDIO
  DFLOW DEMO DAY
  42m remaining
```

NPC destination:

```text
"Get me to Demo Day."
```

This allows the same physical location to create multiple stories without expanding the map.

---

# 9. Event Data Schema

```text
id
name
locationId
startAt
endAt
category

description
flavorLine

destinationWeightBonus
npcTags[]

verified
source
```

For MVP, events may simply be static content.

No scheduler required initially.

---

# 10. Location Categories

Suggested categories:

```text
food
nightlife
cafe
shopping
market
park
fitness
muay_thai
beauty
clinic
coworking
crypto
event
music
hotel
hostel
tourism
transit
airport
arts
mystery
```

NPC personalities can later weight categories.

Example:

```text
DJ:
nightlife + music + afterparty

Auntie:
market + food + park

Crypto Bro:
crypto + coworking + nightlife

Tourist:
tourism + market + airport
```

---

# 11. Pickup vs Destination Rules

Most locations can be both.

Exceptions:

## Primarily destination
- Airports
- event stages
- certain tourist attractions

## Primarily pickup
- hostel
- clinic
- nightclub closing-time pickup
- coworking office

Do not over-constrain MVP.

---

# 12. Destination Hidden Rule

Available fare shows:

```text
NPC
pickup location
pickup fuel cost
swap requirement
point value
expiry
```

It does **not** show destination.

Destination is revealed only after passenger pickup.

This is essential to the game's risk/comedy loop.

---

# 13. Geographic Tone

The world should feel like:

> **recognizable Bangkok, compressed for gameplay**

Not:
- literal navigation software,
- exact driving simulation,
- tourist guide accuracy.

MapLibre provides real geography.

Crazy Tuk is allowed to exaggerate:
- relative importance,
- visual scale,
- route presentation,
- location density.

---

# 14. MVP Location Subset

Do not use all 50 immediately.

Recommended first test set:

```text
Yaowarat Road
Midnight Noodle Shop
Khao San Road
Lost Backpack Hostel
Siam Square
MBK Center
Silom Road
Face Factory Clinic
Lumpini Park
Asok
Bad Decisions Cocktail Club
Chatuchak Market
Based Studio
Suvarnabhumi Airport
```

Approximately 12–14 locations is enough to prove:

```text
short trip
medium trip
cross-city trip
airport disaster trip
crypto Easter egg
```

---

# 15. Target Final Content Mix

For ~50 locations:

```text
~22 REAL Bangkok places
~16 FICTIONAL Crazy Tuk places
~8 CRYPTO_REAL / community venues
~4 SPECIAL / event-heavy locations
```

This is a target, not a rule.

Crypto history may instead be represented heavily through event overlays.

---

# 16. Content Writing Rule

A good Crazy Tuk location should satisfy at least one:

1. instantly recognizable,
2. creates a funny passenger situation,
3. strengthens Bangkok identity,
4. references local crypto culture,
5. creates useful geographic gameplay.

Avoid generic filler such as:

```text
Restaurant 1
Coffee Shop 2
Club 3
```

Every fictional location should have a joke or identity.

---

# 17. Expansion Workflow

Do not author all 50 at once.

### Pass 1
Lock:
- zones,
- 12 MVP locations,
- coordinates.

### Pass 2
Expand to:
- ~30 real + fictional places.

### Pass 3
Research Superteam Thailand / Solana event history.

Add:
- verified crypto venues,
- event overlays,
- Easter eggs.

### Pass 4
Reach approximately:
- 50 total locations.

### Pass 5
Tune:
- NPC-location preferences,
- pickup/destination weights,
- airport frequency,
- geographic fuel costs.

---

# 18. World MVP Acceptance Criteria

World system is ready for core implementation when:

- [ ] MapLibre renders Bangkok.
- [ ] At least 10 locations have coordinates.
- [ ] Player can spawn at eligible location.
- [ ] NPC can spawn at a location.
- [ ] NPC pickup marker is clickable.
- [ ] Pickup cost can be calculated.
- [ ] Destination can be hidden.
- [ ] Destination can reveal after pickup.
- [ ] Route can render between two locations.
- [ ] Airport is visibly long-distance.
- [ ] At least one real crypto-community location exists as an Easter egg.
- [ ] Real and fictional locations visually coexist without confusion.

---

# 19. Current World Summary

The initial Crazy Tuk world should feel like:

> Yaowarat noodles → Khao San hostel → Siam mall → Silom clinic → Lumpini aerobics → Thonglor bad decisions → Superteam meetup → Chatuchak market → airport catastrophe.

That is enough Bangkok to make the concept immediately legible while leaving room for the deeper 50-location / Superteam-history pass later.
