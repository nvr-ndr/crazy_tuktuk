# CRAZY TUKTUK — CRAZY EVENT SYSTEM

## Status

Implementation planning document for the Crazy Event ride system.

This document defines **how events work inside an active ride**. Event content, individual event definitions, and art-generation prompts live separately in:

`CRAZY_TUK_EVENTS_MASTER.md`

---

# 1. System Goal

Crazy Events turn the passenger-to-destination portion of CrazyTukTuk into an active gameplay and spectator layer.

A ride is not simply:

`Accept Fare → Pickup → Wait → Destination`

Instead:

`Accept Fare → Pickup → Ride → Crazy Event(s) → Outcomes / Decisions → Destination → Final Result`

Events can:

- add or remove trip time
- consume or save fuel
- award CRAZY score
- affect tips/rewards
- create temporary ride modifiers
- trigger passenger reactions
- require player decisions
- require autonomous-agent decisions
- introduce risk/reward opportunities
- create memorable spectator moments during tournaments

The event system should make rides feel unpredictable without requiring a full traffic simulation or dynamic navigation system.

---

# 2. Core Technical Principle

## Events modify simulation state, not the visible route

The visible tuk-tuk continues following the route that was generated when the ride began.

Crazy Events **do not require MapLibre to calculate a new route**.

If an event says:

> TAKE THE SOI  
> Shortcut! -25 seconds.

the tuk-tuk does not actually leave the rendered route.

Instead:

```text
visual route = unchanged
ride time remaining -= 25 seconds
```

Likewise:

> DETOUR  
> +30 seconds, -2 fuel

does not generate a detour polyline.

The event engine modifies the underlying ride state and the existing route animation adjusts its timing accordingly.

This separation is important for MVP scope.

---

# 3. Supported Game Modes

The same Crazy Event engine should support both major driving contexts.

## Drive Mode

The human player controls event decisions.

```text
Event triggers
      ↓
Interstitial appears
      ↓
Player chooses A / B
      ↓
Outcome resolves
      ↓
Effects applied
      ↓
Ride continues
```

AUTO events resolve without a decision.

## Agent Mode

The autonomous driver controls event decisions.

```text
Event triggers
      ↓
Interstitial / spectator event appears
      ↓
Agent evaluates available choices
      ↓
Agent chooses
      ↓
Outcome resolves
      ↓
Effects applied
      ↓
Ride continues
```

The event itself should not need separate definitions for Drive Mode and Agent Mode.

The only difference is **who selects the choice**.

---

# 4. Event Types

The event content layer supports six primary categories.

| Type | Code | Behavior |
|---|---|---|
| Incident | `AUTO` | Resolves automatically |
| Decision | `CHOICE` | Driver chooses between options |
| Gamble | `RISK` | Choice leads to weighted outcomes |
| Opportunity | `OPPORTUNITY` | Optional diversion or reward |
| Passenger | `PASSENGER` | Passenger initiates situation |
| Rare / Wild | `WILD` | Low-frequency, unusual event |

These categories describe presentation and behavior. Internally, most events ultimately resolve through the same outcome engine.

---

# 5. Ride State

Each active ride should expose a state object that Crazy Events are allowed to modify.

Example conceptual structure:

```ts
type RideState = {
  rideId: string
  fareId: string
  passengerId: string
  driverId: string

  mode: "DRIVE" | "AGENT"

  routeDurationSeconds: number
  remainingSeconds: number
  progress: number

  fuel: number
  crazyScore: number
  tip: number

  eventCount: number
  eventHistory: EventHistoryEntry[]

  activeModifiers: RideModifier[]

  status:
    | "TO_PICKUP"
    | "RIDING"
    | "EVENT"
    | "STALLED"
    | "COMPLETE"
}
```

Exact names can match the existing codebase.

The important point is that Crazy Events operate against a small, explicit ride-state interface rather than reaching into unrelated game systems.

---

# 6. Event Trigger Window

Events should only trigger during the passenger ride.

They should **not** normally trigger:

- before accepting a fare
- while traveling to pickup
- during wallet signing
- while another Crazy Event is active
- after the destination has been reached

Recommended eligible state:

```text
ride.status === RIDING
passenger onboard === true
activeEvent === null
```

Each event may further specify:

```json
"trigger": {
  "minRideProgress": 0.2,
  "maxRideProgress": 0.75,
  "minRemainingSeconds": 30,
  "oncePerRide": true
}
```

This prevents awkward events from firing immediately after pickup or one second before arrival.

---

# 7. Event Frequency

Crazy Events should feel surprising rather than constant.

For MVP, use a simple event budget per ride.

Recommended starting behavior:

| Ride length | Event target |
|---|---:|
| Very short | 0–1 |
| Normal | 0–2 |
| Long | 1–2 |
| Very long | 1–3 |

These values are balancing targets, not permanent rules.

A ride should not guarantee an event unless the design later determines that every ride needs one.

## Recommended initial constraints

```text
MAX_EVENTS_PER_RIDE = 2
MIN_SECONDS_BETWEEN_EVENTS = 30
MIN_PROGRESS_FOR_EVENT = 0.15
MAX_PROGRESS_FOR_EVENT = 0.85
```

Longer rides may eventually raise `MAX_EVENTS_PER_RIDE`.

---

# 8. Trigger Strategy

For MVP, avoid checking for events every frame.

Instead, when a ride begins:

1. Determine whether the ride will contain events.
2. Determine approximate eligible trigger progress points.
3. Store those trigger points on the ride.
4. When ride progress crosses a trigger point, select an eligible event.

Conceptually:

```ts
ride.eventSchedule = [
  { progress: 0.37, resolved: false },
  { progress: 0.68, resolved: false }
]
```

This makes event frequency easier to balance and prevents frame-rate-dependent randomness.

The actual event should be selected **when the trigger occurs**, so current ride state and active modifiers can affect eligibility.

---

# 9. Event Selection

When a scheduled event point is reached:

```text
Get all events
      ↓
Filter by eligibility
      ↓
Filter cooldown / duplicate restrictions
      ↓
Apply rarity + weight
      ↓
Weighted random selection
      ↓
Activate event
```

Possible eligibility conditions include:

- minimum ride progress
- maximum ride progress
- minimum remaining time
- sufficient fuel
- passenger present
- mode
- zone
- time of day
- weather/state flags
- prior event history
- required modifier
- excluded modifier

MVP does not need all of these conditions implemented immediately.

The JSON should remain extensible enough to add them.

---

# 10. Rarity

Recommended rarity tiers:

```text
COMMON
UNCOMMON
RARE
WILD
```

Rarity is primarily a content organization concept.

Actual selection should use numeric `weight`.

Example:

```json
{
  "rarity": "COMMON",
  "weight": 10
}
```

versus:

```json
{
  "rarity": "WILD",
  "weight": 1
}
```

This allows balancing without changing code.

`WILD` events should remain genuinely surprising.

---

# 11. Event Lifecycle

Every event follows the same high-level state machine.

```text
INACTIVE
   ↓
TRIGGERED
   ↓
PRESENTING
   ↓
AWAITING_CHOICE (when applicable)
   ↓
RESOLVING
   ↓
SHOWING_RESULT
   ↓
COMPLETE
   ↓
RIDE RESUMES
```

AUTO events skip `AWAITING_CHOICE`.

---

# 12. Ride Behavior During an Event

For the MVP, the ride simulation should effectively pause while the primary event card is asking the player for a decision.

This prevents decision speed from affecting trip performance.

Recommended:

```text
Event opens
→ ride countdown pauses
→ route animation pauses or dramatically slows
→ player chooses
→ result appears
→ effects apply
→ route resumes
```

For Agent Mode, the event can use a short artificial decision delay for readability.

Example:

```text
Event appears
→ 1–2 second beat
→ agent choice visually highlighted
→ outcome resolves
→ ride resumes
```

The agent calculation itself should be immediate. The delay is presentation only.

---

# 13. Event UI

The core event presentation uses the 4:5 artwork defined in the master event document.

Suggested layout:

```text
┌─────────────────────────┐
│                         │
│                         │
│      EVENT ARTWORK      │
│          4:5            │
│                         │
│                         │
├─────────────────────────┤
│ FLOODED SOI!            │
│ The shortcut is         │
│ disappearing underwater │
│                         │
│ [ SEND IT ] [ DETOUR ]  │
└─────────────────────────┘
```

