# Crazy Tuk — 1-Day Hackathon MVP Planning Document

## 0. Goal

Build the smallest convincing version of **Crazy Tuk** that proves the DFlow hackathon thesis:

> **The swap ends. Crazy Tuk begins.**

A player makes a real DFlow-powered Solana swap. That confirmed swap is interpreted by Crazy Tuk as game fuel and, when eligible, a passenger fare. The player's persistent tuk-tuk then moves through Bangkok, completes or stalls on the fare, earns points, and generates funny NPC commentary.

This document is the **master build plan**. Detailed design-heavy areas are intentionally stubbed and should live in separate docs so implementation context stays small.

---

# 1. MVP Thesis

Crazy Tuk is an asynchronous, persistent Bangkok tuk-tuk game layered on top of DFlow swaps.

Core loop:

1. Connect Solana wallet.
2. Player receives a persistent tuk-tuk, random starting location, and starting fuel.
3. Available NPC fares appear around Bangkok.
4. Each NPC has a pickup location, expiry timer, points value, and swap condition.
5. Player either:
   - selects a fare first and makes a qualifying swap, or
   - makes a normal swap and Crazy Tuk automatically matches the best qualifying fare.
6. DFlow executes the swap.
7. **Only after the swap confirms successfully**, Crazy Tuk:
   - awards fuel,
   - assigns/continues the fare,
   - moves the tuk-tuk.
8. If the player runs out of fuel mid-trip, the fare stalls.
9. Another DFlow swap refuels the tuk-tuk and resumes the active trip.
10. Completed fares award points and generate an NPC review/comment.
11. Global leaderboard + asynchronous NPC activity feed create the multiplayer/social layer.

No real-time shared world is required for MVP.

---

# 2. What We Are Building in One Day

## Must Work

### DFlow
- Connect Solana wallet.
- Token input/output selection.
- Amount entry.
- DFlow `/order` request through backend proxy.
- User signs transaction.
- Submit + confirm transaction.
- Successful confirmation triggers Crazy Tuk game event.

### Game
- Persistent player state keyed by wallet.
- Random starting location.
- Starting fuel.
- 5–8 generated available fares per player.
- Fare conditions.
- Manual fare selection.
- Automatic fare matching after an unselected swap.
- Swap → fuel calculation.
- Pickup → destination reveal.
- Fuel cost for travel.
- Fare completion.
- Stall state.
- New swap while stalled → refuel + resume.
- Excess fuel carries forward.
- Points.
- Basic leaderboard.

### Map
- MapLibre proof-of-concept.
- Bangkok bounded play area.
- Custom game markers.
- Player tuk-tuk marker.
- Pickup markers.
- Destination marker.
- Simple route line.
- Simple movement animation.

### UI
- Existing loading scene.
- Existing "save to home screen" interstitial.
- Start screen.
- Wallet connect.
- Map/game screen.
- Swap screen/sheet.
- Fare detail modal.
- Destination reveal modal.
- Stall modal/state.
- Fare complete modal.
- Leaderboard.

---

# 3. Explicitly NOT Required for Day-One MVP

Do not spend time on these until the core loop works:

- Player profile / Uber-style rating page.
- 30 fully authored NPC personas.
- 50 fully researched Bangkok locations.
- Global NPC social feed.
- Rescue fares.
- Ghost tuk-tuks.
- Historical route replay.
- Temporary real-world Solana event overlays.
- Sponsored/gasless DFlow swaps.
- Platform fee activation.
- Full token universe.
- Advanced routing settings.
- Full custom MapLibre visual style.
- Real road/pathfinding accuracy.
- Real-time multiplayer.
- NPC AI / LLM dialogue.
- Item customization.
- Tuk-tuk upgrades.
- Prize pools.
- Charity integrations.

These are planned, not forgotten.

---

# 4. Recommended Documentation Split

Keep implementation prompts small. Do not dump all content into one giant spec.

## Doc A — `CRAZY_TUK_MVP_PLAN.md`
**This document.**

