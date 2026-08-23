# Crazy Tuk — NPC Persona Bible

## 0. Purpose

This document defines the recurring passenger characters who make **Crazy Tuk** feel like a living Bangkok.

The NPC system is intentionally lightweight:

- no runtime LLM required,
- no deep simulation,
- no complex relationship system.

Each NPC is a reusable authored persona with:
- a strong one-line identity,
- a recognizable attitude,
- preferred location categories,
- short contextual dialogue pools,
- review/comment templates.

For the one-day MVP, only a small subset needs to be implemented.

Target final library:

```text
30 recurring NPC personas
```

Recommended MVP subset:

```text
5–8 NPCs
```

---

# 1. NPC Design Goal

NPCs should make ordinary game states funny.

The same mechanical event:

```text
PLAYER STALLED FOR 12 MINUTES
```

should feel different depending on the passenger.

Examples:

Auntie:
> "I told you to get gas."

Tourist:
> "Is this part of the tour?"

Degen:
> "Bullish on this driver."

Hi-so passenger:
> "Unacceptable."

The NPC personality is primarily a **writing layer over game telemetry**.

---

# 2. NPC Data Schema

Recommended structure:

```text
id
name
displayName
ageOrVibe
avatarKey

oneLineBio
personalityArchetype
toneTags[]

preferredZones[]
preferredLocationCategories[]
rareDestinationTags[]

pickupLines[]
drivingLines[]
shortStallLines[]
mediumStallLines[]
longStallLines[]
extremeStallLines[]

cleanTripReviews[]
mixedTripReviews[]
badTripReviews[]

airportLines[]
eventLines[]
rescueLines[]

ratingBias
```

Not every field is required for MVP.

---

# 3. MVP-Minimum NPC Schema

For Day 1, each NPC only needs:

```text
id
name
avatar
oneLineBio
preferredCategories[]

pickupLines[2]
stallLines[2]
completionLines[2]
```

Do not author 15+ lines per NPC until the state system works.

---

# 4. Personality Archetypes

Suggested reusable archetypes:

```text
AUNTIE
TOURIST
DEGEN
HI_SO
DJ
OFFICE_WORKER
FITNESS
FOODIE
BUILDER
INFLUENCER
MYSTERIOUS
NIGHTLIFE
STUDENT
EXPAT
UNCLE
```

These are writing aids, not game classes.

---

# 5. Dialogue Triggers

NPC comments should be driven by actual game events.

Core triggers:

```text
ON_PICKUP
ON_DESTINATION_REVEAL
ON_DRIVING
ON_SHORT_STALL
ON_MEDIUM_STALL
ON_LONG_STALL
ON_EXTREME_STALL
ON_REFUEL
ON_COMPLETE
ON_AIRPORT
ON_EVENT_DESTINATION
ON_RESCUE
```

For MVP, only use:

```text
ON_PICKUP
ON_STALL
ON_COMPLETE
```

---

# 6. Stall Timing Buckets

Suggested flavor buckets:

```text
SHORT_STALL      < 5 min
MEDIUM_STALL     5–30 min
LONG_STALL       30–180 min
EXTREME_STALL    3h+
ABSURD_STALL     24h+
```

Gameplay penalty may cap earlier.

Dialogue does not need to cap.

---

# 7. Writing Rules

Every NPC should be:

- readable in one glance,
- funny without requiring lore,
- distinct from the others,
- reusable across many pickup/destination combinations.

Avoid:
- long monologues,
- too many crypto jokes,
- every NPC sounding sarcastic,
- dialogue that requires exact real-world knowledge.

A good line is usually:

```text
3–12 words
```

---

# 8. NPC #1 — Auntie Lek

**Archetype:** AUNTIE  
**Vibe:** Retired teacher / neighborhood authority  
**Avatar direction:** Older Thai woman, practical blouse, tote bag, unimpressed expression.

**One-line bio:**  
Retired teacher. Knows every shortcut and tells you when you're wrong.

**Preferred zones:**  
Yaowarat, Old Town, Lumpini, Silom.

**Preferred locations:**  
market, food, park, clinic, temple-adjacent, transit.

### Pickup
- "You took long enough."
- "Don't take Sukhumvit."

### Driving
- "Turn here."
- "I know a faster way."

### Short stall
- "Why did you not get gas first?"
- "I knew this would happen."