The artwork itself contains:

- no title
- no UI
- no choice labels
- no result numbers

These remain game UI elements so content can be changed without regenerating artwork.

---

# 14. AUTO Event Presentation

AUTO events should be fast.

Example:

```text
MONITOR LIZARD!

A local resident has right of way.

[ART]

+15 SEC
+50 CRAZY
```

Suggested presentation duration:

`2–4 seconds`

The player should not need to manually dismiss routine AUTO events unless testing shows that manual dismissal feels better.

---

# 15. Choice Event Presentation

Example:

```text
FLOODED SOI!

The shortcut is disappearing underwater.

[ART]

[SEND IT]
Risk the crossing.

[DETOUR]
Take the safe route.
```

After selection:

```text
YOU MADE IT!

-20 SEC
-2 FUEL
+100 CRAZY
```

Then resume the ride.

---

# 16. Choice Information

Not every event needs to expose exact probabilities.

This is an important design choice.

The player can see qualitative information such as:

```text
SEND IT
High risk • Faster

DETOUR
Safe • Slower
```

rather than:

```text
65% success
35% failure
```

The underlying probabilities remain explicit in JSON.

This preserves some uncertainty and makes the events feel like decisions rather than spreadsheet optimization.

Exact numbers can be exposed later if desired.

---

# 17. Event Outcomes

All event branches ultimately resolve into an outcome.

Example:

```json
{
  "id": "cross_success",
  "weight": 65,
  "effects": {
    "timeSeconds": -20,
    "fuel": -2,
    "crazy": 100,
    "tip": 0
  },
  "reactionTag": "RISK_WIN",
  "resultText": "You blast through!"
}
```

The resolver should:

1. select the outcome
2. apply numerical effects
3. apply modifiers
4. generate passenger reaction
5. record event history
6. show result UI
7. resume ride

---

# 18. Time Effects

Time changes should modify the simulated remaining ride time.

Example:

```ts
remainingSeconds += outcome.effects.timeSeconds
```

Negative value:

```text
-20 seconds = faster trip
```

Positive value:

```text
+30 seconds = delay
```

## Route Animation

Because the visible route remains unchanged, route animation speed should recalculate after a time effect.

Conceptually:

```text
remaining route distance
÷
new remaining ride time
=
new visual movement speed
```

Therefore:

- shortcut outcome → tuk-tuk moves somewhat faster over remaining route
- delay outcome → tuk-tuk moves somewhat slower or pauses before continuing

For explicit stalls, the vehicle may simply remain stationary temporarily.

---

# 19. Stalls

Some outcomes should produce a visible stall.

Examples:

- engine trouble
- flood failure
- train crossing
- procession
- flat tire

A stall can be represented as:

```json
"stallSeconds": 30
```

or initially folded into `timeSeconds`.

Long term, separating the two is preferable:

```json
"effects": {
  "timeSeconds": 10,
  "stallSeconds": 20
}
```

This allows the game to visually stop the tuk-tuk for 20 seconds and then add another 10 seconds to the remaining travel calculation.

For MVP, `stallSeconds` is recommended if it is inexpensive to implement because it makes events visibly understandable.

---

# 20. Fuel Effects

Fuel remains part of the driver's strategic resource state.

Example:

```json
"fuel": -3
```

Events can therefore create tradeoffs:

```text
Shortcut:
-20 sec
-4 fuel

Normal route:
+0 sec
-1 fuel
```

A player or agent with low fuel may rationally choose differently from one with a full tank.

---

# 21. CRAZY Score

CRAZY is the system's reward for entertaining, bold, unusual, or skillful outcomes.

Examples:

```text
Wait patiently at traffic:
0 CRAZY

Thread impossible traffic gap:
+75 CRAZY

Race rival tuk-tuk:
+150 CRAZY

Survive bizarre WILD event:
+250 CRAZY
```

CRAZY should not simply equal financial success.

This creates a secondary incentive toward entertaining risk.

The exact relationship between CRAZY and leaderboard/tournament scoring should be defined with the broader scoring system.

---

# 22. Tips / Passenger Rewards

Some events may affect the passenger's reward.

Examples:

```text
Stop for requested photo:
+time
+tip

Ignore passenger request:
no time penalty
-tip

Help lost tourist:
+time
+bonus
```

