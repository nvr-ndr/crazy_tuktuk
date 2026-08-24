# CRAZY TUK --- AGENT MODE UI/UX REDESIGN HANDOFF

**Status:** Companion implementation document\
**Primary build plan:**
`CRAZY_TUK_FINAL_BUILD_AGENT_TOURNAMENT_HANDOFF.md`\
**Purpose:** Define how Agent Tournament mode should fit into the
existing Crazy Tuk mobile/desktop UI without creating a second visual
system or forcing the coding LLM to redesign screens while implementing
backend phases.

------------------------------------------------------------------------

# 1. HOW TO USE THIS DOCUMENT

The coding LLM should use this file **together with**
`CRAZY_TUK_FINAL_BUILD_AGENT_TOURNAMENT_HANDOFF.md`.

The build handoff defines **what systems to build and in what order**.

This document defines **how those systems should appear and behave in
the UI**.

If there is a conflict:

1.  Gameplay/system rules in the main build handoff win.
2.  UI/layout decisions in this document win for presentation.
3.  Existing working components should be reused unless this document
    explicitly replaces them.
4.  Do not perform a broad visual redesign of Drive Mode while
    implementing Tournament Mode.

The objective is to preserve the current Crazy Tuk identity while making
Agent Mode feel like a native extension of the same game.

------------------------------------------------------------------------

# 2. CURRENT UI BASELINE

The existing mobile build already establishes the visual system.

Current reusable surfaces include:

-   Bangkok map as the primary gameplay canvas.
-   Top navigation controls.
-   Fare marker + route preview.
-   Fare Found card.
-   Swap & Pick Up modal.
-   Passenger On Board / active ride card.
-   Bottom gameplay HUD.
-   Full-screen/large Dashboard overlay.
-   Dashboard / Swaps / History bottom navigation.
-   Large red primary CTA buttons.
-   Dark navy translucent cards.
-   Cream/white primary typography.
-   Yellow accent labels.
-   Red/orange action accents.
-   Rounded chunky game controls.
-   NPC portrait treatment.
-   Feed/review concepts.
-   Leaderboard shell.

**Do not replace this design language.**

Agent Mode should look like Crazy Tuk, not like a crypto trading
terminal.

------------------------------------------------------------------------

# 3. CORE UX PRINCIPLE

Separate information by purpose:

## MAP = ACTION / SPECTATING

The map should answer:

-   Where is my driver?
-   Who are they picking up?
-   Where are they going?
-   What is happening right now?
-   Did the agent choose a fare?
-   Is the swap executing?
-   Is the driver stalled?

Keep this surface visually light.

## DASHBOARD = INFORMATION

The Dashboard should answer:

-   How is my driver performing?
-   What is their rank?
-   What is their bankroll/PnL?
-   What strategy are they running?
-   How many Pit Calls remain?
-   What has happened this Shift?
-   What is their career record?

Information density belongs here, not on the map.

## GARAGE = CONFIGURATION

The Garage should answer:

-   Who is my agent?
-   What strategy do I want?
-   What is their wallet?
-   How much is the standardized bankroll?
-   Are they funded?
-   Can they enter the Shift?

## PIT CALL = LIMITED INTERVENTION

The Pit Call sheet should answer:

-   What is the current mandate?
-   What can I change?
-   How many calls remain?
-   What will the new mandate be?

This is not a manual trade screen.

------------------------------------------------------------------------

# 4. GLOBAL MOBILE RESPONSIVENESS CLEANUP

Before adding Agent Mode, fix compact text behavior throughout the
existing UI.

Observed issue: important labels/headlines such as `SWAP & PICK UP` can
wrap awkwardly on mobile.

## Required global rules

Primary action labels and major compact headings should not wrap.

Use patterns such as:

``` css
white-space: nowrap;
min-width: 0;
```

Use responsive font sizing where necessary:

``` css
font-size: clamp(MIN, PREFERRED, MAX);
```

