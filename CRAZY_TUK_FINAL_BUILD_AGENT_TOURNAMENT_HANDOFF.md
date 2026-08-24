# CRAZY TUK --- FINAL BUILD & AGENT TOURNAMENT HANDOFF

**Purpose:** Execution-first implementation plan for an LLM coding
agent.\
**Goal:** Finish the human/asynchronous Crazy Tuk loop, replace mock
trading with DFlow, then add a minimal but real autonomous-agent
tournament without requiring the coding LLM to redesign systems or make
product decisions.

------------------------------------------------------------------------

## 0. EXECUTION RULES FOR THE CODING LLM

Treat this document as the implementation authority for the remaining
build.

1.  **Do not redesign working UI or mechanics unless a phase explicitly
    requires it.**
2.  **Do not begin Agent Tournament work until the human Drive loop
    passes its acceptance tests.**
3.  Reuse existing map, route animation, NPC, location, fare-card,
    speech-bubble, feed, dashboard, transaction-history, wallet, and
    leaderboard components.
4.  Put tunable gameplay values in one constants/config module. Do not
    scatter magic numbers through components.
5.  Persist authoritative game state. Animation state is derived state
    and must be reconstructable after refresh/restart.
6.  Every DFlow trade must correspond to a Crazy Tuk fare/opportunity.
    Agents do **not** trade merely to increase transaction count.
7.  The server/backend validates all scoring, tournament state, agent
    eligibility, Pit Calls, and transaction results.
8.  Build phases sequentially. At the end of each phase, run the listed
    acceptance tests before continuing.
9.  Prefer deterministic formulas and ordinary code over LLM reasoning
    wherever possible. The model should choose among already-valid
    opportunities; it should not construct arbitrary transactions.
10. Keep the hackathon version small: **one active human driver per
    wallet; one active tournament agent per wallet; one backend agent
    runner managing all agents.**

------------------------------------------------------------------------

# PART I --- CURRENT PRODUCT BASELINE

The current build already has:

-   Responsive mobile + desktop UI.
-   Bangkok map with zones/locations, including farther destinations.
-   NPC/fare markers.
-   Fare card with pickup/destination information.
-   Geographic route calculation.
-   Estimated fuel/gas based on route distance.
-   A mock swap flow that preloads a swap meeting the fare requirement
    and permits adjustment while checking validity.
-   Route preview showing:
    -   current tuk-tuk → pickup;
    -   pickup → destination.
-   After swap, animated movement:
    -   drive to passenger;
    -   pickup;
    -   drive to destination.
-   Passenger speech bubbles while waiting and during rides.
-   Completed-ride feed entry with passenger comment + star rating.
-   Player dashboard/profile shell.
-   Ride statistics including stalls/fuel-related data.
-   Transaction/swap history UI.
-   Stubbed leaderboard.
-   Wallet-oriented player identity/profile structure.

**Do not rebuild these systems. Extend them.**

------------------------------------------------------------------------

# PART II --- TARGET PRODUCT ARCHITECTURE

Crazy Tuk has two modes sharing one world and most gameplay
infrastructure.

## A. DRIVE

Human asynchronous mode.

Loop:

`Fare → inspect → valid DFlow swap → fuel → pickup → ride → review/reward → next fare`

Shared-world additions:

`stall → refuel OR abandon → rescue opportunity → another player can complete it`

Competition is asynchronous through:

-   leaderboard;
-   global activity feed;
-   stranded/rescue fares;
-   profiles;
-   optional decorative ghost cars later.

## B. TOURNAMENT

Autonomous agent mode.

Loop:

`Generate driver → configure → fund once → enter Shift → agent chooses fares → DFlow trades autonomously → rides → leaderboard → up to 3 Pit Calls → results → withdraw/next Shift`

The same core systems should power both modes:

-   NPCs;
-   locations;
-   route distances;
-   fuel formulas;
-   fare definitions;
-   DFlow quoting/trading;
-   ride lifecycle;
-   scoring;
-   speech/reviews;
-   transaction history.

The principal difference is **who chooses the fare and signs the swap**:

-   Drive: human chooses; connected wallet signs.
-   Tournament: agent chooses; agent wallet signs autonomously.

------------------------------------------------------------------------

# PART III --- SERVICE LAYOUT

Recommended hackathon deployment:

## Vercel

Use for:

-   existing frontend/PWA;
-   map and UI;
-   human wallet interactions;
-   lightweight application/API endpoints if already present;
-   DFlow `/order` proxy for browser-driven human swaps if appropriate.

DFlow's Trading API does not expose browser CORS for `/order`; DFlow
explicitly says browser integrations should proxy it through a backend
such as a Vercel Edge Function.

## Neon

Use PostgreSQL as authoritative persistent game/tournament state.

Store:

-   users;
-   player profiles;
-   rides;
-   swaps;
-   feed events;
-   leaderboard aggregates;
-   rescue opportunities;
-   tournaments;
-   tournament entrants;
-   agents;
-   agent runs;
-   agent strategy revisions;
-   Pit Calls;
-   agent wallet public addresses;
-   current agent ride/location state;
-   fare/opportunity templates;
-   tournament opportunity windows;
-   bankroll snapshots.