For MVP this can remain simple.

Passenger mood does not need to become a full simulation system yet.

---

# 23. Temporary Modifiers

The event format should allow temporary ride modifiers even if only one or two are used initially.

Example:

```json
{
  "modifier": {
    "id": "lucky",
    "duration": "RIDE",
    "effects": {
      "negativeEventPenaltyMultiplier": 0.5
    }
  }
}
```

Potential modifiers:

- `LUCKY`
- `RUSHED`
- `ENGINE_STRESSED`
- `PASSENGER_HAPPY`
- `PASSENGER_ANNOYED`
- `FUEL_SAVER`

Example:

**Lucky Shrine**

```text
STOP
+15 sec
Gain LUCKY

KEEP GOING
No effect
```

Later:

```text
Engine Sputter normally:
+30 sec

With LUCKY:
+15 sec
```

Modifiers should be used sparingly in MVP.

---

# 24. Autonomous Agent Decision System

Agent Mode should not simply choose the mathematically optimal event branch every time.

Drivers should have behavioral personalities.

Recommended initial traits:

```ts
type DriverPersonality = {
  aggression: number
  patience: number
  greed: number
  riskTolerance: number
  passengerFocus: number
  chaos: number
}
```

Normalize values to a consistent range such as:

```text
0.0 → 1.0
```

or:

```text
-1.0 → 1.0
```

Use whichever better matches the existing driver data.

---

# 25. Choice Biases

Choices expose personality affinities.

Example:

```json
{
  "id": "cross",
  "label": "SEND IT",
  "agentBias": {
    "aggression": 0.8,
    "riskTolerance": 0.9,
    "patience": -0.5,
    "chaos": 0.4
  }
}
```

A safe choice might be:

```json
{
  "id": "detour",
  "label": "DETOUR",
  "agentBias": {
    "aggression": -0.5,
    "riskTolerance": -0.7,
    "patience": 0.7
  }
}
```

---

# 26. Agent Decision Scoring

Initial conceptual formula:

```text
choice score =
personality affinity
+ ride-state utility
+ small randomness
```

Example factors:

```text
personality affinity
    aggression × choice.aggression
  + patience × choice.patience
  + greed × choice.greed
  + riskTolerance × choice.riskTolerance
  + passengerFocus × choice.passengerFocus
  + chaos × choice.chaos

ride-state utility
  + low-fuel penalty
  + lateness pressure
  + expected reward
  + tournament context

randomness
  + small random value
```

This means the agent has tendencies, not deterministic scripts.

Two aggressive drivers can still occasionally make different decisions.

---

# 27. Agent Context Awareness

Personality should influence decisions, but current state should matter too.

Example:

A highly aggressive agent normally chooses:

`SEND IT`

But if:

```text
fuel = critically low
```

and SEND IT consumes significant fuel, the utility penalty may cause the agent to choose:

`DETOUR`

Likewise, a greedy agent may accept a side opportunity when the expected reward is high.

This makes autonomous drivers feel strategic rather than merely random.

---

# 28. Tournament Mode

Crazy Events are particularly useful in Tournament Mode because they create variance and spectator stories between otherwise similar routes.

Two agents can accept similar fares and still produce different outcomes because:

- different events trigger
- different choices are made
- probabilistic outcomes differ
- driver personalities differ
- temporary modifiers differ

Example:

```text
Agent A
→ Flooded Soi
→ SEND IT
→ success
→ saves 20 sec

Agent B
→ Flooded Soi
→ DETOUR
→ loses 20 sec

Agent C
→ no flood event
```

The tournament therefore becomes more than pure fare selection.

---

# 29. Fairness in Competitive Modes

Randomness should matter without overwhelming strategy.

Important balancing principles:

- avoid enormous common-event penalties
- keep catastrophic outcomes rare
- ensure riskier choices generally offer meaningful upside
- keep event frequency broadly comparable across agents
- do not let a single common random event decide an entire tournament
- make WILD events entertaining but sufficiently rare
- log every event and outcome for transparency

If necessary, tournament mode can later use its own event weights.

---

# 30. Pit Calls and Crazy Events

Existing Tournament Mode pit calls can eventually interact with event decisions.

