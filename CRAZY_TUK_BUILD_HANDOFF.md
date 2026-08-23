# CRAZY TUK — BUILD HANDOFF

> **Purpose:** Coding-agent operating manual for the Crazy Tuk MVP.  
> **Goal:** Remove product/architecture ambiguity so the build LLM spends tokens implementing and debugging rather than re-deciding the system.  
> **Read with:** `CRAZY_TUK_MVP_PLAN.md`, `CRAZY_TUK_GAME_RULES.md`, `CRAZY_TUK_MAPLIBRE.md`, `CRAZY_TUK_DFLOW.md`.

---

# 0. Build Principle

The implementation agent should treat the product/design decisions in the planning docs as **already decided**.

Its job is:

```text
READ CONTRACT
    ↓
INSPECT CURRENT REPO
    ↓
IMPLEMENT SMALLEST COMPLETE SLICE
    ↓
TEST
    ↓
UPDATE PROJECT_STATE.md
    ↓
STOP
```

Do not spend build time re-architecting the product unless the existing repository makes a documented decision impossible.

---

# 1. Hard MVP Stack Decisions

Use the existing game-template philosophy.

```text
HTML
CSS
Vanilla JavaScript
MapLibre GL JS
Solana Kit / Wallet Standard-compatible wallet connection
DFlow Spot Trading API
requestAnimationFrame()
local CSS/keyframe animation
backend/edge API routes
```

## Do NOT introduce for MVP

- React
- Phaser
- Redux
- a UI framework
- Privy
- embedded wallets
- delegated signing
- live routing
- OSRM
- GraphHopper
- Valhalla
- live traffic
- weather
- multiplayer map sync
- advanced state libraries
- custom vector-tile infrastructure
- MapLibre forks
- new design systems

If the existing repository already uses one of these, adapt to the repository rather than blindly removing it.

---

# 2. Repository Rule

**Adapt the current template repo. Do not start from a blank MapLibre demo.**

Before major implementation:

1. inspect actual repo structure
2. compare it to the supplied template HTML
3. identify reusable:
   - PWA code
   - mobile viewport handling
   - start screen
   - settings
   - how-to-play screen
   - scene transitions
   - asset conventions
   - deployment/API route conventions
4. remove Bunkee-specific gameplay and branding
5. preserve working infrastructure unless there is a concrete reason to replace it

Do not rewrite working mobile/PWA/scene code merely to make it "cleaner."

---

# 3. Canonical Application State Machines

Keep state domains separate.

## App

```text
BOOT
START
MAP
```

## Wallet

```text
DISCONNECTED
CONNECTING
CONNECTED
ERROR
```

## Player

```text
AVAILABLE
PICKUP
DRIVING
STALLED
```

## Swap

```text
CLOSED
EDITING
LOADING_QUOTE
QUOTE_READY
QUOTE_ERROR
AWAITING_SIGNATURE
SUBMITTING
CONFIRMING
SUCCESS
ERROR
```

## Fare

```text
AVAILABLE
SELECTED
ACTIVE
COMPLETE
EXPIRED
```

Do not create combined mega-states such as:

```text
CONNECTED_STALLED_SWAP_QUOTE_READY
```

---

# 4. Canonical Player Object

Use this shape unless an implementation-specific field is genuinely required.

```js
player = {
  wallet: string,

  locationId: string,

  fuel: number,
  points: number,

  status:
    "AVAILABLE" |
    "PICKUP" |
    "DRIVING" |
    "STALLED",

  selectedFareId: string | null,
  activeFareId: string | null,

  routeProgress: number,

  completedFares: number,
  stallCount: number,

  createdAt: number,
  updatedAt: number
}
```

Rules:

- `wallet` is the MVP player ID.
- `routeProgress` is normalized `0..1`.
- `activeFareId` is never used for an unclaimed selected fare.
- `selectedFareId` and `activeFareId` may not refer to different active passengers.

---

# 5. Canonical Fare Object