**Never store plaintext private keys or mnemonics in Neon.**

## Railway

Run one long-lived **Crazy Tuk Agent Runner**.

Responsibilities:

-   DFlow Agent CLI installation/configuration;
-   encrypted DFlow wallet vault;
-   autonomous agent-wallet signing;
-   opportunity generation;
-   idle-agent scheduling;
-   agent decision loop;
-   DFlow quote/trade execution;
-   confirmation/status handling;
-   ride state transitions;
-   periodic bankroll/PnL snapshots;
-   tournament start/end/finalization;
-   feed/leaderboard events.

Do **not** run one Railway service per agent for the MVP. One runner
manages all active agents.

------------------------------------------------------------------------

# PART IV --- DFLOW IMPLEMENTATION FACTS

Use the current DFlow docs as source of truth:

-   Agent CLI: https://pond.dflow.net/ai/agent-cli
-   DFlow overview: https://pond.dflow.net/ai/introduction
-   Trading FAQ: https://pond.dflow.net/build/faqs
-   Imperative quote reference:
    https://pond.dflow.net/build/trading-api/imperative/quote

Important implementation facts:

### Agent wallets

DFlow Agent CLI supports multiple named Solana wallets. Each wallet is a
separate encrypted Open Wallet Standard file under the DFlow vault.
Select a wallet using `--wallet <name>`.

Useful commands:

-   `dflow setup`
-   `dflow whoami --wallet <name>`
-   `dflow positions --wallet <name>`
-   `dflow wallet list`
-   `dflow wallet export --name <name>`
-   `dflow send ...`
-   `dflow quote ...`
-   `dflow trade ... --confirm`
-   `dflow status ...`

### Headless signing

DFlow documents `DFLOW_PASSPHRASE` for headless/background environments.
The CLI reads it for signing and clears it from its own environment.
Treat the Railway environment and vault as sensitive signing
infrastructure.

### Agent identification

For custom agents, set:

`DFLOW_AGENT=crazy-tuk`

DFlow also supports model registration:

`dflow agent --model <model-name>`

DFlow sends agent-observability headers such as `X-Dflow-Caller`,
`X-Dflow-Agent`, and `X-Dflow-Model`.

### DFlow guardrails

Available documented guardrails include:

-   `max_trade_size_usd`
-   `max_daily_volume_usd`
-   `max_wallet_value_usd`
-   `allowed_tokens`
-   `rate_limit`
-   `sweep_address`

Guardrails are client-side safety limits enforced by the CLI. Agents can
read them, but DFlow's normal CLI design requires a human-entered vault
password to change them.

**Hackathon implication:** do not make runtime Pit Calls depend on
rewriting DFlow guardrails unless the deployed architecture can securely
support DFlow's human-password requirement. Treat tournament policy as
Crazy Tuk server-side constraints first; configure stable DFlow
guardrails before a Shift as a second safety layer.

### Spot quotes

The Agent CLI quote command returns route information, expected output
and price impact without executing.

The DFlow quote response/API exposes useful fields including:

-   `inAmount`
-   `outAmount`
-   `minOutAmount`
-   `priceImpactPct`
-   `routePlan`
-   venue information per route leg
-   slippage
-   fees where applicable

For new direct Trading API integrations DFlow recommends `/order`; do
not build new code around the older quote endpoint merely because it is
easier to discover in docs.

### Execution

For spot swaps, Agent CLI supports:

`dflow trade <amount> <from> <to> --confirm`

Default spot execution is imperative. Declarative spot execution is also
supported with `--declarative`.

Start with imperative execution for Crazy Tuk unless an existing
integration already uses another supported DFlow path.

### Gas sponsorship

DFlow documents gasless swaps using the sponsor parameter. This is
optional/stretch scope; do not block core gameplay on it.

------------------------------------------------------------------------

# PART V --- PHASE 1: FREEZE AND CENTRALIZE GAME CONSTANTS

Before changing mechanics, locate existing fuel, distance, reward,
fare-expiry, swap-validation, and ride-duration values.

Create/normalize one config module, e.g.:

`gameConfig.ts`

It should expose named values for at least:

-   fuel capacity;
-   starting fuel;
-   fuel per route kilometer;
-   optional pickup-vs-passenger-leg multipliers;
-   fuel awarded per valid swap / conversion formula;
-   minimum fuel;
-   ride-duration compression;
-   stall threshold;
-   rescue reward;
-   stall penalty;
-   fare reward formula;
-   fare TTL ranges;
-   active human fare count;
-   tournament opportunity count;
-   tournament starting bankroll;
-   tournament minimum operating balance;
-   max trade allocation;
-   max daily notional;
-   rate limit;
-   Pit Calls per Shift;
-   tournament duration;
-   intake-close period;
-   intermission duration.

**Acceptance:** no critical gameplay formula depends on duplicated
unexplained numeric constants.

------------------------------------------------------------------------

# PHASE 2: FINALIZE FUEL ACCOUNTING

Fuel must become deterministic before real money or agents are added.

## Canonical calculation

For a selected fare calculate two route legs independently:

1.  `pickupDistanceKm`
2.  `rideDistanceKm`

Then:

`pickupFuel = fuelCost(pickupDistanceKm)`

`rideFuel = fuelCost(rideDistanceKm)`

`totalRequiredFuel = pickupFuel + rideFuel`

A valid swap produces:

`fuelAdded = swapToFuel(confirmedSwap)`

Then:

`postSwapFuel = min(fuelCapacity, currentFuel + fuelAdded)`

Fuel is consumed continuously or by route progress, but final accounting
must equal the deterministic route cost.

## Important design decision

**Successful rides do not generate fuel.**

Successful rides generate:

-   Crazy Score/points;
-   fare earnings/game score;
-   reputation/karma;
-   completed-fare count.

DFlow swaps are the source of fuel. This preserves:

`SWAP = ENERGY`\
`RIDE = REWARD`

If existing code currently grants fuel on ride completion, remove that
reward or convert it into a non-fuel reward.

## Fare UI

Before execution the fare must be able to derive:

-   current fuel;
-   expected fuel from the currently configured swap;
-   pickup fuel;
-   passenger-leg fuel;
-   expected finishing fuel or expected shortfall.

Do not overload the mobile UI. Exact values may remain in expanded
details. The minimum required information is whether the currently
configured swap is sufficient.

**Acceptance tests:**

-   A route's preview fuel requirement matches actual consumption.
-   Changing swap amount updates expected fuel.
-   Current + added fuel cannot exceed capacity.
-   Ride completion does not silently mint fuel.
-   Refreshing during a ride does not change the calculated fuel budget.

------------------------------------------------------------------------

# PHASE 3: BUILD A STALL TEST HARNESS

Do not test stalling by waiting for random gameplay.

Add a development-only debug panel or query/debug controls.

Required controls:

-   set fuel to 0;
-   set fuel to 10%;
-   set fuel to 25%;
-   set fuel to 50%;
-   fill fuel;
-   optionally force next fare to a known short/medium/long route.

Test three cases:

### Case A --- Stall before pickup

Fuel runs out on `driver → pickup`.

Expected:

-   tuk-tuk stops at interpolated route position;
-   fare remains waiting;
-   passenger waiting speech bubbles continue;
-   ride state becomes `STALLED_TO_PICKUP`.

### Case B --- Stall with passenger

Reach pickup, then run out on `pickup → destination`.

Expected:

-   passenger remains assigned to driver;
-   tuk-tuk stops;
-   passenger stall speech bubbles continue;
-   ride state becomes `STALLED_WITH_PASSENGER`.

### Case C --- Near-zero finish

Complete with approximately zero remaining fuel.

Expected:

-   ride succeeds;
-   no negative fuel;
-   score/review generated;
-   route/fuel totals reconcile.

Do not proceed until all three are repeatable.

------------------------------------------------------------------------

# PHASE 4: COMPLETE HUMAN STALL/RECOVERY LOOP

When stalled, present two actions:

## REFUEL & CONTINUE

-   Keep current ride.
-   Open existing swap flow.
-   Require another valid DFlow swap.
-   Add resulting fuel.
-   Resume from exact stalled route progress.
-   Do not restart route from origin.

## CALL FOR RESCUE / ABANDON

-   Original driver's ride ends as `ABANDONED_RESCUABLE`.
-   Record stall/abandon penalty.
-   If passenger was already picked up, rescue origin is the stalled
    coordinates.
-   If stalled before pickup, rescue origin remains passenger pickup.
-   Create a rescue opportunity.
-   Publish feed event.

No recapitalization concept is relevant here; this is ordinary Drive
mode.

**Acceptance:**

-   Refuel resumes exact ride.
-   Abandon creates exactly one rescue opportunity.
-   Abandoned passenger cannot simultaneously complete for original
    driver.
-   Stats correctly distinguish stalls, abandoned rides, rescued rides,
    completed rides.

------------------------------------------------------------------------

# PHASE 5: REPLACE/VALIDATE MOCK HUMAN SWAPS WITH REAL DFLOW

Use the existing wallet UX.

## Human trade flow

`connected wallet → fare → preconfigured valid pair/amount → DFlow order/quote → user may adjust within fare constraints → sign → submit → confirm → credit fuel → begin route`

Rules:

-   Never credit fuel before transaction confirmation.
-   Persist signature/request ID.
-   Store input/output mint and amounts.
-   Store quote/execution metadata needed by dashboard.
-   Prevent the same transaction from crediting fuel twice.
-   Failed/reverted transaction leaves fare unstarted.
-   Browser requests to DFlow `/order` must go through backend/proxy
    because DFlow does not provide browser CORS for this endpoint.

The user's funds remain in the user's wallet; DFlow states spot trading
is non-custodial.

------------------------------------------------------------------------

# PHASE 6: ADD MARKET/TRAFFIC SIGNAL WITHOUT CROWDING UI

This phase enriches the existing fare object. It does **not** add a new
player configuration requirement.

Add internal fields such as:

-   `roadTrafficLevel`
-   `marketTrafficLevel`
-   `priceImpactPct`
-   `routeQuality`
-   `marketDifficultyMultiplier`
-   `estimatedDuration`
-   `estimatedFuel`

Use three-level enums:

`GREEN | YELLOW | RED`

## Human UI

Keep compact.

Recommended collapsed fare-card treatment:

-   `ROAD ●` or traffic-light icon
-   `MARKET ●` or traffic-light icon

The player does not need raw routing data in the primary card.

Expanded/tap detail may explain:

-   Green: favorable/normal;
-   Yellow: moderate;
-   Red: difficult/thin/expensive.

Do not claim a simplistic universal liquidity measurement if DFlow only
provides quote-specific evidence. For MVP, `marketTrafficLevel` should
be a **Crazy Tuk derived score** based on available DFlow quote
information such as price impact and route characteristics.

## Agent use

Agents receive the numeric/raw derived inputs, not merely the color:

-   expected price impact;
-   route quality;
-   market difficulty;
-   geographic distance;
-   road traffic;
-   reward.

This creates strategy differences without making human UI dense.

**Acceptance:** same fare object renders a simple signal to humans and
exposes detailed machine-readable features to the tournament decision
engine.

------------------------------------------------------------------------

# PHASE 7: ASYNCHRONOUS SHARED DRIVE MODE

Turn the existing "Global Feed" and leaderboard into real shared state.

Minimum shared features:

## Global feed events

-   ride completed;
-   player stalled;
-   rescue requested;
-   rescue accepted;
-   rescue completed;
-   major leaderboard movement if desired.

## Leaderboard

Start with:

-   Crazy Score;
-   completed fares;
-   distance;
-   stalls;
-   rescues.

Do not build real-time synchronized player sprites as a dependency.

## Rescue fare

A rescue opportunity behaves like a special fare.

On accept:

-   atomically assign rescue to one player;
-   route rescuer to rescue origin;
-   pick up stranded passenger;
-   complete remaining destination;
-   award rescue bonus/karma.

Unlike tournament shared fare templates, **a rescue passenger is a
unique object** and must not be accepted by multiple humans.

Use a DB transaction/atomic update when claiming.

## Ghost cars

Stretch only.

If added, derive from recent ride records. They are decorative and
non-authoritative.

------------------------------------------------------------------------

# PHASE 8: DRIVE MODE COMPLETION GATE

Do not begin tournament UI until these are true:

-   real DFlow human swap succeeds;
-   valid swap credits correct fuel;
-   pickup fuel and passenger-leg fuel reconcile;
-   all three stall tests pass;
-   refuel/resume works;
-   abandon/rescue works;
-   feed persists;
-   leaderboard persists;
-   dashboard transaction record opens correctly;
-   refresh does not destroy an active ride;
-   mobile and desktop remain functional.

At this point the hackathon has a complete human product even if Agent
Tournament slips.

------------------------------------------------------------------------

# PART VI --- AGENT TOURNAMENT

# PHASE 9: TOURNAMENT DATA MODEL

Recommended conceptual entities:

## `tournaments`

-   id
-   status:
    `REGISTRATION | LIVE | INTAKE_CLOSED | FINALIZING | COMPLETE | INTERMISSION`
-   registration opens
-   starts at
-   fare intake closes at
-   ends at
-   next Shift
-   starting bankroll
-   rules version

## `agents`

Persistent character identity:

-   id
-   owner user/wallet
-   name
-   portrait/persona
-   DFlow wallet name
-   wallet public key
-   created at
-   career stats

## `agent_runs`

One agent in one tournament:

-   tournament id
-   agent id
-   starting bankroll
-   current portfolio value
-   PnL
-   Crazy Score
-   fares completed
-   distance
-   current location
-   status:
    `REGISTERED | IDLE | QUOTING | TRADING | DRIVING_TO_PICKUP | DRIVING_PASSENGER | STALLED | RETIRED | FINISHED`
-   current opportunity
-   current ride timestamps
-   Pit Calls used
-   strategy revision id
-   last decision time

## `agent_strategies`

Persist versioned strategy snapshots.

Suggested normalized controls:

-   PnL weight
-   Crazy Score weight
-   fare-count weight
-   survival weight
-   risk tolerance
-   trade-frequency preference
-   max allocation preference
-   token categories
-   geographic preference if used

## `pit_calls`

-   run id
-   call number 1--3
-   old strategy
-   new strategy
-   timestamp

## `tournament_opportunities`

Shared opportunity templates:

-   NPC
-   origin
-   destination
-   token pair/eligible directions
-   reward
-   road traffic
-   market conditions
-   spawn
-   expiry
-   difficulty

Agents independently consume the same opportunity template. These are
**not globally exclusive passengers**.

------------------------------------------------------------------------

# PHASE 10: AGENT WALLET PROVISIONING

## UX

User already has normal Solana wallet connected.

Flow:

`Tournament → Hire Driver → generate/select character → configure → create agent wallet → show public address → Fund 20 USDC → sign one transfer → verify funding → register`

Important:

**20 USDC is transferred to the agent's own Solana wallet, not deposited
"into DFlow."**

## Backend

For each agent:

1.  Generate/create a named DFlow wallet in the Railway-hosted encrypted
    vault.
2.  Obtain public address with `dflow whoami --wallet <name>`.
3.  Store only public address + DFlow wallet identifier in Neon.
4.  Return public address to frontend.
5.  Frontend builds normal SPL USDC transfer from owner wallet to agent
    address.
6.  User signs.
7.  Backend confirms balance/funding.
8.  Mark run funded/eligible.

### Security constraints

-   No plaintext private key in DB.
-   No private key sent to browser.
-   Do not expose "View Private Key" as normal UX.
-   Standard exit action is `Withdraw & Retire`.
-   Wallet export is advanced/recovery functionality, not required for
    hackathon.

------------------------------------------------------------------------

# PHASE 11: PRE-SHIFT SAFETY POLICY

Recommended initial tournament constants:

-   one active agent per owner;
-   standardized starting bankroll: **20 USDC**;
-   no owner top-ups after Shift starts;
-   minimum operating portfolio value: initially **\$1 equivalent**,
    configurable;
-   three Pit Calls;
-   one active ride per agent;
-   allowed token universe explicitly configured;
-   max single-trade allocation configured;
-   max daily notional configured;
-   trade-rate limit configured.

Initial target behavior, not hard scoring requirement:

**\~20--50 swaps per surviving agent per 24h.**

Do not enforce exactly 20--50 rides. Enforce financial/rate constraints
and let strategy determine actual count.

A conservative agent may trade less; aggressive agents may trade more.

For 10 agents this produces an expected order of magnitude of hundreds
of trades/day, enough for a tournament demonstration without encouraging
meaningless churn.

------------------------------------------------------------------------

# PHASE 12: SHARED OPPORTUNITY BOARD

Agent mode must not depend on the five-human-fare presentation.

Maintain approximately **8--12 active tournament opportunities**.

Use a controlled mixture of:

-   short TTL;
-   medium TTL;
-   long TTL;
-   short/medium/long geographic routes;
-   lower/higher rewards;
-   safer/riskier token pairs;
-   different market traffic levels.

When an opportunity expires, replenish it.

When one agent accepts an opportunity, it disappears for that agent/run
but **does not disappear globally**.

Reason:

-   prevents server-latency races from deciding the tournament;
-   lets agents face comparable opportunities;
-   avoids locking/reservation complexity;
-   supports strategy comparison.

This is deliberately different from unique human rescue fares.

------------------------------------------------------------------------

# PHASE 13: AGENT DECISION LOOP

Do not run an LLM continuously.

Trigger decisions on events:

-   Shift starts;
-   agent becomes idle;
-   ride completes;
-   relevant wait timer expires;
-   owner performs Pit Call;
-   recoverable trade failure requires re-evaluation.

Pseudo-flow:

1.  Load agent run.
2.  If not eligible/idle, stop.
3.  Load current shared opportunities.
4.  Filter impossible opportunities in deterministic code:
    -   expired;
    -   disallowed token;
    -   exceeds trade cap;
    -   insufficient balance;
    -   impossible minimum fuel/route constraints;
    -   outside tournament intake window.
5.  Fetch/derive DFlow quote data only for a bounded shortlist.
6.  Construct compact decision payload.
7.  Agent/model returns one of:
    -   `ACCEPT <opportunityId> <allowedDirection>`
    -   `WAIT`
8.  Server validates again.
9.  Execute DFlow trade using the agent's named wallet.
10. Wait for confirmation.
11. Persist transaction.
12. Credit fuel / initialize ride.
13. Set ride timestamps/path.
14. Frontend derives animation from persisted route + timestamps.
15. On ride completion, compute score/review/state.
16. Agent returns to `IDLE`.

**The model never supplies arbitrary mint addresses, arbitrary recipient
addresses, or unrestricted transaction instructions.**

------------------------------------------------------------------------

# PHASE 14: AGENT STRATEGY MODEL

Expose human-readable presets but persist numeric weights.

Suggested presets:

## Conservative / Uncle Lek

-   high PnL weight;
-   high survival weight;
-   low fare-count weight;
-   lower risk;
-   lower allocation;
-   safer token preference.

## Balanced

-   mixed PnL / score / survival;
-   moderate frequency;
-   moderate allocation.

## Aggressive / Degen Dao

-   high Crazy Score weight;
-   higher fare-count weight;
-   lower survival weight;
-   higher risk;
-   higher allocation;
-   broader token universe.

The model should evaluate an opportunity using inputs including:

-   Crazy Score reward;
-   current geographic location;
-   distance to pickup;
-   ride distance;
-   estimated ride time;
-   fuel requirement;
-   road traffic;
-   DFlow-derived market traffic;
-   expected price impact;
-   current token inventory;
-   trade size;
-   current PnL;
-   drawdown;
-   time remaining;
-   leaderboard position;
-   strategy weights.

The exact scoring heuristic may initially be deterministic. An LLM is
optional if a weighted policy produces adequate differentiated behavior.
**Do not add an LLM merely for branding.**

------------------------------------------------------------------------

# PHASE 15: THREE PIT CALLS

Each run receives:

`pitCallsRemaining = 3`