For flex/grid children:

``` css
min-width: 0;
```

Use truncation only for genuinely variable strings such as wallet
addresses or exceptionally long destination names:

``` css
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;
```

## Wrapping hierarchy

### Never wrap when reasonably avoidable

-   primary CTA labels;
-   modal titles;
-   tab labels;
-   token symbols;
-   rank;
-   bankroll;
-   PnL;
-   compact HUD values;
-   Pit Call count.

### May wrap

-   NPC biography;
-   passenger dialogue;
-   explanatory text;
-   expanded market explanation;
-   strategy description.

### Prefer shrinking before wrapping

-   `SWAP & PICK UP`
-   `CONNECT WALLET`
-   `WATCH MY DRIVER`
-   `FUND & ENTER SHIFT`
-   tournament headings.

## Test widths

At minimum test:

-   320px
-   375px
-   390px
-   430px

Also test desktop.

Do not solve mobile overflow by making every card significantly taller.

------------------------------------------------------------------------

# 5. MODE ENTRY / NAVIGATION

Crazy Tuk has two primary gameplay contexts:

-   **DRIVE**
-   **TOURNAMENT**

Do not build separate applications.

A mode selector can live on the start/home screen and/or main menu.

Recommended naming:

`DRIVE`

`TOURNAMENT`

Avoid technical wording such as `AGENTIC MODE` in the primary consumer
UI.

Tournament mode can explain that drivers are autonomous once entered.

When switching modes, preserve the same map/art/navigation language.

------------------------------------------------------------------------

# 6. DRIVE MODE --- MINIMAL UI CHANGES

Drive Mode should remain recognizable.

Do not overload it with Agent Tournament information.

The main new visual addition is compact traffic/market information.

------------------------------------------------------------------------

# 7. FARE FOUND CARD REDESIGN

Current hierarchy is already strong:

-   NPC portrait
-   FARE FOUND
-   NPC name
-   biography
-   quote/dialogue
-   Swap Requirement
-   Reward
-   Fuel to Pickup
-   Passenger Patience
-   Swap & Pick Up

Preserve this structure.

## Add compact condition indicators

Do **not** create another large statistics row.

Recommended placement: near the `FARE FOUND` header or as a compact line
between header and dialogue.

Example:

``` text
FARE FOUND                 ROAD ●  MARKET ●
Nong Fah
```

or:

``` text
ROAD 🟢   MARKET 🟡
```

Use whichever treatment fits the existing typography best.

These are compact status indicators, not controls.

## Human-facing interpretation

`ROAD`

-   🟢 Light
-   🟡 Busy
-   🔴 Heavy

`MARKET`

-   🟢 Favorable/normal
-   🟡 Moderate
-   🔴 Difficult

Do not expose raw route-plan complexity or detailed DFlow data on the
default card.

A tap/expanded detail may show a short explanation.

Example:

`MARKET: YELLOW — moderate execution conditions`

## Existing 3-column information

Keep:

`SWAP REQUIREMENT | REWARD | FUEL TO PICKUP`

If later fuel math requires showing total trip fuel, do not
automatically add a fourth column. Prefer an expanded detail or concise
secondary line.

------------------------------------------------------------------------

# 8. SWAP MODAL

The current Swap & Pick Up modal already provides the right visual
primitive.

Preserve:

-   input token;
-   amount;
-   output token;
-   quote/output;
-   estimated fuel;
-   fare qualification;
-   slippage;
-   large CTA.

For human mode:

-   live DFlow quote;
-   player can adjust within fare rules;
-   wallet signs.

For Agent Mode:

reuse the visual language as a **read-only execution visualization**,
not an editable form.

Example Agent state:

``` text
DFLOW SWAP

USDC → BONK
3.00 USDC

ESTIMATED FUEL
+9

MARKET
🔴 HEAVY

AGENT DECISION
✓ QUALIFIES
```

Status CTA area becomes non-interactive status:

`DAO APPROVED`

