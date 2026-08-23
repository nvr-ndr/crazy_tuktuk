# Crazy Tuk — DFlow Integration Specification

> **Status:** MVP build handoff  
> **Scope:** Exact DFlow + Solana wallet integration for Crazy Tuk  
> **Primary product rule:** A DFlow swap is not a side feature. It is the game action that creates fuel, activates qualifying fares, and resumes stalled trips.

---

# 0. Core Thesis

Crazy Tuk's sponsor/product thesis is:

> **The swap ends. Crazy Tuk begins.**

A successful DFlow-powered Solana swap becomes an authenticated game event.

```text
PLAYER CHOOSES SWAP
        ↓
DFlow constructs order
        ↓
PLAYER WALLET SIGNS
        ↓
transaction submitted
        ↓
transaction confirms successfully
        ↓
Crazy Tuk processes signature once
        ↓
fuel / fare / resume game event
        ↓
TUK-TUK MOVES
```

The game must never award fuel or change fare state because a quote was displayed, the player clicked Swap, a wallet popup opened, a transaction was signed, or a transaction was merely submitted.

**Only confirmed successful swaps affect gameplay.**

---

# 1. MVP Wallet Decision

For MVP:

- no Privy
- no embedded wallet
- no delegated signing
- no automatic transaction signing

Use a standard Solana wallet connection compatible with the existing app shell.

Preferred direction:

```text
@solana/kit
+ Wallet Standard wallet discovery / signing
```

The exact wallet package wiring should be checked against the current template repository and current Solana Kit APIs during implementation.

Do **not** add React only to connect a wallet.

The app should remain aligned with the existing HTML/CSS/vanilla-JS architecture unless the actual repo already uses a different stack.

---

# 2. Wallet UX Rule

The player does **not** need to connect a wallet merely to see Crazy Tuk.

## Before wallet connection

Allow:

- load start screen
- enter map
- view Bangkok
- pan / zoom map
- see the game world
- see NPC fare markers
- inspect non-account-specific presentation where possible

## First authenticated game action

If the player attempts an action requiring personal state, show wallet connection.

Examples:

- tap/select a fare
- press SWAP
- claim/get a TukTuk
- view personal fuel/points if not initialized
- perform any state-changing action

Conceptual flow:

```text
OPEN GAME
   ↓
SEE MAP
   ↓
attempt game action
   ↓
wallet connected?
  ↙        ↘
NO         YES
↓           ↓
CONNECT     CONTINUE
↓
initialize player
↓
CONTINUE
```

Wallet connection is framed as:

> **GET YOUR TUK-TUK**

rather than generic login.

---

# 3. First Wallet Connection

The wallet public key is the player's primary ID for MVP.

On first successful connection:

```text
walletPublicKey
        ↓
lookup player
        ↓
player exists?
   ↙          ↘
 NO           YES
 ↓             ↓
CREATE         LOAD
PLAYER         PLAYER
```

New-player initialization follows the game rules:

```text
wallet
random eligible startingLocation
STARTING_FUEL
status = AVAILABLE
points = 0
completedFares = 0
activeFare = null
selectedFare = null
```

Do not create a persistent player solely because the public map loaded.

---

# 4. DFlow Product Role

DFlow is the transaction engine underlying the core Crazy Tuk action.

Every successful eligible DFlow swap can:

```text
1. award fuel
2. satisfy a selected fare condition
3. auto-match an eligible fare
4. refuel an active journey
5. resume a stalled journey
```

DFlow should therefore be accessible from the gameplay loop itself.

Do **not** make the MVP depend on a separate physical "exchange booth" POI.

A future DFlow-themed map POI may exist as flavor, but it is not the primary MVP interaction.

---

# 5. One Shared Swap Sheet, Three Entry Contexts

Use one DFlow swap UI component/sheet.

Conceptually:

```js
openSwap({ context: "FREE_SWAP" });
```

```js
openSwap({
  context: "SELECTED_FARE",
  fareId: "fare-123"
});
```

```js
openSwap({
  context: "STALLED",
  activeFareId: "fare-123",
  fuelNeeded: 7
});
```

The DFlow transaction flow is identical. The Crazy Tuk presentation changes based on context.

---

# 6. Entry Context A — General Swap

The player presses the persistent map SWAP action.

```text
┌────────────────────────────┐
│        MAKE A SWAP         │
│                            │
│ SOL                 0.10   │
│            ↓               │
│ USDC              ~14.62   │
│                            │
│ THIS SWAP EARNS            │
│ ⛽ +5 FUEL                 │
│                            │
│ May match a passenger.     │
│                            │
│      [ SWAP & DRIVE ]      │
│                            │
│      Powered by DFlow      │
└────────────────────────────┘
```