```js
fare = {
  id: string,

  npcId: string,

  pickupLocationId: string,
  destinationLocationId: string,

  condition: {
    type:
      "ANY_SWAP" |
      "SOL_PAIR" |
      "STABLE_TO_STABLE" |
      "STABLE_TO_VOLATILE" |
      "VOLATILE_TO_STABLE" |
      "MIN_USD",

    minimumUsd: number
  },

  pointValue: number,

  expiresAt: number,

  status:
    "AVAILABLE" |
    "SELECTED" |
    "ACTIVE" |
    "COMPLETE" |
    "EXPIRED"
}
```

Important:

- destination exists internally
- destination is hidden in UI until pickup is reached
- selected fare is not active until a qualifying confirmed swap assigns it

---

# 6. Canonical Location Object

Keep location data intentionally small.

```js
location = {
  id: string,
  name: string,

  coordinates: [lng, lat],

  type: string,
  icon: string,

  startingLocation: boolean,
  farePickup: boolean,
  fareDestination: boolean
}
```

Do not add extensive world metadata during MVP unless a live feature uses it.

---

# 7. Canonical Route Object

All MVP movement uses predefined paths.

```js
route = {
  id: "siam__yaowarat",

  from: "siam",
  to: "yaowarat",

  durationMs: 9000,

  fuelCost: 8,

  coordinates: [
    [lng, lat],
    [lng, lat],
    [lng, lat]
  ],

  reversible: true
}
```

Rules:

- coordinates use `[longitude, latitude]`
- at least two coordinates
- route start should be near `from`
- route end should be near `to`
- `fuelCost` is explicit/configurable
- `durationMs` is game time, not real Bangkok travel time

---

# 8. Route Lookup Contract

Expose:

```js
getRoute(fromId, toId)
```

Lookup order:

```text
1. exact predefined route
2. reversible route if explicitly flagged
3. dev-only fallback if config permits
4. otherwise fail loudly
```

Config:

```js
ALLOW_ROUTE_FALLBACK = false
```

Development can temporarily set:

```js
ALLOW_ROUTE_FALLBACK = true
```

Fallback must not silently become the final game design.

No live routing API is allowed in MVP.

---

# 9. Predefined Route Philosophy

Routes are gameplay choreography, not navigation.

They may be authored to:

- pass interesting landmarks
- use readable paths
- make the map animation look good
- cross bridges
- avoid visually confusing sections
- produce good trip durations
- create intentional stall points

Do not optimize for real-world route accuracy.

---

# 10. Canonical Swap Event

Only a confirmed successful Solana transaction may produce this object.

```js
swapEvent = {
  signature: string,
  wallet: string,

  inputMint: string,
  outputMint: string,

  inputAmount: string | number,
  outputAmount: string | number,

  usdValue: number,

  confirmedAt: number
}
```

Treat this object as immutable after creation.

---

# 11. One Authoritative DFlow → Game Boundary

Only this function may turn a swap into gameplay:

```text
interpretConfirmedSwap(player, swapEvent)
```

Nothing else may directly award fuel, assign a fare, resume a trip, or alter points because of a swap.

The swap UI must never directly mutate game economy state.

---

# 12. Signature Idempotency Rule

Critical invariant:

```text
ONE SOLANA SIGNATURE
=
AT MOST ONE CRAZY TUK GAME EVENT
```

Server-side/persistent logic:

```text
signature already processed?
   ↙              ↘
 YES               NO
 ↓                  ↓
return prior/      verify +
no-op result       process
```

Duplicate processing must cause:

```text
0 new fuel
0 new fare assignment
0 trip mutation
0 points
```

Do not rely on browser memory or `localStorage` for this.

---

# 13. Wallet UX

The map is visible before wallet connection.

Unauthenticated users may:

- load the app
- view Bangkok
- pan/zoom
- see public NPC/world presentation

The first authenticated action triggers wallet connection.

Examples:

```text
tap/select fare
press SWAP
claim TukTuk
perform personal state action
```

Wallet copy should be framed as:

```text
GET YOUR TUK-TUK
```

rather than generic login.

On first connection:

```text
lookup player by wallet
→ create if missing
→ assign random eligible starting location
→ STARTING_FUEL
→ AVAILABLE
```

---

# 14. DFlow Swap Entry Contexts

There is one shared Swap Sheet with three contexts.