### Long stall
- "I could have walked."
- "Do you want me to drive?"

### Extreme stall
- "I live here now."
- "My plants are probably dead."

### Clean completion
- "Fine. You did well."
- "Not bad."

### Bad completion
- "Next time I take the train."
- "One star. Maybe two."

### Airport
- "Wrong airport and I will know."

---

# 9. NPC #2 — Dave

**Archetype:** TOURIST  
**Vibe:** Friendly backpacker disaster  
**Avatar direction:** Sunburned tourist, tank top, backpack, confused smile.

**One-line bio:**  
First time in Thailand. Already sunburned.

**Preferred zones:**  
Khao San, Old Town, Siam, airports.

**Preferred locations:**  
hostel, tourism, street food, nightlife.

### Pickup
- "Hey! You're my ride, right?"
- "Sorry, I think I'm on the wrong street."

### Driving
- "This city is insane."
- "Is that normal?"

### Short stall
- "Uh... are we moving?"
- "Traffic?"

### Long stall
- "My flight is getting close."
- "Should I call someone?"

### Extreme stall
- "My flight left yesterday."
- "I've extended my visa."

### Clean completion
- "Legend. Five stars."
- "That was awesome."

### Bad completion
- "I learned a lot about patience."
- "Interesting transportation experience."

### Airport
- "My flight's in forty minutes."

---

# 10. NPC #3 — Ploy

**Archetype:** OFFICE_WORKER / HI_SO  
**Vibe:** PR manager with no available time  
**Avatar direction:** Stylish office worker, three phones, iced coffee.

**One-line bio:**  
PR manager. Has three phones and no patience.

**Preferred zones:**  
Siam, Silom, Sathorn, Thonglor.

**Preferred locations:**  
office, cafe, clinic, nightlife, event.

### Pickup
- "I'm already late."
- "Please tell me you're close."

### Driving
- "Can we go faster?"
- "I have another call in ten."

### Short stall
- "Seriously?"
- "Why are we stopped?"

### Long stall
- "This is becoming a crisis."
- "I'm booking another driver."

### Extreme stall
- "The event ended."
- "My campaign launched without me."

### Clean completion
- "Fast. Efficient. Thank you."
- "Saved my life."

### Bad completion
- "Absolutely not."
- "I will be discussing this internally."

### Crypto event
- "I need to be at the meetup before photos."

---

# 11. NPC #4 — P'Bank

**Archetype:** DJ / NIGHTLIFE  
**Vibe:** DJ, promoter, possibly still awake from yesterday  
**Avatar direction:** Black T-shirt, headphones, one missing shoe.

**One-line bio:**  
DJ. Somehow missing one shoe.

**Preferred zones:**  
Thonglor, Ekkamai, Charoen Krung, Silom.

**Preferred locations:**  
club, music, bar, warehouse, event.

### Pickup
- "Bro. Thank god."
- "Do you know Basement 404?"

### Driving
- "Can you turn this up?"
- "We're making good time."

### Short stall
- "No gas? That's crazy."
- "It's fine, it's fine."

### Long stall
- "Soundcheck was twenty minutes ago."
- "I'm going to miss my own set."

### Extreme stall
- "They replaced me."
- "Honestly, afterparty?"

### Clean completion
- "Perfect. Come to the show."
- "Five stars, bro."

### Bad completion
- "Set was gone by the time I arrived."
- "Driver killed the vibe."

---

# 12. NPC #5 — Crypto Bro

**Archetype:** DEGEN  
**Vibe:** In Bangkok for "business"  
**Avatar direction:** Hoodie despite heat, hardware wallet lanyard, energy drink.

**One-line bio:**  
Here for "business." Nobody knows what business.

**Preferred zones:**  
Thonglor, Silom, Based Studio, Siam.

**Preferred locations:**  
crypto, coworking, nightlife, cafe, event.

### Pickup
- "Let's cook."
- "Need to make this meetup."

### Driving
- "Bullish route."
- "This shortcut has alpha."

### Short stall
- "Liquidity issue?"
- "Temporary drawdown."

### Long stall
- "Driver rugged me."
- "Still holding."

### Extreme stall
- "I have become the bag."
- "This ride has no exit liquidity."

### Clean completion
- "Absolute alpha."
- "Five stars. Conviction."