then:

`EXECUTING...`

then:

`CONFIRMED`

Do not make spectators press a swap button.

------------------------------------------------------------------------

# 9. ACTIVE RIDE CARD --- DRIVE MODE

Preserve current card.

Existing content:

-   Passenger On Board
-   destination
-   route progress
-   passenger quote
-   progress bar
-   passenger name
-   fuel/score metrics

This is already a strong game surface.

Only add stall/recovery states when required by the main build plan.

------------------------------------------------------------------------

# 10. ACTIVE RIDE CARD --- AGENT MODE

Reuse the same component.

The upper half remains ride-focused:

``` text
PASSENGER ON BOARD
Driving to W District                     42%

"Take me to W District!"
```

Add a compact agent identity/status line:

``` text
🤖 DEGEN DAO · AGGRESSIVE · PIT ●●○
```

Do not add full strategy controls here.

## Replace lower metric cards in Tournament context

Recommended:

``` text
BANKROLL        PNL          RANK
$23.81          +19.1%       #12 ↑4
```

Crazy Score/fare count can live in the bottom HUD or Dashboard.

Alternative if bankroll is visually redundant elsewhere:

``` text
CRAZY SCORE     PNL          RANK
8,420           +19.1%       #12
```

Choose one layout and keep it consistent.

------------------------------------------------------------------------

# 11. AGENT IDLE / DECISION VISUALIZATION

Agent autonomy must be visible during the demo.

When the agent becomes idle:

``` text
🤖 LOOKING FOR A FARE...
```

The system evaluates a bounded shortlist.

When a candidate is being considered, briefly show a lightweight
decision treatment.

Example:

``` text
DEGEN DAO IS THINKING...

+ HIGH REWARD
+ SHORT PICKUP
- MARKET 🔴
```

Then:

``` text
FARE ACCEPTED
```

Do not display chain-of-thought or model reasoning.

These are **server-generated reason labels** derived from known decision
features.

Examples of allowed labels:

-   HIGH REWARD
-   SHORT PICKUP
-   LONG RIDE
-   GOOD MARKET
-   MARKET RISK
-   LOW FUEL COST
-   HIGH DIFFICULTY
-   PROTECTING LEAD
-   AGGRESSIVE FIT
-   SURVIVAL RISK

Limit to roughly 2--4 concise labels.

Then transition to the read-only DFlow swap visualization.

------------------------------------------------------------------------

# 12. BOTTOM GAMEPLAY HUD

Preserve the existing compact bottom HUD.

## Drive

Existing concept:

`GAS | STATUS | POINTS`

## Tournament

Recommended:

`BANKROLL | AGENT STATUS | CRAZY SCORE`

Example:

``` text
$23.81       ON ROUTE       ★ 8,420
```

or:

``` text
PNL +19%     ON ROUTE       #12
```

Do not attempt to show every tournament metric here.

The HUD exists for glanceable information.

------------------------------------------------------------------------

# 13. DASHBOARD --- MAJOR REDESIGN AREA

The existing Dashboard is the correct place to expand Agent Mode.

It currently has substantial unused vertical space and stub statistics.

Generalize the Dashboard component so it can render:

`context = DRIVER`

or:

`context = AGENT`

Do not create two unrelated dashboard systems.

------------------------------------------------------------------------

# 14. DRIVER DASHBOARD

Keep the human version relatively simple.

Hero:

``` text
DRIVER
anon
Wallet not connected / wallet shorthand
```

Primary stats:

-   Points
-   Fuel
-   Completed
-   Today

As asynchronous features mature, optionally add:

-   Stalls
-   Rescues
-   Rating
-   Distance

Do not mix tournament financial statistics into human Drive mode.

------------------------------------------------------------------------

# 15. AGENT DASHBOARD --- HERO

Recommended hero structure:

``` text
[AGENT PORTRAIT]

AGENT DRIVER
DEGEN DAO

#12 · BANGKOK SHIFT #0042
Wallet 7Fs...91x
```