A Pit Call may change the **strategy mandate**, not directly choose a
trade.

Allowed:

-   risk tolerance;
-   objective weights;
-   frequency preference;
-   allocation preference within tournament limits;
-   token preference within tournament whitelist.

Not allowed:

-   "buy BONK now";
-   "take fare 123";
-   owner capital injection;
-   bypass tournament hard limits.

Persist every Pit Call and strategy revision.

For hackathon implementation, do not require dynamic DFlow CLI guardrail
mutation for every Pit Call. The tournament server validates the mutable
strategy while stable preconfigured DFlow guardrails remain the hard
wallet safety ceiling.

Optional thematic cost:

-   brief garage/pause before agent resumes.

Do not make this mandatory until timing is tuned.

Secondary achievement/leaderboard:

`FULL AUTONOMY` = completed Shift with zero Pit Calls.

------------------------------------------------------------------------

# PHASE 16: TOURNAMENT UI

Reuse existing components aggressively.

Only five tournament-specific surfaces are needed.

## 1. Tournament Lobby

Before start:

-   Shift number;
-   countdown;
-   starting bankroll;
-   duration;
-   registered agents;
-   Enter Tournament.

During Shift:

-   time remaining;
-   active/stalled counts;
-   user's rank;
-   Watch Driver.

## 2. Garage

-   randomly generated/selected driver;
-   portrait/persona;
-   strategy preset;
-   advanced sliders/settings;
-   wallet public address;
-   funding status;
-   20 USDC funding CTA;
-   Enter Shift.

## 3. Live Agent View

Reuse existing map.

Show only:

-   user's agent as authoritative tuk-tuk;
-   current opportunities;
-   route;
-   passenger dialogue;
-   compact agent HUD.

HUD:

-   rank;
-   bankroll / PnL;
-   Crazy Score;
-   fares;
-   Pit Calls remaining.

Do **not** render all tournament agents as synchronized cars.

Other agents appear through:

-   leaderboard;
-   feed;
-   announcements.

Ghost leaders are stretch-only decorative visualization.

## 4. Pit Call Sheet

Overlay on Live Agent View.

-   current strategy;
-   editable permitted controls;
-   clear `uses 1 of 3` warning;
-   confirm.

## 5. Results

-   final rank;
-   Crazy Score;
-   starting/ending portfolio;
-   PnL;
-   fares;
-   stalls;
-   max drawdown if tracked;
-   Pit Calls;
-   category ranks;
-   withdraw/retire;
-   prepare next Shift.

Existing player dashboard/profile should be generalized for agent career
history rather than building another full profile system.

------------------------------------------------------------------------

# PHASE 17: TOURNAMENT CLOCK

Recommended production cadence:

-   **23h competition**
-   **1h intermission/pit stop**

At competition end, stop new fare acceptance.

A simpler implementation is:

-   `startsAt`
-   `intakeClosesAt = startsAt + 23h`
-   allow already-started rides a bounded completion/finalization
    period;
-   finalize standings;
-   1h intermission;
-   next Shift.

For hackathon/demo:

Use a compressed **5--10 minute Shift** with the same state machine.

Do not create separate demo logic; change duration constants.

------------------------------------------------------------------------

# PHASE 18: STALL / RETIRE / FUNDING RULES

## Agent stall

An agent stalls out of the tournament when it cannot continue under the
configured minimum operating rules, e.g. portfolio value below
configured threshold.

Initial threshold:

`$1 equivalent` (configurable after testing).

Result:

-   run status becomes `STALLED`;
-   no recapitalization;
-   final run stats freeze;
-   feed announcement;
-   agent character remains in owner's Garage/career history.

The character can enter a later Shift with a fresh standardized
bankroll.

## Top-ups

After tournament start:

**not allowed.**

Detect owner/external deposits if practical. At minimum, tournament
accounting must not credit outside deposits as PnL and should mark
suspicious runs for invalidation/manual review.

## Withdrawal

During a live Shift:

`Withdraw & Retire`

-   ends current run;
-   sends assets to owner-configured/connected destination;
-   marks `RETIRED`;
-   cannot re-enter same Shift.

After Shift:

withdrawal is normal.

------------------------------------------------------------------------

# PHASE 19: SCORING AND LEADERBOARDS

Do not make pure PnL the sole tournament winner because inactivity can
become an optimal strategy.

Primary:

## CRAZY SCORE

Composite game performance.

Initial components should reward:

-   completed fares;
-   fare difficulty;
-   distance/time commitment;
-   difficult market conditions;
-   profitable/efficient execution;
-   survival.

Keep exact weights in config and tune from simulation.

Secondary leaderboards:

-   **PnL** --- highest percentage portfolio return;
-   **Fares** --- most completed rides;
-   **Survival** --- risk-adjusted / drawdown-oriented performance;
-   **Efficiency** --- score per unit of traded notional;
-   **Degen** --- high-risk/difficult-fare performance;
-   **Full Autonomy** --- best score among agents using zero Pit Calls.

Always store raw metrics so scoring weights can be adjusted without
losing historical evidence.

------------------------------------------------------------------------