## Free Swap

```js
openSwap({
  context: "FREE_SWAP"
});
```

## Selected Fare

```js
openSwap({
  context: "SELECTED_FARE",
  fareId
});
```

## Stalled

```js
openSwap({
  context: "STALLED",
  activeFareId,
  fuelNeeded
});
```

Do not create three independent swap implementations.

---

# 15. DFlow Integration Contract

MVP uses:

```text
DFlow GET /order
```

through our backend/edge proxy.

Browser:

```text
input/output token
amount
wallet public key
slippage
        ↓
/api/dflow/order
```

Backend:

```text
validate
↓
call DFlow /order
↓
return quote + serialized transaction
```

Browser:

```text
deserialize
↓
wallet signs
↓
submit to Solana RPC
↓
wait for confirmation
↓
send confirmed signature to authoritative game endpoint
```

Never expose production DFlow credentials in browser JavaScript.

---

# 16. External Wallet Signing Rule

For MVP:

```text
EVERY SWAP REQUIRES EXPLICIT WALLET APPROVAL
```

Do not implement:

- auto-signing
- embedded wallets
- delegated signing
- background trades

Preserve current swap context while the user is in a wallet extension/app.

On mobile wallet return:

1. restore swap sheet context
2. determine signature/submission state
3. continue confirmation
4. refresh authoritative player state
5. call `map.resize()` if needed
6. never double-process the signature

---

# 17. DFlow Quote/Swap UI State

Use explicit state:

```text
CLOSED
EDITING
LOADING_QUOTE
QUOTE_READY
QUOTE_ERROR
AWAITING_SIGNATURE
SUBMITTING
CONFIRMING
SUCCESS
ERROR
```

Suggested user-facing copy:

## LOADING_QUOTE

```text
Finding your rate...
Powered by DFlow
```

## AWAITING_SIGNATURE

```text
CHECK YOUR WALLET
Approve the swap to keep driving.
```

## SUBMITTING

```text
SENDING SWAP...
```

## CONFIRMING

```text
WAITING FOR SOLANA...
```

## ERROR

```text
NO DEAL.
Your TukTuk hasn't moved.
```

---

# 18. Swap Sheet Content

At minimum:

```text
input token
input amount
wallet balance

output token
expected output

estimated fuel
fare qualification state, if relevant
stall deficit state, if relevant

minimum received
price impact
slippage

contextual CTA
Powered by DFlow
```

Contextual CTA:

```text
FREE_SWAP      → SWAP & DRIVE
SELECTED_FARE  → SWAP & PICK UP
STALLED        → SWAP TO REFUEL
```

Use the Crazy Tuk visual language, not a generic trading-terminal design.

---

# 19. Supported MVP Tokens

Initial list:

```text
SOL
USDC
USDT
BONK
JUP
PENGU
```

Canonical token metadata:

```js
token = {
  mint,
  symbol,
  name,
  decimals,
  icon,
  category: "stable" | "volatile"
}
```

DFlow adapter handles mint addresses and native SOL/WSOL details.

Game rules reason in token symbols/categories.

---

# 20. Fare Matching Must Be Pure

Expose one shared function:

```js
matchesFare(fare, swap)
```

Return:

```js
{
  qualifies: true,
  reasons: ["SOL_PAIR", "MIN_USD"]
}
```

or:

```js
{
  qualifies: false,
  reasons: ["REQUIRES_SOL_PAIR"]
}
```

This same function must power:

- pre-swap preview
- selected fare validation
- auto-match
- confirmed-swap processing

Do not duplicate matching logic in UI.

---

# 21. Auto-Match Algorithm

If `selectedFareId` exists:

```text
test selected fare only
```

Because:

```js
SELECTED_FARE_STRICT = true
```

If selected fare fails:

```text
award fuel if eligible
keep fare selected if unexpired
do not auto-match another fare
```

If no selected fare:

```text
candidates =
    active
    + unexpired
    + qualifying
    + pickup reachable after fuel award
```

Sort:

```text
1. pointValue DESC
2. expiresAt ASC
3. pickupFuelCost ASC
```

Take first.

No randomness in MVP auto-match.