Contains:
- product thesis,
- MVP scope,
- state machine,
- DFlow integration,
- minimal data model,
- scenes,
- one-day phases,
- acceptance criteria.

This is the main implementation reference.

---

## Doc B — `CRAZY_TUK_GAME_RULES.md`
Create after the first playable loop works.

Detailed mechanics:
- fuel curve,
- starting fuel,
- distance/fuel formula,
- fare point values,
- fare rarity,
- fare expiry,
- auto-match rules,
- stall timing,
- rating penalty cap,
- rescue rules,
- balancing constants.

For Day 1, use placeholder constants inside config.

---

## Doc C — `CRAZY_TUK_WORLD.md`
Stub now; populate later.

Contains:
- Bangkok zones,
- 50 locations,
- exact coordinates,
- location categories,
- real vs fictional locations,
- Solana/Superteam Thailand event history,
- event overlays,
- pickup/destination restrictions.

For MVP, only use **8–12 temporary locations**.

---

## Doc D — `CRAZY_TUK_NPCS.md`
Stub now; populate later.

Contains 30 personas:
- name,
- avatar description,
- one-line bio,
- personality archetype,
- preferred zones,
- pickup lines,
- drive lines,
- stall comments,
- long-stall comments,
- good/bad reviews,
- rescue comments.

For MVP, use **5 placeholder NPCs**.

---

## Doc E — `CRAZY_TUK_UI_ART.md`
Create once the loop is functional.

Contains:
- screen layout,
- mobile/desktop behavior,
- art direction,
- MapLibre styling,
- map markers,
- tuk-tuk sprite requirements,
- NPC portrait requirements,
- UI asset checklist,
- motion/transition direction.

---

## Doc F — `CRAZY_TUK_DFLOW.md`
Optional standalone technical reference.

Contains:
- endpoint details,
- backend proxy,
- wallet transaction flow,
- token metadata,
- fee support,
- quote/order mapping,
- transaction confirmation,
- game-event validation.

For Day 1, the DFlow section in this master doc is enough.

---

# 5. Core Game State Machine

Keep this tiny.

```text
NEW PLAYER
    ↓
AVAILABLE
    ↓
qualifying confirmed swap
    ↓
PICKUP
    ↓
PASSENGER ONBOARD
    ↓
DRIVING
   ↙   ↘
STALL   COMPLETE
  ↓        ↓
confirmed  AVAILABLE
swap
  ↓
DRIVING
```

### AVAILABLE
Player has no active passenger.

A confirmed swap:
- awards fuel,
- checks selected fare first,
- otherwise auto-matches a qualifying available fare.

### PICKUP
Player is traveling from current location to passenger pickup.

For MVP, this can happen quickly as a short animation.

### DRIVING
Passenger is onboard and destination has been revealed.

Fuel is reserved/consumed against the journey requirement.

### STALLED
Player has insufficient fuel to finish the active trip.

Store:
- active fare,
- progress,
- fuel deficit,
- `stalledAt`.

Next confirmed swap:
- adds fuel,
- consumes enough to continue/finish,
- keeps any excess.

### COMPLETE
Award points.
Create completion record.
Return player to destination in AVAILABLE state.

---

# 6. Swap Interpretation Logic

Every successful DFlow swap creates a Crazy Tuk event.

Input:

```text
wallet
inputMint
outputMint
inputAmount
estimatedUsdValue
confirmedSignature
timestamp
```

Crazy Tuk calculates:

```text
fuelEarned = fuelCurve(estimatedUsdValue)
```

Then checks player state.

## If AVAILABLE
1. Add fuel.
2. If a fare was selected:
   - test whether swap qualifies.
3. Otherwise:
   - find all current qualifying fares,
   - choose the best eligible fare.
4. If none qualify:
   - player simply keeps the fuel.

## If PICKUP / DRIVING / STALLED
1. Add fuel.
2. Do not assign another passenger.
3. Apply fuel to current active journey.
4. If enough fuel now exists:
   - continue or complete journey.
5. Carry excess fuel forward.

This is the main function:

```text
interpretConfirmedSwap(player, swap)
```

Do not spread this logic throughout the UI.

---