After confirmation:

1. award fuel
2. if no fare is selected, run automatic fare matching
3. if qualifying fare exists, assign it
4. otherwise keep fuel only

---

# 7. Entry Context B — Selected Fare

The player taps an NPC fare first.

Example:

```text
DAVE

Pickup: Khao San
Destination: ???
Condition: SOL pair
Minimum: $5
Reward: 35 points
```

Player selects Dave.

```text
selectedFare = fareId
```

but the fare is not active yet.

CTA:

```text
[ SWAP & PICK UP ]
```

The Swap Sheet in `SELECTED_FARE` context displays whether the configured swap satisfies the fare.

Qualifying example:

```text
YOU PAY
6.00 USDC

↓

YOU GET
~SOL

DAVE'S FARE
✓ SOL pair
✓ $5 minimum

Estimated fuel: +5

[ SWAP & PICK UP ]

Powered by DFlow
```

Nonqualifying example:

```text
DAVE'S FARE
✕ Requires a SOL pair

This swap can still earn:
⛽ +5 fuel

Dave will remain unclaimed.
```

MVP rule:

```text
SELECTED_FARE_STRICT = true
```

Therefore if a selected fare exists and the swap does not qualify:

- award fuel if globally eligible
- do not assign another passenger automatically
- retain selected fare if it has not expired

---

# 8. Entry Context C — Stalled

When:

```text
fuel = 0
remainingTripFuelCost > 0
status = STALLED
```

the primary CTA becomes:

```text
[ SWAP TO REFUEL ]
```

The sheet should show the active deficit.

```text
OUT OF GAS

Need: 7 fuel
Passenger: Dave

USDC                 10
        ↓
SOL                 ~...

Estimated fuel: +8

✓ Enough to get moving

[ SWAP TO REFUEL ]

Powered by DFlow
```

If the estimated fuel is insufficient:

```text
Estimated fuel: +3

Still short by ~4 fuel.
```

Do not prevent the swap. Multiple smaller swaps are allowed.

After confirmation:

```text
confirmed swap
      ↓
+ fuel
      ↓
apply fuel to remaining trip
      ↓
enough?
 ↙       ↘
NO       YES
↓         ↓
remain    RESUME
STALLED   DRIVING
```

This is a central demo moment.

---

# 9. Swap Sheet Structure

## Header

Context-sensitive:

```text
MAKE A SWAP
SWAP & PICK UP
SWAP TO REFUEL
```

## Pay

```text
token selector
amount input
wallet balance
```

## Receive

```text
token selector
estimated output
```

## Game Impact

Show as relevant:

```text
estimated fuel
selected fare condition status
stall fuel deficit status
```

## Trade Details

Secondary/collapsible:

```text
minimum received
price impact
slippage
relevant fees
```

## CTA

```text
SWAP & DRIVE
SWAP & PICK UP
SWAP TO REFUEL
```

## Attribution

Always visible:

```text
Powered by DFlow
```

---

# 10. Supported Tokens

MVP curated list:

```text
SOL
USDC
USDT
BONK
JUP
PENGU
```

Each local token record:

```text
mint
symbol
name
decimals
icon
category
```

Categories:

```text
stable
volatile
```

DFlow requests use mint addresses, not symbols.

The local registry resolves:

```text
symbol → mint
symbol → decimals
symbol → game category
```

---

# 11. Native SOL Handling

The DFlow API uses the WSOL mint for SOL trading requests.

The DFlow adapter should translate game-level `SOL` into the current required `/order` parameters, including native SOL wrapping/unwrapping behavior where appropriate.

Do not spread wrapped-SOL logic into the game engine.

---

# 12. DFlow API Choice

MVP uses:

```text
GET /order
```

DFlow's order endpoint provides quote information plus a ready-to-sign serialized transaction when a `userPublicKey` is supplied.

Do not add for MVP:

```text
/quote + /swap split
intent orders
WebSockets
order books
advanced route controls
```

---

# 13. Browser / Backend Boundary

The browser must **not** call DFlow `/order` directly.

DFlow's Trading API does not expose browser CORS headers.

Use our own backend/edge proxy.

Suggested route:

```text
GET /api/dflow/order
```

Architecture:

```text
Crazy Tuk Browser
       ↓
/api/dflow/order
       ↓
DFlow GET /order
       ↓
backend returns response
       ↓
Crazy Tuk Browser
```

Production DFlow credentials stay on the backend.

Never expose a DFlow API key in browser JavaScript.

---

# 14. DFlow Proxy Input

Conceptual request:

```json
{
  "inputMint": "...",
  "outputMint": "...",
  "amount": "10000000",
  "slippageBps": 50,
  "userPublicKey": "..."
}
```

The proxy should validate:

```text
inputMint valid/allowed
outputMint valid/allowed
inputMint != outputMint
amount positive
amount integer atomic units
slippage within configured limits
userPublicKey valid
```

Native-SOL and other required DFlow flags should be added according to the current API.

---

# 15. Atomic Amount Conversion

The UI uses human-readable amounts.

DFlow expects atomic units.

Example:

```text
0.01 SOL
SOL decimals = 9

API amount:
10,000,000
```

Create one utility:

```text
toAtomicAmount(displayAmount, decimals)
```

Avoid floating-point errors and validate wallet balance.

---

# 16. Quote Before Wallet Connection

DFlow supports `/order` without `userPublicKey` for price fields without returning a transaction.

This is optional for Crazy Tuk MVP.

Do not prioritize it if it slows the one-day build.

The required UX is:

```text
map visible before wallet
game action → connect wallet
```

not necessarily pre-wallet live quoting.

---

# 17. Order Request Flow

When wallet is connected and input is valid:

```text
input token
output token
amount
wallet public key
slippage
      ↓
frontend calls
/api/dflow/order
      ↓
backend calls
DFlow GET /order
      ↓
DFlow returns
quote + serialized transaction
      ↓
frontend renders quote
```

Debounce quote/order requests.

Suggested:

```text
amount/token changes
      ↓
250–500ms debounce
      ↓
request new order
```

Configurable.

---

# 18. Swap State Machine

Recommended client state:

```text
IDLE
LOADING_QUOTE
QUOTE_READY
QUOTE_ERROR
AWAITING_SIGNATURE
SUBMITTING
CONFIRMING
CONFIRMED
FAILED
```

Drive UI from explicit state.

---

# 19. Quote Data Display

At minimum display:

```text
input amount
expected output
minimum received
price impact
slippage
```

where available/relevant.

Advanced route details can stay behind:

```text
DETAILS ▾
```

The main view should remain game-like rather than resembling a trading terminal.

---

# 20. Fuel Preview

Before signing:

```text
estimatedUsdValue
       ↓
fuelCurve()
       ↓
estimatedFuel
```

Render:

```text
THIS SWAP EARNS
~+5 FUEL
```

The authoritative award happens only after confirmation.

---

# 21. Fare Qualification Preview

When a fare is selected, use the same fare matcher used by confirmed game logic.

Conceptually:

```js
previewFareQualification(selectedFare, {
  inputToken,
  outputToken,
  estimatedUsdValue
});
```

Do not duplicate qualification rules separately in the UI.

---

# 22. User Presses Swap

Validate:

```text
wallet still connected
wallet public key matches order
order still usable
amount valid
token pair valid
balance adequate
transaction present
not already submitting
```

Then:

```text
state = AWAITING_SIGNATURE
```

UI:

```text
CHECK YOUR WALLET
Approve the swap to keep driving.
```

---

# 23. External Wallet Signing

For MVP, every swap requires explicit wallet approval.

Depending on device/wallet:

- desktop may show wallet extension UI
- mobile may hand off to a wallet app
- the user then returns/resumes Crazy Tuk

Preserve Swap Sheet and game context while this happens.

Retain enough transient state to recover:

```text
swapContext
selectedFareId
activeFareId
current order state
```

Do not assume the page stays foregrounded.

---

# 24. Deserialize Transaction

The `/order` response includes a base64-encoded transaction when `userPublicKey` is supplied.

The frontend transaction adapter must:

1. decode base64
2. deserialize the Solana transaction
3. pass it to the connected wallet signer

Use transaction utilities compatible with the chosen current Solana stack.

---

# 25. Submit Transaction

After signing:

```text
signed transaction
       ↓
Solana RPC
       ↓
signature
```

Store the signature immediately in client transaction state.

Do **not** award game effects yet.

UI:

```text
SWAP SENT
Waiting for Solana...
```

---

# 26. Confirm Transaction

Wait for confirmation.

If transaction reports an error:

```text
state = FAILED
fuel = 0
no fare changes
```

If successful:

```text
state = CONFIRMED
```