---

# 22. Fuel Configuration

Centralize in config.

Suggested defaults:

```js
STARTING_FUEL = 20
MIN_GAME_SWAP_USD = 1

FUEL_TIERS = [
  { minUsd: 1,   maxUsd: 4.99,  fuel: 3 },
  { minUsd: 5,   maxUsd: 9.99,  fuel: 5 },
  { minUsd: 10,  maxUsd: 24.99, fuel: 8 },
  { minUsd: 25,  maxUsd: 49.99, fuel: 12 },
  { minUsd: 50,  maxUsd: 99.99, fuel: 16 },
  { minUsd: 100, maxUsd: Infinity, fuel: 20 }
]
```

No hard cap for MVP.

Unused fuel carries forward.

---

# 23. Minimum Game Swap Rule

A swap may execute through DFlow but still fail to qualify as a game action.

```js
MIN_GAME_SWAP_USD = 1
```

If:

```text
usdValue < 1
```

then:

```text
fuelAwarded = 0
fare qualification = false
```

UI should warn before signing.

---

# 24. Fuel Consumption Model

Fuel maps directly to route progress.

## Pickup

Pickup route consumes its configured pickup route fuel cost.

## Passenger trip

Fuel is consumed progressively along route distance.

If route requires:

```text
10 fuel
```

and player has:

```text
4 fuel
```

then player travels approximately:

```text
40%
```

and stalls.

This allows visible stalls at meaningful map positions.

---

# 25. Route Progress Math

For the remaining route:

```text
possibleProgress =
availableFuel / remainingFuelCost
```

Clamp:

```text
0..1
```

Then:

```text
remainingProgressDelta =
possibleProgress * remainingRouteProgress
```

If fuel is enough:

```text
routeProgress = 1
consume required fuel
complete trip
```

If not:

```text
advance proportionally
fuel = 0
status = STALLED
store progressAtStall
store remainingFuelRequired
```

Use distance-aware interpolation across route segments for visual movement.

---

# 26. Travel Animation Contract

Simulation decides target state first.

Animation visualizes it.

Canonical animation target:

```js
tripAnimation = {
  routeId,
  startProgress,
  endProgress,
  startedAt,
  durationMs
}
```

Do **not** make animation completion authoritative game logic.

Bad:

```text
animation finished
→ therefore fare completes
```

Correct:

```text
game state says fare completes
→ animate TukTuk to destination
→ display completion
```

This prevents backgrounding/interruption bugs.

---

# 27. Game Event Interface

Use:

```js
emitGameEvent(type, payload)
```

MVP event types:

```text
WALLET_CONNECTED

FARE_SELECTED
FARE_ASSIGNED

SWAP_CONFIRMED
FUEL_AWARDED

PICKUP_STARTED
PICKUP_REACHED

DESTINATION_REVEALED

TRIP_STARTED
PLAYER_STALLED
TRIP_RESUMED
FARE_COMPLETED
```

Future leaderboard/feed/profile features should consume these rather than wiring directly into unrelated modules.

---

# 28. Map Responsibilities

MapLibre is responsible only for:

```text
Bangkok rendering
game POI placement
NPC/fare markers
TukTuk marker
predefined route lines
camera control
map click interaction
```

Crazy Tuk code owns:

```text
game state
fare state
fuel
points
NPC logic
transaction logic
UI
effects
```

---

# 29. Map Layer Order

Recommended:

```text
TOP

player-tuktuk
selected/active NPC
destination
available fare markers
game POIs
route-completed
route-upcoming
base labels
major roads
minor roads
buildings
parks
water
background

BOTTOM
```

Selected/active objects get visual priority.

---

# 30. Map Camera Behavior

## AVAILABLE

Allow:

- pan
- zoom
- NPC selection

## Fare Selected

Fit:

```text
TukTuk
pickup
```

Destination remains hidden.

## PICKUP

Short movement sequence.

Restrict or ignore conflicting map interaction during the brief animation.

## DRIVING

Camera follows TukTuk.

If player manually pans away, allow it and expose:

```text
RECENTER
```

## STALLED

Hold camera on stopped TukTuk.

## COMPLETE