# 7. Fare Conditions — MVP

Use only a few categories.

```text
ANY_SWAP
SOL_PAIR
STABLE_TO_STABLE
STABLE_TO_VOLATILE
VOLATILE_TO_STABLE
MIN_USD
```

Examples:

```text
Any pair — min $1
SOL pair — min $1
Stable → Stable — min $5
Stable → Volatile — min $5
Volatile → Stable — min $5
Any swap — min $25
```

Do not implement exact-token missions unless trivial.

---

# 8. Automatic Fare Matching

If player did not select an NPC before swapping:

1. Filter active fares whose requirement matches the confirmed swap.
2. Filter fares player can reach with current fuel after fuel award.
3. Rank:
   - highest point value first,
   - then shortest time remaining.
4. Assign top candidate.
5. If none match, award fuel only.

For MVP, this rule is enough.

---

# 9. Fuel — Day-One Placeholder

Do not over-balance yet.

Use a configurable curve.

Example temporary values:

```text
$1–$4.99    → 3 fuel
$5–$9.99    → 5 fuel
$10–$24.99  → 8 fuel
$25–$49.99  → 12 fuel
$50+         → 16 fuel
```

This can later become logarithmic.

Important:
- fuel is awarded only after confirmed successful swap,
- failed/cancelled swaps award nothing,
- excess fuel persists,
- maximum fuel cap can be introduced later.

---

# 10. Geography — MVP

## Map Engine
**MapLibre GL JS**

MapLibre provides:
- real Bangkok geography,
- pan/zoom,
- coordinates,
- markers,
- route line rendering,
- custom styling.

Crazy Tuk owns:
- NPC markers,
- tuk-tuk marker,
- routes,
- dialogue,
- game data.

## MVP Area
Use a limited central Bangkok bounding area plus airport if needed.

Suggested temporary locations:

1. Yaowarat
2. Khao San
3. Siam
4. Silom
5. Sathorn
6. Lumpini
7. Asok
8. Thonglor
9. Ari
10. Chatuchak
11. Based Studio / hackathon-related placeholder
12. Suvarnabhumi Airport

These are placeholders until `CRAZY_TUK_WORLD.md`.

## Routes
For Day 1:
- use straight or simple curved polylines,
- derive travel cost from coordinate distance or manual table,
- do not implement road routing.

---

# 11. NPCs — MVP

Use 5 placeholders first.

Example:

### Auntie Lek
Bio: Retired teacher. Knows every shortcut and tells you when you're wrong.

### Dave
Bio: First time in Thailand. Already sunburned.

### Ploy
Bio: PR manager. Has three phones and no patience.

### Bank
Bio: DJ. Somehow missing one shoe.

### Crypto Bro
Bio: Here for "business." Nobody knows what business.

Each only needs:
- name,
- emoji/avatar placeholder,
- bio,
- 2 pickup lines,
- 2 stall lines,
- 2 completion reviews.

Do not author all 30 before gameplay works.

---

# 12. Passenger Spawn System — MVP

Per player, maintain approximately 5–8 available fares.

Each spawn has:

```text
id
npcId
pickupLocationId
destinationLocationId (hidden until claimed)
fareCondition
minimumUsd
pointValue
expiresAt
```

Rules:
- destination hidden until fare claimed,
- ensure at least one cheap/simple fare is usually available,
- expired fare is replaced,
- selected fare does not become active until qualifying swap confirms.

For Day 1, spawning can happen:
- when game loads,
- when fare expires,
- when fare is completed.

No complex scheduler required initially.

---

# 13. DFlow Integration — Minimal Version

## Required
Use DFlow Spot Trading API `/order`.

Frontend sends to own backend:

```text
inputMint
outputMint
amount
userPublicKey
```

Backend proxies request to DFlow.

DFlow returns:
- quote information,
- serialized transaction when wallet supplied.

Frontend:
1. Deserialize transaction.
2. Request wallet signature.
3. Submit to Solana.
4. Wait for confirmation.
5. Verify success.
6. Send confirmed swap metadata into `interpretConfirmedSwap`.