If the Shift is live, include a small state indicator:

`● LIVE`

Possible agent states:

-   REGISTERED
-   IDLE
-   EVALUATING
-   SWAPPING
-   DRIVING
-   STALLED
-   RETIRED
-   FINISHED

Use player-friendly labels rather than backend enum strings.

------------------------------------------------------------------------

# 16. AGENT DASHBOARD --- CURRENT SHIFT

This should be the first major information block.

Title:

`CURRENT SHIFT`

Four priority cards:

``` text
RANK             BANKROLL
#12 ↑4           $23.81

PNL              CRAZY SCORE
+19.1%           8,420
```

Then a compact metadata row:

``` text
31 fares · $76 volume · 14h 21m left
```

Optional secondary metrics lower in the page:

-   stalls;
-   distance;
-   max drawdown;
-   market difficulty average;
-   efficiency.

Do not put all of them in the first viewport.

------------------------------------------------------------------------

# 17. AGENT DASHBOARD --- STRATEGY CARD

Title:

`CURRENT STRATEGY`

Primary badge:

`AGGRESSIVE`

Show a compact summary, not a giant configuration form.

Example:

``` text
Risk             ████████░░
Activity         ███████░░░
Max allocation   15%
Priority         SCORE
Tokens           SOL · USDC · BONK · WIF
```

Use human-readable values where sliders are unnecessary.

Then:

``` text
PIT CALLS    ● ● ○
```

Primary/secondary CTA:

`MAKE PIT CALL`

Disable when:

-   no calls remain;
-   Shift is not live;
-   agent is retired/finished;
-   server says intervention is temporarily unavailable.

------------------------------------------------------------------------

# 18. PIT CALL SHEET

Use a modal/bottom-sheet visual treatment consistent with the current
swap modal.

Title:

`PIT CALL`

Subtitle:

`2 OF 3 REMAINING`

Controls may include:

### Risk

`SAFE ←────────→ DEGEN`

### Activity

`PATIENT ←──────→ HYPER`

### Priority

Use either a segmented selector or weighted presets:

-   PROFIT
-   BALANCED
-   SCORE

### Max allocation preference

Within tournament hard limits.

### Token preference

Only within tournament whitelist.

Example chips:

`USDC ✓`\
`SOL ✓`\
`BONK ✓`\
`WIF ✓`

Footer warning:

`THIS USES 1 PIT CALL`

Large CTA:

`CONFIRM PIT CALL`

Cancel/close remains available.

A Pit Call never contains:

-   direct buy/sell buttons;
-   specific fare selection;
-   arbitrary mint input;
-   bankroll top-up.

After confirmation show a brief toast/status:

`STRATEGY UPDATED · 1 PIT CALL REMAINING`

------------------------------------------------------------------------

# 19. DASHBOARD --- CAREER SECTION

Below Current Shift and Strategy:

`CAREER`

Suggested cards:

``` text
SHIFTS           WINS
14               1

PODIUMS          BEST RANK
3                #1
```

Optional:

-   career fares;
-   career PnL;
-   best Shift;
-   zero-Pit achievements.

This gives persistent identity to the generated driver.

------------------------------------------------------------------------

# 20. DASHBOARD BOTTOM NAVIGATION

Current:

`Dashboard | Swaps | History`

This can remain.

Consistency is more valuable than renaming tabs merely because the user
is in Agent Mode.

## Dashboard

Current state, performance, strategy, career.

## Swaps

Financial/execution activity.

## History

Human context: rides/activity history.

Agent context: Shift history and significant run events.

If implementation becomes confusing, labels may become:

`Agent | Swaps | Shifts`

but **default recommendation is to retain the existing navigation
labels**.

------------------------------------------------------------------------

# 21. AGENT SWAPS TAB

Turn the current stub into useful execution history.

Header:

`SWAP ACTIVITY`

Summary cards can retain the current design:

-   Total Swaps
-   Confirmed
-   Swap Volume
-   Stalls

For Agent Mode consider replacing `Stalls` with `PnL` if stalls already
appear elsewhere.

Below the summary, add transaction rows.

Example:

``` text
SOL → BONK
$3.00
14:32

Fare: Nong Fah
Market 🟡
CONFIRMED
```

Tap row → transaction detail.

Detail may show:

-   pair;
-   amount;
-   output;
-   DFlow status;
-   signature;
-   fare;
-   fuel generated;
-   market indicator;
-   timestamp.

Do not turn this into a trading interface.

------------------------------------------------------------------------

# 22. HISTORY TAB --- AGENT MODE

Use this for tournament career/history.

Example cards:

``` text
SHIFT #0042
#12
+19.1% PNL
31 FARES
8,420 SCORE
2 PIT CALLS
```

``` text
SHIFT #0041
#4
+8.2% PNL
47 FARES
11,290 SCORE
0 PIT CALLS
FULL AUTONOMY
```

``` text
SHIFT #0040
STALLED
-94%
27 FARES
```

Tap a Shift to open Results detail.

------------------------------------------------------------------------

# 23. TOURNAMENT LOBBY

Reuse the full-screen Dashboard/modal visual system.

Do not create a new website-style page.

## Registration state

``` text
BANGKOK SHIFT #0042

STARTS IN
03:42:18

183 DRIVERS REGISTERED
20 USDC STARTING BANKROLL
3 PIT CALLS
```

If user has no registered agent:

`ENTER TOURNAMENT`

If agent exists but is unfunded:

`FUND DRIVER`

If funded/registered:

`DRIVER READY`

## Live state

``` text
BANGKOK SHIFT #0042

● LIVE
14:21:08 REMAINING
```

Three compact cards:

``` text
DRIVERS        REMAINING        STALLED
212            183              29
```

Leaderboard preview:

``` text
LEADER
UNCLE LEK
12,481 PTS
```

Owner's agent card:

``` text
DEGEN DAO
#12 · $23.81 · +19.1%
```

Primary CTA:

`WATCH MY DRIVER`

Secondary:

`VIEW LEADERBOARD`

------------------------------------------------------------------------

# 24. GARAGE

The Garage is the main genuinely new screen.

Reuse:

-   Dashboard overlay;
-   existing hero cards;
-   NPC portraits;
-   dark statistic cards;
-   yellow labels;
-   large red CTA.

## Character selection

For MVP, generate/show approximately three candidate drivers.

Each card:

``` text
[portrait]

DEGEN DAO
AGGRESSIVE

"Traffic laws are suggestions."
```

The persona text is flavor. Strategy is editable after selection.

Primary:

`HIRE DRIVER`

Do not build elaborate vehicle customization for MVP.

------------------------------------------------------------------------

# 25. GARAGE --- DRIVER CONFIGURATION

After selecting agent:

Hero:

``` text
[portrait]

DEGEN DAO
AGENT DRIVER
```

Strategy configuration:

``` text
DRIVING STYLE
AGGRESSIVE
```

Controls:

-   Risk
-   Activity
-   Priority
-   Max allocation
-   Token preferences

Use presets first.

Recommended top-level presets:

-   CONSERVATIVE
-   BALANCED
-   AGGRESSIVE

Advanced controls may expand underneath.

This prevents the initial flow from feeling like a trading bot
configuration panel.

------------------------------------------------------------------------

# 26. GARAGE --- WALLET / FUNDING

Show wallet as identity, not as scary infrastructure.

Card:

``` text
AGENT WALLET

7Fs3...91x
```

Copy icon optional.

Do not expose private key.

Funding card:

``` text
TOURNAMENT BANKROLL

20 USDC

One-time funding for this Shift.
No top-ups after the Shift begins.
```

State machine:

### Not created

`CREATE DRIVER`

### Wallet created / unfunded

`FUND 20 USDC`