# PHASE 20: MARKET TRAFFIC DERIVATION

Treat market traffic as a Crazy Tuk abstraction derived from DFlow quote
conditions.

Do not pretend DFlow directly returns `GREEN/YELLOW/RED`.

Start with quote-level features:

-   `priceImpactPct`;
-   route-plan complexity/venues;
-   expected output;
-   min output;
-   slippage context;
-   quote success/failure.

Implement:

`deriveMarketTraffic(quote): GREEN | YELLOW | RED`

Thresholds belong in config and should be tuned empirically.

Human sees:

`MARKET ●`

Agent sees:

-   color;
-   raw/normalized score;
-   underlying numeric features.

Road traffic remains a separate Crazy Tuk/world value.

A fare can therefore be:

-   Road 🟢 / Market 🔴
-   Road 🔴 / Market 🟢
-   etc.

This creates two independent opportunity costs:

**time/fuel** and **trade quality**.

------------------------------------------------------------------------

# PHASE 21: RUNNER RELIABILITY

The Agent Runner must be restartable.

Never rely on an in-memory timer as authoritative state.

Persist:

-   ride start;
-   ride expected completion;
-   route;
-   current state;
-   transaction signature;
-   pending operation;
-   last processed event/version.

On process boot:

1.  query LIVE tournament;
2.  find unfinished agent runs;
3.  reconcile pending transactions;
4.  finalize rides whose completion time passed;
5.  resume eligible idle agents.

Use idempotency guards so restart cannot:

-   execute the same swap twice;
-   award the same ride twice;
-   consume a Pit Call twice;
-   finalize a tournament twice.

------------------------------------------------------------------------

# PHASE 22: HACKATHON-SCOPE OBSERVABILITY

Add an admin/debug view or structured logs for:

-   active tournament;
-   agents by status;
-   wallet balances;
-   last decision;
-   current fare;
-   current transaction signature;
-   DFlow errors;
-   ride completion time;
-   Pit Calls;
-   leaderboard metrics.

Log DFlow CLI structured JSON responses and error codes without logging
secret material.

Useful recoverable states:

-   quote unavailable;
-   route not found;
-   transaction failed;
-   confirmation timeout;
-   insufficient funds;
-   guardrail rejection;
-   runner restart.

A recoverable DFlow failure should return the agent to `IDLE` after a
bounded retry/backoff, not permanently kill the run unless the
underlying balance/policy makes continuation impossible.

------------------------------------------------------------------------

# PART VII --- MINIMUM DATABASE/STATE CONTRACT

Exact schema can adapt to existing code, but preserve these concepts.

``` text
User
 ├─ PlayerProfile
 ├─ HumanRides
 └─ Agents[]

Agent
 ├─ owner
 ├─ walletPublicKey
 ├─ dflowWalletName
 ├─ persona
 └─ AgentRuns[]

Tournament
 ├─ rules
 ├─ opportunities[]
 └─ AgentRuns[]

AgentRun
 ├─ strategyVersion
 ├─ bankroll
 ├─ portfolioValue
 ├─ pnl
 ├─ score
 ├─ currentLocation
 ├─ currentRide
 ├─ status
 ├─ pitCallsUsed
 └─ transactions[]

Ride
 ├─ driverType: HUMAN | AGENT
 ├─ origin
 ├─ destination
 ├─ pickupRoute
 ├─ passengerRoute
 ├─ fuelAccounting
 ├─ swap
 ├─ status
 └─ review

Swap
 ├─ driver/wallet
 ├─ fare/opportunity
 ├─ inputMint
 ├─ outputMint
 ├─ inAmount
 ├─ outAmount
 ├─ signature
 ├─ DFlow request/order identifiers
 ├─ priceImpact
 ├─ route metadata
 └─ status
```

------------------------------------------------------------------------

# PART VIII --- IMPLEMENTATION ORDER / DO NOT DEVIATE

The coding LLM should execute in this order:

### HUMAN COMPLETION

1.  Audit existing fuel/reward formulas.
2.  Centralize config.
3.  Finalize pickup + passenger fuel math.
4.  Add stall debug harness.
5.  Pass three stall tests.
6.  Implement refuel/resume.
7.  Implement abandon/rescue creation.
8.  Connect/validate real DFlow human swap.
9.  Add market-traffic derivation.
10. Persist feed.
11. Persist leaderboard.
12. Implement rescue claiming/completion.
13. Run Drive completion gate.

### AGENT FOUNDATION

14. Add tournament schema/state.
15. Deploy Railway Agent Runner.
16. Install/configure DFlow Agent CLI.
17. Prove one named agent wallet can be created.
18. Prove user can fund it with test/small USDC.
19. Prove runner can query positions.
20. Prove runner can autonomously quote.
21. Prove runner can autonomously execute one permitted swap and confirm
    it.
22. Persist transaction and update game state.

### TOURNAMENT GAME

23. Build shared opportunity generator.
24. Build deterministic opportunity filtering.
25. Build one-agent decision loop.
26. Connect accepted opportunity → DFlow trade → fuel → existing ride
    animation/state.