Briefly hold destination, then return to normal explore framing.

---

# 31. UI-Aware Map Camera

Any `fitBounds()` / camera movement must account for overlays.

Especially:

```text
fare sheet
swap sheet
stall sheet
HUD
```

Use camera padding so the relevant markers never sit behind a bottom sheet.

---

# 32. Portrait Layout Decision

Reuse the template behavior.

## Mobile

```text
full viewport
full-bleed game
bottom sheets
```

## Desktop

```text
centered portrait game frame
same interaction model
```

Do not build a separate widescreen dashboard.

---

# 33. Persistent HUD

Keep HUD minimal.

Suggested:

```text
⛽ 20       ⭐ 130       👛
```

One primary contextual action.

Normal:

```text
[ SWAP ]
```

Selected fare:

```text
[ SWAP & PICK UP ]
```

Stalled:

```text
[ SWAP TO REFUEL ]
```

Avoid multiple competing primary buttons.

---

# 34. Allowed MVP Screens / Sheets

Exactly:

```text
Loading
Start
Map
Wallet Sheet
Fare Sheet
Swap Sheet
Destination Reveal
Stall Sheet
Fare Complete Sheet
How To Play
Settings
Leaderboard
```

Do not invent extra pages during MVP unless required by the repo.

---

# 35. Scene Transitions

Reuse the existing template iris close/open transition.

Use it for:

```text
START → MAP
MAP → HOW TO PLAY
MAP → SETTINGS
MAP → LEADERBOARD
```

Do not replace it with a new scene manager for MVP.

---

# 36. Effects / Animation Stack

Use:

```text
CSS keyframes
CSS transforms
CSS variables
requestAnimationFrame
PNG/WebP sprites
small bounded DOM particle effects
```

Do not add Phaser solely for:

- TukTuk bounce
- exhaust
- route reveal
- coin effects
- marker pulse
- scene transitions

---

# 37. Required MVP Effects

Implement only:

1. smooth TukTuk movement on predefined path
2. idle/driving TukTuk bounce
3. small exhaust puffs
4. NPC idle bounce
5. selected NPC pulse
6. route reveal
7. completed route fill
8. camera easing/follow
9. short pickup effect
10. dropoff reward effect
11. iris scene transition
12. start-logo motion

Anything else is polish.

---

# 38. Persistence Split

## Local-only persistence

Use `localStorage` for:

```text
settings
dismissed notices
non-authoritative UI preferences
possibly cached public state
```

## Authoritative persistence

Use backend/database for:

```text
player
available fares
active fare
route progress
processed swap signatures
points
leaderboard
stall state
```

Do not make deployed gameplay authoritative in `localStorage`.

---

# 39. Minimal Backend API

Preferred endpoint set:

```text
GET  /api/player/:wallet
POST /api/player/init

GET  /api/fares/:wallet

GET|POST /api/dflow/order

POST /api/swap/confirm

GET  /api/leaderboard
```

Match HTTP methods to actual repo convention.

The endpoint names are more important than strict verbs.

---

# 40. Authoritative Swap Confirmation Endpoint

Preferred architecture:

```text
Browser wallet signs
        ↓
transaction submitted
        ↓
Solana confirms
        ↓
browser sends signature
        ↓
POST /api/swap/confirm
        ↓
server verifies transaction
        ↓
server checks unique signature
        ↓
server derives/validates swap
        ↓
server calls interpretConfirmedSwap()
        ↓
server persists player/fare/trip
        ↓
server returns authoritative result
```

The browser must **not** be trusted to submit:

```json
{
  "fuelAwarded": 20
}
```

Browser should submit primarily:

```json
{
  "signature": "..."
}
```

plus only data required for verification/context.

---

# 41. Suggested Module Ownership

Adapt paths to the actual repo.

```text
wallet.js
  connect / disconnect / signer

swap.js
  swap UI state + orchestration

dflow/client.js
  request DFlow order

dflow/transaction.js
  deserialize / submit / confirm

game/fuel.js
  fuel curve

game/fareMatcher.js
  pure qualification rules

game/interpretSwap.js
  authoritative swap → game transition

map.js
  MapLibre adapter

player.js
  player state / trip state

ui.js
  screens / sheets / HUD

config.js
  all tuning constants
```