### Funding transaction pending

`FUNDING...`

### Funded

`✓ DRIVER FUNDED`

### Registered

`ENTER SHIFT` / `DRIVER READY`

Use the existing wallet connection UX for the owner's signing step.

------------------------------------------------------------------------

# 27. RESULTS SCREEN

Use the Dashboard/full-screen overlay style.

Hero:

``` text
SHIFT #0042 COMPLETE

[portrait]
DEGEN DAO

#7 OVERALL
```

Primary stats:

``` text
CRAZY SCORE      PNL
18,420           +19.1%

FARES            ENDING BANKROLL
53               $23.81
```

Secondary:

-   stalls;
-   max drawdown;
-   volume;
-   Pit Calls used;
-   category ranks.

Awards/badges may include:

-   FULL AUTONOMY
-   PNL LEADER
-   WORKHORSE
-   SURVIVOR
-   DEGEN
-   EFFICIENCY

Actions:

`VIEW SHIFT HISTORY`

`WITHDRAW / RETIRE`

`PREPARE NEXT SHIFT`

Do not require a new agent identity every Shift.

------------------------------------------------------------------------

# 28. LEADERBOARD

Tournament leaderboard should prioritize quick comparison.

Recommended row:

``` text
#12   [portrait] DEGEN DAO
      8,420 pts     +19.1%
      31 fares
```

Optional tiny status:

`DRIVING`

`IDLE`

`STALLED`

Primary sort:

`CRAZY SCORE`

Tabs/filters:

-   SCORE
-   PNL
-   FARES
-   EFFICIENCY
-   AUTONOMY

Do not show every metric simultaneously on mobile.

------------------------------------------------------------------------

# 29. GLOBAL FEED --- TOURNAMENT EVENTS

Reuse the existing feed concept.

Possible events:

``` text
🤖 Degen Dao completed a fare
Nong Fah ★★★★★
+90 pts
```

``` text
🔧 Degen Dao made a Pit Call
Aggressive → Balanced
```

``` text
💀 Speedy Somchai stalled out
27 fares · -94%
```

``` text
🏆 Uncle Lek took the lead
12,481 pts
```

Feed is how other agents feel present without synchronized map
rendering.

------------------------------------------------------------------------

# 30. OTHER AGENTS ON THE MAP

MVP rule:

**Do not render all active tournament agents as authoritative
synchronized cars.**

This creates unnecessary:

-   realtime state;
-   collision/ownership questions;
-   visual clutter;
-   mobile performance cost.

The player's own agent is the primary map character.

Other agents exist through:

-   leaderboard;
-   feed;
-   announcements.

Optional later:

-   decorative ghost cars;
-   recent leader route traces;
-   non-interactive silhouettes.

These are derived visuals only.

------------------------------------------------------------------------

# 31. MARKET + ROAD TRAFFIC VISUAL SYSTEM

Keep the representation consistent everywhere.

Use:

-   GREEN
-   YELLOW
-   RED

Potential UI:

``` text
ROAD    ●
MARKET  ●
```

or compact traffic-light glyphs.

Do not rely on color alone; labels or icon states should remain
interpretable.

## Map/fare card

Tiny indicators only.

## Dashboard/History

May show text:

`MARKET: HEAVY`

## Agent decision state

May use reason labels:

`- MARKET RISK`

## Raw DFlow details

Only in expanded swap/transaction details.

The frontend consumes a normalized Crazy Tuk enum. It should not
independently derive thresholds from raw DFlow quote data.

------------------------------------------------------------------------

# 32. EMPTY / LOADING / ERROR STATES

Agent Mode will have asynchronous backend operations. Design these
intentionally.

## Agent evaluating

`LOOKING FOR A FARE...`

## DFlow quote loading

`CHECKING MARKET...`

## Trade pending

`EXECUTING SWAP...`

## Confirmation

`SWAP CONFIRMED`

## No eligible fares

`WAITING FOR A BETTER FARE...`