27. Add multiple agents to same runner.
28. Add tournament leaderboard.
29. Add three Pit Calls.
30. Add stall/retire logic.
31. Add Lobby.
32. Add Garage.
33. Add Live Agent HUD.
34. Add Pit Call sheet.
35. Add Results screen.
36. Test compressed 5--10 minute Shift.
37. Only after stability, switch duration config toward long/24h
    tournaments.

------------------------------------------------------------------------

# PART IX --- FIRST AGENT TOURNAMENT TEST MATRIX

Do not begin with 10 real-money agents.

## Test A --- one mocked agent

-   opportunity generation;
-   decision;
-   ride;
-   score;
-   no DFlow transaction.

## Test B --- one real DFlow agent wallet

-   tiny bankroll;
-   one allowed token pair;
-   one quote;
-   one real trade;
-   one ride.

## Test C --- three agents

Use distinct policies:

-   conservative;
-   balanced;
-   aggressive.

Verify behavior differs.

## Test D --- Pit Calls

-   modify each strategy;
-   ensure no direct trade instruction;
-   enforce exactly three;
-   persist history.

## Test E --- failure

Force:

-   insufficient funds;
-   bad quote;
-   failed transaction;
-   runner restart;
-   expired fare;
-   portfolio below stall threshold.

## Test F --- ten-agent compressed Shift

Target:

-   5--10 minutes;
-   enough opportunities to avoid starvation;
-   leaderboard updates;
-   agents finish at different ranks;
-   at least one configurable failure/stall scenario;
-   results finalize exactly once.

Only then consider a long live Shift.

------------------------------------------------------------------------

# PART X --- OUT OF SCOPE UNTIL CORE PASSES

Do not spend remaining hackathon tokens/time on these before the above
works:

-   prediction markets;
-   Proof/KYC;
-   NFTs;
-   token issuance;
-   real-time rendering of every tournament agent;
-   player-to-player collision;
-   globally exclusive tournament NPCs;
-   agent private-key display UI;
-   complex multi-container isolation per agent;
-   advanced DFlow declarative execution optimization;
-   sponsored/gasless fares;
-   elaborate ghost-car synchronization;
-   multiple simultaneously active agents per owner.

These are post-core/stretch features.

------------------------------------------------------------------------

# PART XI --- FINAL HACKATHON DEMO PATH

The demo should communicate the architecture in under a few minutes.

## Drive

1.  Connect wallet.
2.  Open fare.
3.  Show pickup + destination + fuel requirement.
4.  Show compact Road/Market traffic indicators.
5.  Execute DFlow swap.
6.  Tuk-tuk drives to passenger and destination.
7.  Passenger review enters feed.
8.  Show transaction in profile/dashboard.
9.  If time permits, demonstrate forced stall + refuel/rescue.

## Tournament

1.  Open Tournament.
2.  Generate/select Degen Dao.
3.  Choose strategy.
4.  Show unique agent wallet.
5.  Fund standardized bankroll.
6.  Start compressed Shift.
7.  Watch agent evaluate fares.
8.  Agent selects one without human choosing.
9.  DFlow agent wallet autonomously executes swap.
10. Existing ride system animates the result.
11. Show bankroll/PnL/score/leaderboard.
12. Use one Pit Call to change strategy.
13. Show subsequent behavior under new strategy.
14. Finish Shift and show Results.

Core pitch:

> **Humans use DFlow to play Crazy Tuk. Autonomous agents use DFlow to
> play the same economic game themselves. The same fares, routes,
> liquidity and fuel system become a tournament for autonomous economic
> actors, with only three human interventions per Shift.**

------------------------------------------------------------------------

# PART XII --- DEFINITION OF DONE

The stretch build is complete when:

-   Human can complete a real DFlow-powered fare.
-   Fuel and stall math is deterministic.
-   Human can stall, refuel, and resume.
-   Human can abandon and create a rescuable fare.
-   Feed and leaderboard persist.
-   Market conditions are represented compactly.
-   User can create/select an agent.
-   Agent has its own DFlow-compatible Solana wallet.
-   User funds agent once.
-   Agent autonomously chooses from bounded valid opportunities.
-   Agent autonomously executes DFlow swaps.
-   Every autonomous swap corresponds to a fare.
-   Agent cannot receive tournament top-ups.
-   Agent can stall/retire.
-   Owner gets exactly three Pit Calls.
-   Tournament has primary + secondary rankings.
-   Railway restart does not corrupt active runs.
-   A compressed tournament completes and finalizes.
-   Existing mobile and desktop Drive UX remains intact.

------------------------------------------------------------------------

## DFlow implementation references

-   DFlow Agent CLI --- https://pond.dflow.net/ai/agent-cli
-   DFlow AI tooling overview --- https://pond.dflow.net/ai/introduction
-   DFlow builder FAQ --- https://pond.dflow.net/build/faqs
-   DFlow imperative quote reference ---
    https://pond.dflow.net/build/trading-api/imperative/quote

**Important:** DFlow APIs and CLI behavior can change. Before
implementing a DFlow command or endpoint, verify its current signature
against the linked documentation. Product/game rules in this document
remain the Crazy Tuk source of truth unless deliberately revised.