Avoid circular responsibilities.

---

# 42. Public Interfaces

## Wallet

```text
connectWallet()
disconnectWallet()
getConnectedWallet()
signTransaction(transaction)
```

## DFlow

```text
requestOrder(params)
deserializeOrderTransaction(response)
submitSignedTransaction(transaction)
confirmTransaction(signature)
```

## Fare Logic

```text
matchesFare(fare, swap)
rankAutoMatchCandidates(fares, player, swap)
```

## Game

```text
interpretConfirmedSwap(player, swapEvent)
```

## Map

```text
initMap()
showLocations()
showFarePickup()
showDestination()
showRoute()
updateRouteProgress()
setPlayerPosition()
focusFare()
followPlayer()
clearFare()
setExploreCamera()
resizeMap()
```

## UI

```text
openWalletSheet()
openFareSheet(fareId)
openSwap(context)
openDestinationReveal()
openStallSheet()
openFareComplete()
```

---

# 43. Central Config

No scattered magic numbers.

Suggested config:

```js
STARTING_FUEL = 20

MIN_GAME_SWAP_USD = 1

MIN_ACTIVE_FARES = 5
MAX_ACTIVE_FARES = 8

FARE_EXPIRY_MINUTES = 10
FARE_EXPIRY_MAX_MINUTES = 45

PICKUP_ANIMATION_MS = 2500
ROUTE_REVEAL_MS = 500
FARE_COMPLETE_HOLD_MS = 1500

SELECTED_FARE_STRICT = true

ALLOW_ROUTE_FALLBACK = false

DEV_MODE = true
```

Also centralize:

```text
map center
map zoom
camera timing
TukTuk bounce
route line styling
quote debounce
slippage default
```

---

# 44. Development Seed Data

Do not begin with procedural content.

Use deterministic fixtures first.

Recommended:

```text
5 NPCs
10 locations
12–20 predefined routes
6 tokens
6 fixed fares
```

Example fixed demo fare:

```text
Dave
pickup: Khao San
destination: Suvarnabhumi Airport
condition: SOL_PAIR
minimumUsd: 5
points: fixed demo value
```

Keep this deterministic until the full loop works.

Only then enable random fare generation.

---

# 45. Development Mode

Add:

```js
DEV_MODE = true
```

Provide dev-only controls:

```text
+5 fuel
-5 fuel
spawn Dave
select Dave
force stall
resume trip
complete fare
reset player
show route IDs
skip animation
fake confirmed swap
```

Hide/remove in production.

These controls are required to test gameplay without paying for real swaps every time.

---

# 46. Two Independent Vertical Slices

Build and debug independently first.

## Slice A — Game Only

Use a fake confirmed swap fixture.

Prove:

```text
fare appears
→ select fare
→ fake confirmed swap
→ fuel
→ pickup
→ destination reveal
→ drive
→ stall
→ fake second swap
→ resume
→ complete
→ points
```

## Slice B — DFlow Only

Prove:

```text
wallet
→ DFlow order
→ wallet sign
→ submit
→ confirmation
→ unique signature
```

Then connect both through:

```text
interpretConfirmedSwap()
```

Do not debug map animation, DFlow, fare matching, and persistence simultaneously.

---

# 47. Build Phase Protocol

For every phase:

```text
1. Read only docs relevant to the phase.
2. Inspect current code.
3. Implement the smallest complete slice.
4. Run automated tests.
5. Manually verify the target interaction where applicable.
6. Update PROJECT_STATE.md.
7. Stop.
```

Do **not** automatically start the next phase.

---

# 48. Recommended Build Order

## PHASE 0 — Repo Audit

Confirm:

- runtime
- dependency system
- API/edge route convention
- database/persistence
- PWA files
- asset layout
- current template code

Exit:

```text
documented adaptation plan
```

---

## PHASE 1 — Shell Adaptation

- remove Bunkee-specific gameplay
- preserve loading/start/settings/how-to-play
- preserve viewport/PWA behavior
- preserve iris transition
- add Crazy Tuk placeholders