## Recoverable DFlow failure

`QUOTE MISSED · LOOKING AGAIN`

Do not surface raw technical error text to normal users.

## Agent stalled

Use strong game language:

``` text
OUT OF GAS

DEGEN DAO HAS STALLED
```

Show final/current state and appropriate tournament action.

------------------------------------------------------------------------

# 33. VISUAL DENSITY RULES

The current UI works because the map remains visible behind compact dark
cards.

Preserve this.

## Map overlays

Maximum information priority:

1.  Current action.
2.  Passenger/destination.
3.  Progress.
4.  Three glanceable metrics.
5.  One optional strategy/status line.

Everything else belongs in Dashboard.

## Dashboard

Can scroll vertically and hold dense information.

## Garage

Can scroll vertically.

## Fare card

Do not exceed the current approximate density merely to expose DFlow
internals.

## Desktop

Do not simply scale mobile cards enormously.

Use sensible max widths and allow map breathing room.

------------------------------------------------------------------------

# 34. COMPONENT REUSE PLAN

Prefer adapting these conceptual components:

``` text
FareCard
SwapPanel
ActiveRideCard
BottomHUD
DashboardOverlay
ProfileHero
StatCard
BottomTabs
TransactionList
HistoryList
Leaderboard
NPCPortrait
PrimaryButton
StatusChip
```

Add:

``` text
TournamentLobby
Garage
AgentStrategyCard
PitCallSheet
TournamentResults
TrafficIndicator
AgentDecisionStatus
```

Where practical:

``` text
DashboardOverlay(context="DRIVER" | "AGENT")
ActiveRideCard(driverType="HUMAN" | "AGENT")
BottomHUD(mode="DRIVE" | "TOURNAMENT")
SwapPanel(mode="INTERACTIVE" | "AGENT_READONLY")
```

Avoid duplicating entire component trees.

------------------------------------------------------------------------

# 35. UI STATE CONTRACT

Frontend should render from authoritative state, not infer important
game states from animations.

Useful top-level state:

``` text
mode:
  DRIVE
  TOURNAMENT
```

Agent live states:

``` text
REGISTERED
IDLE
EVALUATING
QUOTING
SWAPPING
DRIVING_TO_PICKUP
DRIVING_PASSENGER
STALLED
RETIRED
FINISHED
```

Frontend maps these to player-friendly labels.

Example:

``` text
EVALUATING → LOOKING FOR FARE
QUOTING → CHECKING MARKET
SWAPPING → SWAPPING
DRIVING_TO_PICKUP → PICKING UP
DRIVING_PASSENGER → ON ROUTE
```

------------------------------------------------------------------------

# 36. IMPLEMENTATION SEQUENCE

This UI work should follow the backend/gameplay phases rather than
precede them all at once.

## UI PASS A --- NOW

1.  Fix mobile text wrapping/overflow.
2.  Centralize responsive typography rules.
3.  Add reusable `TrafficIndicator`.
4.  Add Road/Market indicators to Fare Card.
5.  Ensure existing Drive UI remains unchanged otherwise.

## UI PASS B --- HUMAN LOOP

6.  Add stall state to Active Ride Card.
7.  Add Refuel & Continue.
8.  Add Call for Rescue.
9.  Add rescue feed event.
10. Complete real Swap activity list.

## UI PASS C --- TOURNAMENT FOUNDATION

11. Add mode navigation.
12. Add Tournament Lobby shell.
13. Add Garage shell.
14. Generalize Dashboard for Agent context.
15. Generalize Active Ride Card for Agent context.
16. Generalize Bottom HUD.

## UI PASS D --- LIVE AGENT

17. Add agent idle/evaluating status.
18. Add server-generated decision reason labels.
19. Add read-only Agent DFlow swap visualization.
20. Add Agent ride HUD.
21. Add current Shift dashboard stats.

## UI PASS E --- MANAGEMENT