### Bad completion
- "Would not bridge again."
- "Exit liquidity experience."

### DFlow / hackathon
- "My demo still works locally."

---

# 13. NPC #6 — Mint

**Archetype:** HI_SO / NIGHTLIFE  
**Vibe:** Socialite who says she's going home early  
**Avatar direction:** Stylish nightlife look, tiny handbag, sunglasses at night.

**One-line bio:**  
Always going home early. Never goes home early.

**Preferred zones:**  
Thonglor, Siam, Silom.

**Preferred locations:**  
bar, omakase, clinic, club, cafe.

### Pickup
- "Don't tell my friends I'm leaving."
- "Can we go before they see me?"

### Driving
- "Actually... one more stop."
- "This is fine."

### Short stall
- "No."
- "You cannot be serious."

### Long stall
- "I should have stayed at the bar."
- "My friends are posting without me."

### Extreme stall
- "It's morning."
- "I have brunch now."

### Clean completion
- "Cute ride."
- "Five stars."

### Bad completion
- "This is why I use Grab."
- "Never again."

---

# 14. NPC #7 — Uncle Somchai

**Archetype:** UNCLE  
**Vibe:** Friendly older man who knows everyone  
**Avatar direction:** Polo shirt, sandals, newspaper or plastic bag.

**One-line bio:**  
Knows a guy everywhere you go.

**Preferred zones:**  
Yaowarat, Chatuchak, Ari, Silom.

**Preferred locations:**  
market, food, park, transit, neighborhood shops.

### Pickup
- "Ah, there you are."
- "No rush."

### Driving
- "My friend owns that shop."
- "You hungry?"

### Short stall
- "Engine problem?"
- "Happens."

### Long stall
- "I know a mechanic."
- "Should I call my cousin?"

### Extreme stall
- "My cousin is coming."
- "We could have fixed this yesterday."

### Clean completion
- "Good driver."
- "Very good."

### Bad completion
- "You need maintenance."
- "I have a mechanic for you."

---

# 15. NPC #8 — Beam

**Archetype:** BUILDER  
**Vibe:** Hackathon participant running on caffeine  
**Avatar direction:** Laptop bag, event wristband, tired eyes.

**One-line bio:**  
Builder. Has not slept since deployment started.

**Preferred zones:**  
Based Studio, Siam, Silom, Thonglor.

**Preferred locations:**  
coworking, crypto events, cafe, convenience store.

### Pickup
- "Demo day. Go."
- "Please don't ask if it's finished."

### Driving
- "I can fix one more bug."
- "Hotspot still works."

### Short stall
- "This feels on brand."
- "Okay. I can code here."

### Long stall
- "I've shipped two fixes."
- "Demo started without me."

### Extreme stall
- "Hackathon ended."
- "We won something?"

### Clean completion
- "You saved the demo."
- "Shipping."

### Bad completion
- "At least I fixed the bug."
- "It still worked locally."

---

# 16. NPC #9 — Mali

**Archetype:** FOODIE / AUNTIE  
**Vibe:** Food obsessive with strong opinions  
**Avatar direction:** Casual local, food bag, determined expression.

**One-line bio:**  
Will cross Bangkok for one specific bowl of noodles.

**Preferred zones:**  
Yaowarat, Ari, Old Town, Chatuchak.

**Preferred locations:**  
food, market, cafe.

### Pickup
- "They're going to sell out."
- "Drive."

### Driving
- "Not that shop. The good one."
- "Worth the trip."

### Stall
- "The noodles are gone."
- "This is devastating."

### Clean completion
- "We made it!"
- "You eat yet?"

### Bad completion
- "Sold out."
- "One star."

---

# 17. NPC #10 — Ken

**Archetype:** FITNESS  
**Vibe:** Gym guy / amateur Muay Thai obsessive  
**Avatar direction:** Gym bag, hand wraps, athletic wear.

**One-line bio:**  
Has been training Muay Thai for six weeks and mentions it constantly.

**Preferred zones:**  
Lumpini, Silom, Sukhumvit.

**Preferred locations:**  
muay_thai, gym, park, cafe.

### Pickup
- "Training starts in ten."
- "Coach is going to kill me."

### Driving
- "Cardio day anyway."
- "I should've run."

### Stall
- "I literally could have jogged."
- "This is not zone two."