Exit:

```text
Crazy Tuk shell boots cleanly
```

---

## PHASE 2 — Static Map

- MapLibre loads
- Bangkok renders
- portrait layout works
- map survives hidden/show scene transitions
- `map.resize()` works

Exit:

```text
Bangkok inside game stage
```

---

## PHASE 3 — Deterministic Game Data

- locations
- routes
- NPCs
- fixed fares
- player fixture
- config

Exit:

```text
fixtures validate at startup
```

---

## PHASE 4 — Game-Only Fare Loop

Using fake confirmed swaps:

```text
select fare
→ fuel
→ pickup
→ reveal
→ drive
→ stall
→ refuel
→ complete
```

Exit:

```text
full loop works without blockchain
```

---

## PHASE 5 — Wallet Vertical Slice

```text
map visible disconnected
→ authenticated action
→ connect wallet
→ initialize/load player
```

Exit:

```text
wallet state stable
```

---

## PHASE 6 — DFlow Vertical Slice

```text
SOL → USDC
→ order
→ sign
→ submit
→ confirm
```

No game consequences yet.

Exit:

```text
real DFlow swap succeeds
```

---

## PHASE 7 — Authoritative Swap Bridge

- `/api/swap/confirm`
- verify signature
- signature uniqueness
- normalize swap event
- `interpretConfirmedSwap()`
- persist

Exit:

```text
one real confirmed swap
→ one fuel award
```

---

## PHASE 8 — Fare Context

Add:

```text
FREE_SWAP
SELECTED_FARE
```

Exit:

```text
selected qualifying fare
→ real swap
→ active fare
```

---

## PHASE 9 — Stall Context

Add:

```text
STALLED
```

Exit:

```text
real second swap
→ refuel
→ resume
→ complete
```

---

## PHASE 10 — Leaderboard

- points persistence
- basic rank
- wallet abbreviation
- completed fares

Exit:

```text
fare completion changes leaderboard
```

---

## PHASE 11 — Polish

Only after core loop is stable:

- map style
- sprites
- exhaust
- route styling
- camera easing
- reward effects
- audio
- haptics
- DFlow branding
- responsive cleanup

---

# 49. Acceptance Tests

A phase is complete only when its acceptance behavior passes.

## Player Initialization

```text
new wallet
→ exactly one player
→ starting fuel = configured value
→ valid starting location
→ AVAILABLE
```

## Duplicate Signature

```text
process same confirmed transaction twice
→ first processes
→ second changes nothing
```

## Fare Qualification

```text
SOL_PAIR fare
+ USDC → SOL above minimum
→ qualifies
```

```text
SOL_PAIR fare
+ USDC → USDT
→ does not qualify
```

## Selected Fare Strictness

```text
selected fare exists
→ nonqualifying confirmed swap
→ fuel may be awarded
→ selected fare remains
→ no auto-match
```

## Auto-Match

```text
no selected fare
→ qualifying confirmed swap
→ deterministic candidate ranking
→ top candidate assigned
```

## Stall

```text
route cost = 10
fuel = 4
→ progress ≈ 40%
→ fuel = 0
→ STALLED
```

## Resume

```text
remaining cost = 6
confirmed swap awards 8
→ complete remaining trip
→ 2 fuel remains
```

## Failed Swap

```text
wallet reject / onchain failure
→ 0 fuel
→ 0 fare changes
```

## App Resume

```text
mobile wallet handoff
→ return
→ transaction status restored
→ signature processed once
```

---

# 50. MVP Demo Must Support This Exact Script

```text
1. Open Crazy Tuk.
2. Bangkok map visible without wallet.
3. Tap Dave.
4. Connect wallet / Get Your TukTuk.
5. Dave's fare returns.
6. Select Dave.
7. Dave requires SOL_PAIR >= $5.
8. Open Swap & Pick Up.
9. Make qualifying DFlow swap.
10. External wallet approves.
11. Transaction confirms.
12. Fuel awarded.
13. Dave becomes active.
14. TukTuk drives to pickup.
15. Destination reveals: airport.
16. Fuel is insufficient.
17. TukTuk drives partway.
18. STALLED.
19. Dave complains.
20. Open Swap to Refuel.
21. Make second DFlow swap.
22. Transaction confirms.
23. Fuel awarded.
24. TukTuk resumes.
25. Fare completes.
26. Points awarded.
27. Leaderboard updates.
```