Possible future behavior:

```text
Agent encounters event
      ↓
Normally agent chooses
      ↓
Player spends Pit Call
      ↓
Player overrides choice
```

Example:

```text
FLOODED SOI

Agent intends:
SEND IT

[PIT CALL]
Override → DETOUR
```

This would make Pit Calls considerably more meaningful.

It is **not required for initial Crazy Event MVP implementation**, but the event architecture should not prevent it.

---

# 31. Passenger Dialogue System

Writing unique responses for every passenger × every event does not scale.

Instead, each passenger receives a reaction profile.

Recommended profiles:

```text
CALM
IMPATIENT
NERVOUS
THRILL_SEEKER
GRUMPY
CHAOTIC
RESERVED
```

Events return generic reaction tags:

```text
DELAY_MINOR
DELAY_MAJOR
DANGER
LUCKY
SHORTCUT
WEIRD
RISK_WIN
RISK_FAIL
SAFE_CHOICE
DRIVER_RISK
DRIVER_SAFE
WIN
FAIL
```

Dialogue lookup:

```text
Passenger Profile
       +
Reaction Tag
       ↓
Dialogue Pool
       ↓
Random Appropriate Line
```

Example:

```text
Passenger = NERVOUS
Reaction = DRIVER_RISK

Possible lines:
"Are you sure about this?"
"Maybe we shouldn't."
"Uh... this is the shortcut?"
```

Important characters can later override specific event/reaction combinations with bespoke dialogue.

---

# 32. Event History

Every resolved event should be recorded.

Example:

```ts
type EventHistoryEntry = {
  eventId: string
  triggeredAtProgress: number
  choiceId?: string
  outcomeId: string

  effects: {
    timeSeconds: number
    fuel: number
    crazy: number
    tip: number
  }

  timestamp: number
}
```

This supports:

- final ride recap
- tournament spectator feed
- debugging
- analytics
- balancing
- replay
- player history

---

# 33. Ride Recap

At destination, Crazy Events can appear in the trip summary.

Example:

```text
RIDE COMPLETE

Base Fare                  +420
Perfect Gap                -18 sec
Flooded Soi                +40 sec
Rival Tuk-Tuk              +150 CRAZY
Passenger Tip              +35

FINAL TIME                  4:32
FUEL USED                   7
CRAZY                       225
```

This helps players understand why the ride ended differently from its initial estimate.

---

# 34. Spectator Feed

Agent/Tournament Mode should eventually surface event activity without forcing the viewer to open every driver.

Example feed:

```text
🦎 Driver 07 — Monitor Lizard! +15 sec
🏁 Driver 12 — Racing a rival tuk-tuk...
🌊 Driver 03 — SEND IT → STALLED!
⚡ Driver 08 — Perfect Gap! -18 sec
```

Clicking an active driver could show the full event card.

This makes autonomous tournaments much more watchable.

---

# 35. Event Data Architecture

Recommended organization:

```text
/src
  /data
    /events
      index.ts
      traffic.json
      weather.json
      animals.json
      mechanical.json
      passenger.json
      opportunities.json
      wild.json

/public
  /events
    traffic_gridlock.webp
    green_light_miracle.webp
    flooded_soi.webp
    monitor_lizard.webp
    ...
```

For a smaller MVP, all event definitions can live in:

```text
/src/data/events.json
```

and be split later.

Do not over-engineer the initial content loader.

---

# 36. Core Event Interface

Conceptual TypeScript interface:

```ts
type CrazyEventType =
  | "AUTO"
  | "CHOICE"
  | "RISK"
  | "OPPORTUNITY"
  | "PASSENGER"
  | "WILD"

type CrazyEvent = {
  id: string
  version: number

  title: string
  subtitle: string

  type: CrazyEventType
  rarity: "COMMON" | "UNCOMMON" | "RARE" | "WILD"
  weight: number

  tags: string[]

  art: {
    asset: string
    alt?: string
  }

  trigger?: EventTrigger

  outcomes?: EventOutcome[]
  choices?: EventChoice[]
}
```

---

# 37. Event Choice Interface

```ts
type EventChoice = {
  id: string
  label: string
  description?: string

  agentBias?: Partial<DriverPersonality>

  outcomes: EventOutcome[]
}
```