### Clean completion
- "Perfect timing."
- "Let's go."

### Bad completion
- "Burpees because of you."
- "Coach was furious."

---

# 18. Recommended MVP NPC Set

For the first playable build, use only:

```text
Auntie Lek
Dave
Ploy
P'Bank
Crypto Bro
```

Why these five:

- immediately distinct,
- cover different Bangkok contexts,
- work with airports,
- work with nightlife,
- work with crypto Easter eggs,
- produce clearly different stall jokes.

If there is time, add:

```text
Mint
Beam
Uncle Somchai
```

---

# 19. Expansion Plan to 30

Do not write the final 20 personas until the game loop works.

Suggested future character slots:

```text
11. Korean beauty tourist
12. Thai university student
13. Startup founder
14. Muay Thai fighter
15. Food delivery rider off-duty
16. Fortune teller
17. Wedding guest
18. Lost conference speaker
19. Luxury-shopping auntie
20. Plant collector
21. Night-shift nurse
22. Photographer
23. Indie musician
24. Tech recruiter
25. Retired expat
26. Crypto whale
27. Meme coin founder
28. Padel obsessive
29. Temple volunteer
30. Extremely mysterious businessman
```

Each should be evaluated for:
- distinct voice,
- location fit,
- comedic potential.

---

# 20. NPC Review System — Future

Completed fares can generate public reviews.

Review inputs:

```text
npcId
stallDuration
tripDistance
destinationCategory
fareCompleted
rescueStatus
```

Example deterministic mapping:

```text
no stall → good pool
short stall → mixed pool
long stall → bad pool
extreme stall → extreme pool
```

Personality then determines wording.

---

# 21. Global Feed Use

NPC dialogue can later populate the shared feed.

Example:

```text
👵 Auntie Lek → saga.sol ⭐
"I could have walked."
Yaowarat → Airport
```

Or live stall commentary:

```text
👨 Dave
"Is this part of the tour?"
Stranded with 0x82...91 for 12m
```

The social feed is generated from NPC/game events.

Players do not need to write posts.

---

# 22. Character Location Preferences

Post-MVP, each NPC can carry weights.

Example:

```text
Auntie Lek:
Yaowarat 3
Old Town 3
Lumpini 2
Thonglor 0.5
```

This makes recurring characters feel geographically coherent while preserving unusual combinations.

Rare weird combinations are desirable.

Example:

```text
Auntie Lek → Basement 404
```

should be uncommon, not impossible.

---

# 23. Destination Comedy Rule

NPC + destination combinations should occasionally create the joke.

Examples:

```text
Crypto Bro
Face Factory → Superteam meetup
"Don't mention the bandages."
```

```text
Dave
Khao San → Airport
"My flight leaves in 38 minutes."
```

```text
Auntie Lek
Yaowarat → Basement 404
"Don't ask questions. Drive."
```

Avoid fully scripting every combination.

Let the system produce accidental stories.

---

# 24. Avatar Art Direction Stub

Each NPC portrait should:

- read clearly at small mobile-map size,
- have strong silhouette/color separation,
- show personality immediately,
- work as a circular or rounded portrait marker.

Recommended deliverables later:

```text
1 portrait per NPC
optional 2nd expression for stall
```

Do not create full-body animation for passengers.

---

# 25. MVP Acceptance Criteria

NPC system is sufficient for MVP when:

- [ ] At least 5 NPC definitions exist.
- [ ] Each has distinct bio/personality.
- [ ] NPC can spawn as fare.
- [ ] NPC has pickup dialogue.
- [ ] NPC has stall dialogue.
- [ ] NPC has completion dialogue.
- [ ] Dialogue is selected from event context.
- [ ] Destination remains mechanically independent of persona.
- [ ] Same NPC can recur without breaking state.

---

# 26. Content Expansion Rule

Before adding an NPC, ask:

> If this character stalls for 20 minutes, will their reaction be recognizably different from the existing cast?

If not, the persona is probably redundant.

---

# 27. Final Character Tone

Crazy Tuk's passengers should feel like:

> **a recurring cast of Bangkok weirdos, locals, tourists, builders, aunties, nightlife people, and crypto degenerates who happen to be trapped inside the consequences of your DFlow swaps.**

They are not the game mechanic.

They are what makes the mechanic memorable.