If this script works cleanly, the MVP is submission-worthy.

---

# 51. `PROJECT_STATE.md` Requirement

Every implementation session updates:

```text
PROJECT_STATE.md
```

Keep it concise.

Required format:

```md
# Crazy Tuk Project State

## Current Phase
PHASE X — Name

## Completed
- ...

## Tests Passing
- ...

## Known Issues
- ...

## Next Exact Task
- ...

## Files Changed
- ...

## Locked Decisions
- only new implementation-relevant decisions not already in planning docs
```

Do not use this file as a diary.

Its purpose is to let a fresh coding session resume without rereading chat history.

---

# 52. Coding-Agent Rules

The coding LLM must follow these rules:

1. Do not re-decide product mechanics already specified.
2. Do not add frameworks without necessity.
3. Do not rewrite working template infrastructure for style reasons.
4. Do not implement future features while the current acceptance test fails.
5. Do not create content before the state transition using it exists.
6. Do not trust browser-calculated fuel/points as authoritative.
7. Do not process the same Solana signature twice.
8. Do not introduce live routing.
9. Do not make destination visible before pickup.
10. Do not require enough fuel to finish a hidden-destination fare.
11. Do not allow a stalled player to receive a new passenger.
12. Do not let animation own game truth.
13. Keep constants centralized.
14. Keep modules shallow.
15. Prefer deterministic test data before random generation.
16. Update `PROJECT_STATE.md` after every phase.
17. Stop after the current phase is verified.

---

# 53. Token-Saving Rule for Implementation Prompts

A build prompt should normally include only:

```text
1. current phase
2. relevant source doc(s)
3. PROJECT_STATE.md
4. acceptance criteria
```

Do not paste every planning document into every coding prompt.

Recommended doc selection:

```text
Map work:
CRAZY_TUK_MAPLIBRE.md
+ PROJECT_STATE.md

DFlow work:
CRAZY_TUK_DFLOW.md
+ relevant state/game contract
+ PROJECT_STATE.md

Game mechanic work:
CRAZY_TUK_GAME_RULES.md
+ this handoff
+ PROJECT_STATE.md

Overall implementation:
CRAZY_TUK_MVP_PLAN.md
+ this handoff
+ PROJECT_STATE.md
```

---

# 54. Final Architecture Summary

```text
                         CRAZY TUK

              ┌────────────────────────┐
              │      HTML / CSS UI     │
              │ sheets · HUD · effects │
              └───────────┬────────────┘
                          │
              ┌───────────▼────────────┐
              │    VANILLA JS GAME     │
              │                        │
              │ player / fares / fuel  │
              │ route progress / events│
              └──────┬─────────┬───────┘
                     │         │
          ┌──────────▼───┐ ┌──▼─────────────┐
          │  MAP ADAPTER │ │ SWAP / WALLET  │
          │              │ │                │
          │  MapLibre    │ │ Solana wallet  │
          └──────────────┘ │ DFlow /order   │
                           └───────┬────────┘
                                   │
                           ┌───────▼────────┐
                           │ BACKEND / DB   │
                           │               │
                           │ player state  │
                           │ fares         │
                           │ tx signatures │
                           │ leaderboard   │
                           └────────────────┘
```

---

# 55. Final Build Directive

> **Build Crazy Tuk by adapting the existing portrait-first HTML/CSS/vanilla-JS PWA template. Keep MapLibre isolated as the geographic renderer, use hand-authored predefined Bangkok routes, keep the game engine authoritative over fuel/fares/trip state, and make DFlow-confirmed Solana swaps the only bridge from onchain action into gameplay. Build the deterministic game loop and the DFlow transaction loop independently, then connect them through one idempotent `interpretConfirmedSwap()` path. Preserve a public map before wallet connection, gate the first personal action, require explicit external-wallet approval for every MVP swap, and stop each implementation phase only after its acceptance tests pass.**