Only then enter game processing.

---

# 27. Confirmed Swap Event

Normalize a successful transaction into one domain object.

```js
const swapEvent = {
  signature,
  wallet,
  inputMint,
  outputMint,
  inputAmount,
  outputAmount,
  estimatedUsdValue,
  confirmedAt
};
```

Then call:

```text
interpretConfirmedSwap(player, swapEvent)
```

The Swap UI must not directly mutate fuel, fares, trips, or points.

---

# 28. Anti-Duplicate Rule

Critical invariant:

```text
ONE SOLANA SIGNATURE
=
AT MOST ONE CRAZY TUK GAME EVENT
```

Before award:

```text
signature already processed?
   ↙              ↘
 YES               NO
 ↓                  ↓
STOP             PROCESS
```

Duplicate processing awards:

```text
0 fuel
0 fare changes
0 trip changes
```

This check must be authoritative in persistent storage/backend state, not just browser memory.

---

# 29. Global Minimum Swap

MVP:

```text
MIN_GAME_SWAP_USD = 1
```

A smaller DFlow swap may still execute, but:

```text
game fuel = 0
fare qualification = false
```

Warn before signing:

```text
Swap will execute,
but swaps under $1 don't earn fuel.
```

---

# 30. `interpretConfirmedSwap()`

Authoritative bridge:

```text
interpretConfirmedSwap(player, swap)

1. reject duplicate signature
2. classify tokens
3. calculate accepted USD value
4. if below MIN_GAME_SWAP_USD:
      record swap
      award 0
      return
5. calculate fuelEarned
6. persist swap event once
7. branch by player state
```

---

# 31. AVAILABLE State

```text
add fuel

selectedFare exists?
    ↙          ↘
  YES          NO
   ↓            ↓
test selected   find qualifying fares
fare first      rank candidates
   ↓            ↓
qualifies?      assign best
 ↙     ↘
YES    NO
↓       ↓
assign  fuel only
fare
```

With `SELECTED_FARE_STRICT = true`, a nonqualifying selected-fare swap does not auto-match another passenger.

---

# 32. PICKUP / DRIVING State

```text
add fuel
do not assign new fare
apply fuel to active journey
continue trip logic
carry excess fuel
```

Repeated swaps can intentionally refuel an active journey.

---

# 33. STALLED State

```text
add fuel
do not assign new fare
apply fuel to remaining trip
enough?
  ↙     ↘
NO      YES
↓        ↓
remain   resume
STALLED  DRIVING
```

Mandatory for MVP.

---

# 34. Game/UI Handoff After Confirmation

`interpretConfirmedSwap()` returns authoritative result, for example:

```js
{
  fuelAwarded: 8,
  fareAssigned: "fare-123",
  tripResumed: false,
  tripCompleted: false,
  remainingFuel: 12
}
```

UI animates the result.

Animation follows state. Animation does not create state.

---

# 35. Swap Sheet Visual States

## LOADING_QUOTE

```text
Finding your rate...
Powered by DFlow
```

## QUOTE_READY

Full swap + game impact.

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

## CONFIRMED

Context-sensitive success.

## FAILED

```text
NO DEAL.

Your TukTuk hasn't moved.
[ TRY AGAIN ]
```

---

# 36. DFlow Branding

Always visible in Swap Sheet:

```text
Powered by DFlow
```

Recommended additionally:

```text
Swap routed by DFlow
```

on success.

---

# 37. UI Styling Principle

DFlow is infrastructure; Crazy Tuk owns presentation.

Use the existing Crazy Tuk visual language, but preserve financial clarity.

Do not obscure:

```text
token pair
amount
expected output
minimum output
price impact
slippage
fees where relevant
transaction status
```

---

# 38. Map Relationship

Swap Sheet remains a gameplay layer over the map where practical.

```text
┌───────────────────────────┐
│        BANGKOK MAP        │
│                           │
│   👩          🛺          │
│                           │
│ ┌───────────────────────┐ │
│ │      SWAP SHEET       │ │
│ │  SOL → USDC           │ │
│ │  +5 fuel              │ │
│ │  [ SWAP & DRIVE ]     │ │
│ └───────────────────────┘ │
└───────────────────────────┘
```

Do not navigate to an unrelated-looking crypto page unless implementation constraints force it.

---

# 39. Wallet Disconnect

If wallet disconnects:

- public map remains visible
- authenticated actions are gated
- persistent player data remains keyed by wallet
- reconnecting same wallet restores player
- game state is not deleted