22. Add Strategy card.
23. Add Pit Call sheet.
24. Add Agent Swaps tab.
25. Add Agent Shift History.
26. Add career stats.

## UI PASS F --- COMPETITION

27. Complete Tournament leaderboard.
28. Add tournament feed events.
29. Add Results screen.
30. Add awards/badges.
31. Test compressed Shift end-to-end.

------------------------------------------------------------------------

# 37. MOBILE ACCEPTANCE TESTS

At 320/375/390/430 widths:

-   `SWAP & PICK UP` remains legible and intentional.
-   No primary CTA unexpectedly wraps.
-   Modal titles do not collide with close button.
-   Fare stats remain readable.
-   Traffic indicators do not force Fare Card to grow substantially.
-   Long NPC names do not break layout.
-   Long destination names truncate/wrap intentionally.
-   Agent identity does not collide with rank/status.
-   `$23.81`, `+19.1%`, `#12`, and score remain visually dominant.
-   Pit Call dots fit on one line.
-   Bottom tabs fit.
-   No horizontal scrolling.
-   Safari bottom chrome does not hide required controls.
-   Scrollable Dashboard/Garage content remains reachable above bottom
    navigation.

------------------------------------------------------------------------

# 38. DESKTOP ACCEPTANCE TESTS

-   Map remains dominant.
-   Cards use max-widths rather than stretching excessively.
-   Dashboard can use 2-column stat layouts where appropriate.
-   Garage configuration can use wider controls.
-   Tournament Lobby does not become sparse/empty.
-   Existing mobile visual hierarchy remains recognizable.

------------------------------------------------------------------------

# 39. DO NOT BUILD / DO NOT REDESIGN

Until core tournament functionality works, do not spend time on:

-   new design system;
-   radically different Agent Mode colors;
-   candlestick charts;
-   order books;
-   professional trading-terminal UI;
-   full portfolio analytics;
-   synchronized opponent cars;
-   vehicle customization;
-   NFT inventory;
-   agent private-key UI;
-   multi-agent owner management;
-   complex animated strategy graphs;
-   unnecessary chart libraries;
-   giant DFlow route diagrams on the fare card.

The game should remain playful and legible.

------------------------------------------------------------------------

# 40. FINAL TARGET EXPERIENCE

## Human

The user opens Crazy Tuk, sees fares on Bangkok, evaluates a passenger,
sees simple Road/Market conditions, executes a DFlow swap, receives
fuel, drives the route, hears passenger dialogue, completes the ride,
receives a review and score, and appears in asynchronous shared systems.

## Agent owner

The user enters Tournament, hires a generated driver, chooses a simple
strategy, funds the driver's wallet once, and watches the driver
autonomously play the same economic game.

On the map, the owner sees:

`LOOKING → EVALUATING → FARE ACCEPTED → DFLOW SWAP → PICKUP → RIDE → RESULT`

The owner does not manually trade.

The Dashboard shows performance.

The Garage configures the driver.

Three Pit Calls allow limited strategic intervention.

The leaderboard/feed make other agents feel present.

The Results screen turns each Shift into a persistent career record.

------------------------------------------------------------------------

# 41. DESIGN SUMMARY FOR THE CODING LLM

Do not invent a second Agent application.

**Reuse the current Crazy Tuk interface.**

Map = gameplay/spectating.\
Dashboard = stats/management.\
Garage = configuration/funding.\
Pit Call = limited intervention.\
Swaps = DFlow execution history.\
History = rides/Shifts/career.\
Leaderboard/feed = asynchronous competition.

Keep DFlow complexity underneath a playful game abstraction.

Humans see:

`ROAD 🟢 / MARKET 🟡`

Agents receive the detailed market inputs.

The strongest proof of autonomy is not more UI. It is visibly showing
the sequence:

`agent evaluates → agent accepts → agent wallet swaps → tuk-tuk drives`

while the owner watches rather than clicks.

That is the UI story to preserve throughout implementation.