## Do Not Build Yet
- WebSockets
- order books
- `/quote` + `/swap` split flow
- intent trading
- sponsored swaps
- destination wallets
- route controls
- advanced slippage controls

Use DFlow defaults wherever reasonable.

---

# 14. Token Support — MVP

Start with a curated list.

Suggested:
- SOL
- USDC
- USDT
- BONK
- JUP
- PENGU

Optional extras if already easy.

Each token metadata record:

```text
mint
symbol
name
decimals
icon
category: stable | volatile
```

This is enough for fare classification.

---

# 15. Wallet

Use the simplest Solana wallet connection that works reliably with the existing shell.

Decision order:

1. Reuse existing Privy integration if already functional and Solana signing works cleanly.
2. Otherwise use standard Solana wallet adapter / wallet connect flow.

Do not rebuild authentication unnecessarily.

Player ID:

```text
wallet public key
```

---

# 16. Persistence / Database

Keep storage minimal.

## Player

```text
wallet
currentLocationId
fuel
status
points
completedFares
stallCount
activeFareId
createdAt
updatedAt
```

## Fare

```text
id
playerWallet
npcId
pickupLocationId
destinationLocationId
condition
minimumUsd
points
expiresAt
status
```

## Active Trip

```text
fareId
startedAt
pickupReachedAt
journeyFuelCost
fuelSpent
stallStartedAt
completedAt
```

## Swap Event

```text
signature
wallet
inputMint
outputMint
usdValue
fuelAwarded
timestamp
processed
```

The `signature` must be unique so the same swap cannot award fuel twice.

---

# 17. Scenes / Pages

## Existing / Reuse

### Loading
Branding + initialize app.

### Home-Screen Interstitial
Keep skippable.

### Start
- Start Driving
- How to Play
- Leaderboard
- Connect Wallet if needed

---

## Core Gameplay

### Map
Primary home screen.

Display:
- MapLibre map,
- own tuk-tuk,
- available NPCs,
- current route,
- active passenger,
- fuel,
- points,
- wallet status.

### Swap
Can be a page or large sheet.

Display:
- Pay token,
- receive token,
- amount,
- quote,
- estimated fuel,
- selected/qualifying fare information,
- Swap & Drive.

### Leaderboard
Rank by points.

---

# 18. Required Modals / Sheets

## Wallet Connect
Triggered when authenticated action is attempted.

## NPC Detail
- name,
- bio,
- pickup,
- expiry,
- condition,
- points,
- Select Fare.

## Destination Reveal
After pickup:
- destination,
- required fuel,
- current fuel,
- warning if likely to stall.

## Swap Confirmation / Waiting
- wallet signing,
- transaction pending.

## Swap Success
- fuel awarded,
- fare assigned or trip resumed.

## Stall
- remaining fuel requirement,
- stall duration,
- NPC comment,
- Swap to Refuel.

## Fare Complete
- points,
- remaining fuel,
- NPC review placeholder.

---

# 19. How to Play — MVP Copy Structure

### 1. Swap
Make a DFlow-powered token swap.

Every confirmed swap gives your tuk-tuk fuel.

### 2. Pick Up
Some swaps qualify for passengers around Bangkok.

Choose a fare or let Crazy Tuk assign one automatically.

### 3. Don't Run Out
Deliver passengers for points.

Run out of fuel and they'll wait — and complain.

---

# 20. Multiplayer — MVP Definition

No real-time shared map.

Multiplayer consists of:

- common leaderboard,
- later global NPC activity feed,
- persistent wallet-linked driver states,
- later rescue system,
- possible historical ghost vehicles.

For Day 1:
**Leaderboard is enough.**

---

# 21. Social Feed — Stub

Create after core loop.

Events may include:

```text
fare_completed
player_stalled
player_refueled
long_stall
npc_review
leaderboard_move
rescue_requested
rescue_completed
```

NPC comments are public.

Player chat does not exist.

Detailed design belongs in separate doc.

---

# 22. Driver Profiles — Stub

Do not implement before core works.

Future profile:

```text
wallet / display name
rating
completed fares
points
stalls
longest stall
total stranded time
rescues
NPC reviews
```

Rating may be based primarily on capped stall penalties.

Actual historical stall duration remains uncapped for humor/statistics.

---

# 23. Rescue — Stub

Post-MVP.

After sufficiently long stall:
- passenger may become abandoned,
- global rescue fare can be created,
- rescue has newly generated swap condition,
- another player can satisfy it,
- fare transfers asynchronously into rescuer's run,
- original driver receives abandonment record.

Do not implement Day 1.

---

# 24. UI Priority

Build functionality in this order:

1. Existing shell loads.
2. Wallet connects.
3. MapLibre renders.
4. Player marker renders.
5. Static NPC marker renders.
6. DFlow swap completes.
7. Confirmed swap awards fuel.
8. Fare qualifies.
9. Tuk-tuk animates pickup → destination.
10. Stall/resume works.
11. Points update.
12. Leaderboard works.
13. Visual polish.
14. Additional content.

Do not create polished menus before Step 9.

---

# 25. One-Day Build Plan

## Phase 0 — 30–45 min
### Freeze scope

Create:
- `config.ts`
- placeholder tokens,
- 5 NPCs,
- 10–12 locations,
- placeholder fuel curve,
- placeholder fare conditions.

Confirm existing mobile shell still runs.

**Exit condition:** app boots with existing scenes.

---

## Phase 1 — 60–90 min
### DFlow vertical slice

Build:
- wallet connect,
- backend `/api/dflow/order`,
- basic token selector,
- amount field,
- quote,
- sign,
- submit,
- confirmation.

No game yet.

**Exit condition:** real SOL swap succeeds from Crazy Tuk UI.

This is the highest-risk dependency. Do it first.

---

## Phase 2 — 45–60 min
### Game-state skeleton

Build:
- player record,
- starting location,
- starting fuel,
- status enum,
- points,
- unique swap-event processing.

Implement:

```text
interpretConfirmedSwap()
```

For now:
confirmed swap → +fuel.

**Exit condition:** real DFlow swap changes persistent Crazy Tuk fuel exactly once.

---

## Phase 3 — 60 min
### MapLibre prototype

Build:
- Bangkok map,
- limited bounds,
- player marker,
- 5–10 game locations,
- NPC markers,
- basic mobile interaction.

Use default/simple map style initially.

**Exit condition:** player can tap an NPC and inspect fare information.

If MapLibre blocks progress, immediately fall back to a static 2D background with fixed coordinates.

---

## Phase 4 — 60–90 min
### Fare loop

Build:
- fare generation,
- fare selection,
- condition matcher,
- auto-match,
- destination reveal,
- travel fuel cost,
- simple movement animation,
- point reward.

**Exit condition:**

```text
select passenger
→ make real qualifying DFlow swap
→ fuel awarded
→ passenger claimed
→ tuk-tuk travels
→ fare completes
→ points awarded
```

At this moment we have the hackathon MVP.

---

## Phase 5 — 45–60 min
### Stall loop

Build:
- allow trip with insufficient fuel,
- calculate stall progress,
- store `stalledAt`,
- show stall state,
- another confirmed swap resumes trip,
- excess fuel carries over,
- completion after refuel.

**Exit condition:**

```text
qualifying swap
→ risky fare
→ stall
→ second real swap
→ resume
→ complete
```

This is the strongest demo.

---

## Phase 6 — 30–45 min
### Leaderboard

Build:
- rank by points,
- abbreviated wallet,
- fares completed.

Seed test players if needed.

**Exit condition:** completed fare updates rank.

---

## Phase 7 — Remaining Time
### Polish only

Priority:
1. confirmation transition,
2. tuk-tuk movement,
3. destination reveal,
4. stalled presentation,
5. funny NPC comments,
6. DFlow branding,
7. map styling,
8. responsive cleanup.

Then, only if core is stable:
- global feed,
- profile,
- more NPCs,
- more locations.

---

# 26. Demo Script We Are Building Toward

The MVP should support this exact demo.