If disconnect occurs during signing, abort current client flow and award nothing.

---

# 40. Mobile Wallet Return

On return from external wallet:

1. restore Swap Sheet context
2. determine whether a signature exists
3. continue confirmation if possible
4. refresh authoritative player state
5. call `map.resize()` if viewport changed
6. resume animations after state is known

Do not duplicate consequences because both a transaction callback and app-resume handler observed the same signature.

---

# 41. Error Handling

## Route unavailable

```text
Couldn't find a route for this swap.
Try another amount or token pair.
```

## Price impact too high

```text
Price impact is too high.
Try a smaller swap.
```

## Wallet rejection

```text
Swap cancelled.
Your TukTuk hasn't moved.
```

## RPC submission failure

```text
Swap wasn't submitted.
Try again.
```

## Onchain failure

```text
Swap failed onchain.
No fuel awarded.
```

## Confirmation uncertainty

Do not award fuel until state is known.

---

# 42. Backend Proxy Responsibilities

`/api/dflow/order` should:

1. validate request
2. construct DFlow request
3. attach API key if configured
4. call configured DFlow endpoint
5. normalize errors
6. return required response
7. never expose secrets

Do not put game fuel/fare logic in this proxy.

---

# 43. Suggested Code Organization

Adapt to the actual repo.

```text
/js
  wallet.js
  swap.js
  game.js
  map.js
  ui.js

/dflow
  client.js
  tokens.js
  transaction.js

/game
  fareMatcher.js
  fuel.js
  interpretSwap.js

/api
  dflow
    order
```

Primary boundaries:

```text
wallet = connect / disconnect / sign
dflow = order / transaction adapter
game = interpret confirmed swap
ui = render states
map = visualize resulting game state
```

---

# 44. Recommended Interfaces

## Wallet Adapter

```text
connectWallet()
disconnectWallet()
getConnectedWallet()
signTransaction(transaction)
```

## DFlow Client

```text
requestOrder(params)
deserializeOrderTransaction(response)
submitSignedTransaction(transaction)
confirmTransaction(signature)
```

## Game Interpreter

```text
interpretConfirmedSwap(player, swapEvent)
```

## Swap UI

```text
openSwap(context)
updateSwapQuote()
submitSwap()
closeSwap()
```

---

# 45. Persistence Requirements

## Swap Event

```text
signature
wallet
inputMint
outputMint
inputAmount
outputAmount
usdValue
fuelAwarded
processedAt
```

Unique constraint:

```text
signature
```

## Player

```text
wallet
currentLocationId
fuel
status
points
activeFareId
selectedFareId
```

Do not rely on `localStorage` alone for duplicate-swap protection in deployed/shared play.

---

# 46. DFlow Integration Build Order

## DFLOW-0 — Repo Audit

- inspect template repo
- confirm runtime/deployment
- determine server/edge route mechanism
- determine module system
- determine current Solana dependencies
- locate PWA lifecycle code
- locate persistence approach

**Exit:** implementation path matches actual repo.

## DFLOW-1 — Wallet Vertical Slice

Build:

- Wallet Standard discovery
- connect/disconnect
- public key display
- wallet-gated game action

**Exit:**

```text
open map
→ tap authenticated action
→ connect wallet
→ wallet public key available
```

## DFLOW-2 — DFlow Proxy

Build:

```text
/api/dflow/order
```

Test known pair/amount.

**Exit:** browser can request an order through our backend.

## DFLOW-3 — Swap Vertical Slice

Build:

```text
SOL → USDC
amount
quote
sign
submit
confirm
```

No game fuel yet.

**Exit:** real DFlow swap succeeds from Crazy Tuk.

## DFLOW-4 — Confirmed Swap Normalization

Create `swapEvent` and unique signature persistence.

**Exit:** event processing is idempotent.

## DFLOW-5 — Fuel Bridge

Implement:

```text
interpretConfirmedSwap()
```

Initially:

```text
confirmed eligible swap → fuel award
```

**Exit:** one real swap changes fuel exactly once.

## DFLOW-6 — Fare Context

Add:

```text
FREE_SWAP
SELECTED_FARE
```

**Exit:**

```text
select NPC
→ qualifying swap
→ confirm
→ fare active
```

## DFLOW-7 — Stall Context

Add:

```text
STALLED
```

**Exit:**

```text
stall
→ second DFlow swap
→ refuel
→ resume
```

## DFLOW-8 — UX / Error Polish

Add:

- DFlow branding
- signing state
- confirmation state
- failures
- mobile wallet-return handling
- success animation
- balance refresh
- responsive cleanup