---

# 38. Event Outcome Interface

```ts
type EventOutcome = {
  id: string
  weight: number

  effects: {
    timeSeconds?: number
    stallSeconds?: number
    fuel?: number
    crazy?: number
    tip?: number
  }

  modifier?: RideModifier

  reactionTag?: string
  resultText?: string
}
```

---

# 39. Event Trigger Interface

```ts
type EventTrigger = {
  minRideProgress?: number
  maxRideProgress?: number
  minRemainingSeconds?: number

  oncePerRide?: boolean

  allowedModes?: ("DRIVE" | "AGENT")[]
  requiredTags?: string[]
  excludedTags?: string[]
}
```

Only implement the fields currently needed.

The rest can remain optional.

---

# 40. Event Engine Responsibilities

The Crazy Event engine should own:

```text
scheduleEventsForRide()
selectEligibleEvent()
startEvent()
resolveAutoEvent()
submitPlayerChoice()
selectAgentChoice()
resolveOutcome()
applyEventEffects()
applyModifier()
recordEventHistory()
completeEvent()
```

It should **not** own:

- map routing
- wallet signing
- fare discovery
- DFlow execution
- leaderboard rendering
- passenger art
- map marker creation

Those systems consume event results rather than becoming part of the event engine.

---

# 41. Suggested Runtime Flow

```text
RIDE START
    │
    ├── create event schedule
    │
    ▼
NORMAL ROUTE MOVEMENT
    │
    ├── progress crosses scheduled event point?
    │       │
    │       NO
    │       └──── continue
    │
    │       YES
    ▼
SELECT ELIGIBLE EVENT
    │
    ▼
PAUSE / SLOW RIDE
    │
    ▼
SHOW EVENT
    │
    ├── AUTO
    │      ↓
    │   resolve outcome
    │
    └── CHOICE / RISK / OPPORTUNITY / PASSENGER
           │
           ├── DRIVE → player chooses
           │
           └── AGENT → agent chooses
                         │
                         ▼
                   resolve outcome
                         │
                         ▼
APPLY EFFECTS
    │
    ├── time
    ├── stall
    ├── fuel
    ├── CRAZY
    ├── tip
    └── modifier
    │
    ▼
PASSENGER REACTION
    │
    ▼
SHOW RESULT
    │
    ▼
RECORD HISTORY
    │
    ▼
RESUME ROUTE
```

---

# 42. MVP Scope

The first implementation should stay deliberately narrow.

## Build now

- event JSON/data structure
- event loader
- ride event scheduler
- eligibility filtering
- weighted selection
- AUTO events
- A/B choice events
- weighted outcomes
- time effects
- fuel effects
- CRAZY effects
- optional tip effects
- basic stalls if straightforward
- player choice handling
- basic autonomous-agent choice handling
- event history
- 4:5 art display
- event result state
- passenger reaction hook
- approximately 20 curated events

## Stub / prepare for later

- temporary modifiers
- zone-specific events
- weather-specific event pools
- elaborate passenger mood simulation
- multi-stage events
- mini-games
- Pit Call overrides
- spectator event feed
- replay
- tournament-specific event weights
- event achievements
- dynamic route changes

## Do not build for MVP

- actual event-driven MapLibre rerouting
- simulated live Bangkok traffic
- physical traffic entities
- separate event engine for Agent Mode
- bespoke dialogue for every NPC/event combination
- complex branching story trees

---

# 43. Future Mini-Games

The event system should eventually support interactive mini-events without making them a dependency of v1.

Possible examples:

### Traffic Gap

Tap at the correct moment to thread through traffic.

### Flood Crossing

Hold/release throttle within a safe range.

### Engine Repair

Quick timing or pattern input.

### Rival Tuk-Tuk

Short reaction challenge.

### Passenger Item

Catch/recover an object.

These can eventually introduce:

```text
type: "MINIGAME"
```

The mini-game should return an `EventOutcome` just like every other event.

That means the rest of the system remains unchanged:

```text
Mini-game result
      ↓
EventOutcome
      ↓
applyEventEffects()
```

---

# 44. Content / Code Separation

A central design goal is that adding event #21 should primarily require:

1. Add artwork.
2. Add event JSON.
3. Add dialogue reaction tags only if genuinely new behavior is needed.
4. No ride-engine modification.