1. Open Crazy Tuk.
2. Connect wallet.
3. Spawn in Yaowarat with limited fuel.
4. Show several available NPCs.
5. Select Dave:
   - cheap SOL-pair condition,
   - nearby pickup,
   - destination hidden.
6. Open Swap.
7. Execute a small real DFlow SOL pair.
8. Transaction confirms.
9. `+ fuel`.
10. Tuk-tuk drives to Dave.
11. Dave enters.
12. Destination reveals: **Suvarnabhumi Airport**.
13. Current fuel is insufficient.
14. Tuk-tuk travels partway.
15. **STALLED.**
16. Dave complains.
17. Make second DFlow swap.
18. Fuel arrives.
19. Tuk-tuk resumes and finishes.
20. Points awarded.
21. Leaderboard updates.

This demonstrates the entire thesis with only two swaps.

---

# 27. Acceptance Criteria

The MVP is submission-worthy if all of the following are true:

- [ ] Mobile shell works.
- [ ] Solana wallet connects.
- [ ] A real DFlow swap can be completed.
- [ ] Transaction confirmation is validated.
- [ ] Confirmed swaps cannot be processed twice.
- [ ] Swap awards fuel.
- [ ] Player has persistent position and fuel.
- [ ] NPC fares appear.
- [ ] Fare requirements can match real swaps.
- [ ] Selected fare works.
- [ ] Automatic fare matching works.
- [ ] Destination is revealed after pickup.
- [ ] Tuk-tuk visibly travels.
- [ ] Insufficient fuel causes a stall.
- [ ] Second swap can resume stalled trip.
- [ ] Excess fuel carries forward.
- [ ] Completed fare awards points.
- [ ] Leaderboard reflects points.
- [ ] UI clearly says Powered by DFlow.
- [ ] The user can understand the loop without developer explanation.

Everything else is bonus.

---

# 28. Suggested Repo / Code Organization

Keep code shallow.

```text
/src
  /app
    /api/dflow/order
    /game
    /swap
    /leaderboard

  /components
    GameMap
    TukTukMarker
    NpcMarker
    FareSheet
    SwapPanel
    StallSheet
    FareCompleteSheet
    Hud

  /game
    config.ts
    types.ts
    fareMatcher.ts
    fuel.ts
    gameEngine.ts
    spawn.ts

  /dflow
    client.ts
    tokens.ts
    transaction.ts

  /data
    locations.stub.ts
    npcs.stub.ts
```

Avoid elaborate service layers until needed.

---

# 29. Configuration First

Put all tuning constants in one place.

```text
STARTING_FUEL
MIN_ACTIVE_FARES
MAX_ACTIVE_FARES
FARE_EXPIRY_MIN
FARE_EXPIRY_MAX
TRAVEL_FUEL_MULTIPLIER
STALL_RATING_PENALTY_CAP
AUTO_MATCH_MODE
FUEL_TIERS
```

This allows balancing without touching game logic.

---

# 30. Development Rule

For the one-day build:

> **Never implement content before the state transition that uses it exists.**

Examples:

Do not write 30 NPCs before one NPC can complete a fare.

Do not research 50 locations before two locations can animate a trip.

Do not design player profiles before points persist.

Do not build the social feed before a real fare completion emits an event.

Do not polish MapLibre before a real DFlow swap moves the tuk-tuk.

---

# 31. Post-MVP Expansion Order

Once submission loop is stable:

1. Global NPC feed.
2. 30 NPC personas.
3. 50 Bangkok locations.
4. Better map style.
5. Driver profiles and ratings.
6. Superteam Thailand / Solana Easter eggs.
7. Long-stall public comments.
8. Rescue fares.
9. Historical ghost tuk-tuks.
10. Route replay.
11. Platform fee.
12. Sponsored swaps.
13. Real-world prizes / event campaigns.

---

# 32. Final Product Sentence

> **Crazy Tuk turns ordinary DFlow swaps into fuel and fares for a persistent Bangkok tuk-tuk. Make the swap you actually want; when it confirms, the game begins.**

Short version:

> **Swap. Drive. Don't run out of gas.**