---

# 47. Critical Test Cases

## A — Wallet Gate

```text
no wallet
→ map visible
→ tap fare
→ wallet connect shown
→ connect
→ player initialized
→ fare interaction continues
```

## B — Successful General Swap

```text
AVAILABLE
no fare selected
→ DFlow swap
→ wallet approves
→ confirms
→ signature processed once
→ fuel awarded
→ auto-match may run
```

## C — Wallet Rejection

```text
press SWAP
→ user rejects
→ no transaction
→ no fuel
→ no fare changes
```

## D — Onchain Failure

```text
wallet signs
→ transaction fails
→ no fuel
→ no fare
```

## E — Selected Fare Qualifies

```text
select SOL_PAIR fare
→ make qualifying pair
→ confirm
→ fuel
→ fare assigned
```

## F — Selected Fare Does Not Qualify

```text
SELECTED_FARE_STRICT = true
→ nonqualifying swap confirms
→ fuel if eligible
→ selected fare remains
→ no auto-match
```

## G — Free Swap Auto-Match

```text
no selected fare
→ qualifying swap confirms
→ fuel
→ eligible fares filtered/ranked
→ best fare assigned
```

## H — Fuel Only

```text
no qualifying fares
→ swap confirms
→ fuel only
→ AVAILABLE
```

## I — Stall Resume

```text
STALLED
needs 7 fuel
→ swap earns 8
→ confirm
→ 7 applied
→ resume
→ 1 carries forward
```

## J — Duplicate Signature

```text
signature already processed
→ process again
→ 0 fuel
→ 0 fare changes
→ 0 trip changes
```

## K — Mobile Wallet Handoff

```text
open swap
→ wallet app handoff
→ approve
→ return
→ context restored
→ confirmation completes once
```

---

# 48. MVP Demo Path

1. Open Crazy Tuk.
2. Bangkok map visible without wallet.
3. Tap Dave.
4. Prompt: **Get Your TukTuk / Connect Wallet**.
5. Connect.
6. Dave's fare sheet returns.
7. Select Dave.
8. Dave requires a SOL-pair swap.
9. Press **Swap & Pick Up**.
10. DFlow Swap Sheet opens.
11. Configure qualifying swap.
12. Show estimated fuel + qualification.
13. Press Swap.
14. External wallet asks for approval.
15. Approve.
16. Return if wallet handoff occurred.
17. Transaction submits/confirms.
18. Signature processed once.
19. Fuel awarded.
20. Dave becomes active.
21. TukTuk drives to pickup.
22. Destination reveals.
23. Trip lacks enough fuel.
24. TukTuk stalls.
25. Dave complains.
26. Press **Swap to Refuel**.
27. Make second DFlow swap.
28. Approve.
29. Transaction confirms.
30. Fuel awarded.
31. TukTuk resumes.
32. Fare completes.
33. Points update.

---

# 49. Explicitly Deferred

Do not add during MVP:

- Privy
- embedded wallets
- delegated signing
- gas sponsorship
- platform fees
- intent-based swaps
- DFlow WebSockets
- order books
- advanced route controls
- automatic/background trades
- recurring swaps
- broad token universe
- dedicated DFlow POI as required gameplay

---

# 50. Source References

Primary DFlow references:

- DFlow Introduction  
  `https://pond.dflow.net/resources/introduction`

- DFlow Send Orders / Quickstart  
  `https://pond.dflow.net/spot/recipes/quickstart`

- DFlow FAQs  
  `https://pond.dflow.net/resources/faqs`

Primary Solana references:

- Solana Kit client  
  `https://solana.com/docs/frontend/client`

- Wallet cookbook page discussed during planning  
  `https://solana.com/developers/cookbook/wallets/connect-wallet-react`

Implementation should verify current package/API details against current documentation before coding.

---

# 51. Final MVP Decision

> **Crazy Tuk uses a standard externally connected Solana wallet for MVP. The Bangkok map is visible before connection, but the first authenticated game action asks the player to connect and initializes their persistent TukTuk. All swap entry points open one Crazy Tuk-styled DFlow Swap Sheet. DFlow `GET /order` is called through our backend proxy, the returned transaction is signed explicitly by the player's wallet and submitted through Solana RPC, and only a confirmed successful transaction is normalized into a unique Crazy Tuk swap event. `interpretConfirmedSwap()` then awards fuel, assigns a qualifying fare, refuels an active trip, or resumes a stalled TukTuk.**