Example:

```text
/public/events/cobra_in_tuktuk.webp
```

plus:

```json
{
  "id": "cobra_in_tuktuk",
  "...": "..."
}
```

The engine should automatically be able to schedule and resolve it.

---

# 45. Balance Philosophy

Crazy Events should create **interesting variance**, not arbitrary punishment.

A useful distribution across the curated pool:

- positive events
- negative events
- neutral flavor events
- safe-vs-risk decisions
- time-vs-fuel decisions
- reward-vs-time decisions
- passenger-vs-driver-interest decisions
- rare absurd events

The optimal strategy should not always be:

> Choose the risky option.

Nor should it always be:

> Avoid risk.

Agent personality, current fuel, remaining time, reward state, and tournament position should make different choices rational in different circumstances.

---

# 46. Design Principle: The Story of the Ride

Crazy Events should ultimately answer:

> **What happened on the way there?**

The route itself may remain mechanically simple.

The event layer turns:

> Driver 12 completed a 4-minute ride.

into:

> Driver 12 got trapped behind a funeral procession, took a questionable soi to recover the lost time, raced another tuk-tuk, and somehow arrived 11 seconds early with almost no fuel left.

That distinction is central to the system.

Crazy Events are therefore not merely random modifiers.

They are the **narrative and decision layer of the ride**.

---

# 47. Relationship to Other CrazyTukTuk Systems

```text
FARE / DFlow SYSTEM
Determines:
"What ride did I take?"
        │
        ▼
ROUTE SYSTEM
Determines:
"Where am I going?"
        │
        ▼
CRAZY EVENT SYSTEM
Determines:
"What happened on the way?"
        │
        ▼
DRIVER / PLAYER DECISIONS
Determines:
"How did I respond?"
        │
        ▼
RIDE RESULT
Determines:
"How did the trip actually turn out?"
        │
        ▼
SHIFT / TOURNAMENT
Determines:
"How did that affect my overall performance?"
```

This keeps Crazy Events complementary to the DFlow-centered fare gameplay rather than replacing it.

---

# 48. Implementation Order

Recommended build sequence:

### Phase 1 — Data

1. Define TypeScript interfaces.
2. Add curated event JSON.
3. Add event artwork paths.
4. Validate event definitions.

### Phase 2 — Basic Runtime

5. Add event schedule to active ride.
6. Trigger event based on ride progress.
7. Pause ride.
8. Render event modal/interstitial.
9. Resolve AUTO event.
10. Apply effects.
11. Resume ride.

### Phase 3 — Player Choices

12. Render A/B choices.
13. Accept player selection.
14. Resolve weighted outcome.
15. Display result.
16. Apply ride-state changes.

### Phase 4 — Agents

17. Add driver personality values.
18. Add choice bias scoring.
19. Let agent select choices.
20. Add short spectator-readable decision delay.

### Phase 5 — Character Layer

21. Add passenger reaction profiles.
22. Add reaction-tag dialogue pools.
23. Trigger reaction after outcome.

### Phase 6 — Polish

24. Add event transition animation.
25. Add stat-change animation.
26. Add stall presentation.
27. Add event history to ride recap.
28. Balance event weights and effects.

---

# 49. First Content Target

Use `CRAZY_TUK_EVENTS_MASTER.md` as the source pool.

Initial production target:

**20 events**

Suggested composition:

```text
8 AUTO incidents
8 decision / risk events
4 opportunity / WILD events
```

Selection should prioritize:

- Bangkok specificity
- strong artwork
- immediately understandable situations
- mechanical diversity
- meaningful agent personality decisions
- mix of positive and negative effects
- spectator entertainment
- low implementation complexity

The selected 20 should be explicitly marked as `MVP` in the event data once finalized.

---

# 50. Final MVP Rule

If an event requires a special one-off gameplay system to function, it probably does not belong in the first 20.

The strongest MVP Crazy Events are those that can be expressed as:

```text
TRIGGER
+
ART
+
OPTIONAL A/B CHOICE
+
WEIGHTED OUTCOME
+
RIDE STATE EFFECT
+
PASSENGER REACTION
```

That common grammar is what allows the system to become large without becoming technically expensive.
