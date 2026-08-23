# Crazy Tuk — Game Rules

## 0. Purpose

This document defines the gameplay rules for **Crazy Tuk**.

It is intentionally separate from the main MVP implementation plan so balancing and gameplay changes can be made without bloating the build spec.

Primary design goal:

> **Keep the game understandable in seconds, but allow funny and strategic situations to emerge from fuel, geography, fare conditions, and stalls.**

For the hackathon MVP, all values in this document should be treated as **configurable defaults**, not sacred final balance.

---

# 1. Core Gameplay Loop

The game loop is:

1. Player connects a Solana wallet.
2. Player receives:
   - a tuk-tuk,
   - a random starting location,
   - starting fuel.
3. Available passengers appear on the player's Bangkok map.
4. Each passenger has:
   - pickup location,
   - expiry timer,
   - swap condition,
   - point reward,
   - hidden destination.
5. Player either:
   - selects a passenger before swapping, or
   - makes a normal DFlow swap and lets Crazy Tuk auto-match a qualifying passenger.
6. A successful confirmed DFlow swap:
   - awards fuel,
   - may activate a fare,
   - or refuels an existing active/stalled trip.
7. Player travels to pickup.
8. Passenger enters.
9. Destination is revealed.
10. Tuk-tuk drives toward destination.
11. If fuel is sufficient:
   - fare completes,
   - points awarded.
12. If fuel is insufficient:
   - tuk-tuk stalls,
   - passenger begins waiting,
   - another successful swap is required to continue.
13. Repeat.

---

# 2. Player State

Each player has:

```text
wallet
currentLocation
fuel
status
points
completedFares
stallCount
activeFare
selectedFare
```

Player status:

```text
AVAILABLE
PICKUP
DRIVING
STALLED
```

---

# 3. Starting State

On first wallet connection:

```text
startingFuel = configurable
startingLocation = random eligible location
status = AVAILABLE
points = 0
```

Recommended MVP default:

```text
STARTING_FUEL = 20
```

Starting locations should exclude:
- airports,
- special-event-only nodes,
- extreme outer locations.

The starting player should usually have at least **2 reachable fares**.

---

# 4. Fuel

Fuel is the core resource.

## 4.1 How Fuel Is Earned

Fuel is awarded only after a DFlow swap:

- is signed,
- submitted,
- confirmed successfully,
- has not already been processed.

Failed or cancelled swaps award:

```text
0 fuel
```

---

## 4.2 MVP Fuel Curve

Use simple tiers first.

Recommended placeholder:

| Approx. Swap USD | Fuel |
|---:|---:|
| $1–$4.99 | 3 |
| $5–$9.99 | 5 |
| $10–$24.99 | 8 |
| $25–$49.99 | 12 |
| $50–$99.99 | 16 |
| $100+ | 20 |

This is intentionally non-linear.

The player should feel rewarded for larger swaps, but a whale should not gain proportionally infinite movement.

---

## 4.3 Future Fuel Curve

Post-MVP, consider:

```text
fuel = round(A * log10(usdValue + B))
```

with min/max clamping.

This is not required for Day 1.

---

## 4.4 Fuel Carryover

Unused fuel remains in the player's tank.

Example:

```text
Player has: 3 fuel
Trip needs: 8 more
Swap gives: 12 fuel

8 fuel completes trip
7 fuel remains
```

No fuel is discarded.

---

## 4.5 Fuel Cap

MVP:

```text
NO HARD CAP
```

Post-MVP optional:

```text
MAX_FUEL = 100
```

Do not add a cap until actual behavior suggests it is useful.

---

# 5. Geography and Travel Cost

Each game location has coordinates.

Travel cost is determined from:

```text
currentLocation → pickup
pickup → destination
```

MVP can use:
- approximate coordinate distance,
- simplified route distance,
- or a manual cost matrix.

The exact method is implementation detail.

Gameplay only needs:

```text
pickupFuelCost
tripFuelCost
```

---

## 5.1 Pickup Cost

The player must have enough fuel to reach the passenger before the fare can begin.

Recommended MVP rule:

```text
requiredToClaim = pickupFuelCost
```

The player does **not** need enough fuel to complete the passenger's hidden destination.

This preserves risk.

---

## 5.2 Destination Cost

Destination is hidden until pickup is complete.

Once passenger enters:

```text
tripFuelCost = revealed
```

This creates the core Crazy Taxi surprise.

---

# 6. Available Fares

Each player should normally have:

```text
MIN_ACTIVE_FARES = 5
MAX_ACTIVE_FARES = 8
```

When:
- a fare expires,
- a fare is completed,
- a selected fare becomes invalid,

the system replenishes the pool.

---

# 7. Fare Data

Each fare contains:

```text
id
npcId
pickupLocationId
destinationLocationId
swapCondition
minimumUsd
pointValue
expiresAt
status
```

Destination remains hidden in UI until passenger pickup.

---

# 8. Fare Expiry

Passenger fares exist for limited periods.

Recommended MVP lifetimes:

```text
COMMON      10–20 min
UNCOMMON    15–30 min
RARE        20–45 min
SPECIAL     30–60 min
```

These times can be randomized.

Do not synchronize all NPCs to the same clock.

Independent timers make the map feel alive.

---

# 9. Fare Availability Guarantee

To avoid a dead board, the system should attempt to ensure:

- at least 1 cheap/simple fare available,
- at least 1 medium fare,
- occasionally 1 aspirational/high-value fare.

Recommended rolling guarantee:

```text
At least one ANY_SWAP or SOL_PAIR fare
with minimum <= $5
```

per active fare pool.

---

# 10. Fare Conditions

MVP condition types:

```text
ANY_SWAP
SOL_PAIR
STABLE_TO_STABLE
STABLE_TO_VOLATILE
VOLATILE_TO_STABLE
MIN_USD
```

---

## 10.1 ANY_SWAP

Condition:

```text
usdValue >= minimumUsd
```

---

## 10.2 SOL_PAIR

Condition:

```text
inputToken == SOL
OR
outputToken == SOL
```

plus:

```text
usdValue >= minimumUsd
```

---

## 10.3 STABLE_TO_STABLE

Condition:

```text
input.category == stable
AND
output.category == stable
```

---

## 10.4 STABLE_TO_VOLATILE

Condition:

```text
input.category == stable
AND
output.category == volatile
```

---

## 10.5 VOLATILE_TO_STABLE

Condition:

```text
input.category == volatile
AND
output.category == stable
```

---

## 10.6 MIN_USD

Any pair may qualify if:

```text
usdValue >= minimumUsd
```

Used for higher-value passengers.

---

# 11. Selected Fare Behavior

A player may tap an NPC and select that fare.

Selected fare becomes:

```text
PREFERRED
```

but not active.

The next successful swap checks the selected fare first.

If swap qualifies:
- assign fare.

If swap does not qualify:
- award fuel normally,
- keep selected fare if it has not expired,
- do not auto-match a different passenger unless configured.

Recommended MVP behavior:

```text
SELECTED_FARE_STRICT = true
```

This makes selection meaningful and predictable.

---

# 12. Automatic Fare Matching

If no fare is selected, a confirmed swap checks all available fares.

Filter by:

1. swap condition matches,
2. fare not expired,
3. pickup is reachable after fuel award.

Then rank candidates.

Recommended MVP ranking:

```text
1. highest pointValue
2. shortest expiresAt
3. shortest pickup distance
```

Assign the top result.

If none qualify:

```text
fuel only
```

---

# 13. Pickup

After fare assignment:

```text
status = PICKUP
```

Fuel required to pickup is consumed.

If enough fuel exists:
- tuk-tuk travels to pickup,
- passenger enters,
- destination reveals.

MVP pickup animation can be short.

Recommended:

```text
2–5 seconds
```

No real-time travel duration is needed.

---

# 14. Destination Reveal

When pickup completes:

Show:

```text
passenger
destination
tripFuelCost
currentFuel
risk warning
```

Example:

```text
Destination: Suvarnabhumi Airport
Trip fuel: 24
Current fuel: 17

WARNING: YOU MAY STALL
```

Player may proceed even if fuel is insufficient.

This is intentional.

---

# 15. Driving

Once passenger is onboard:

```text
status = DRIVING
```

The system compares:

```text
currentFuel
vs
remainingTripFuelCost
```

If sufficient:
- complete journey.

If insufficient:
- drive proportionally until fuel reaches zero,
- set STALLED.

---

# 16. Stall Rules

A stall occurs when:

```text
fuel == 0
AND
remainingTripFuelCost > 0
```

Store:

```text
stalledAt
remainingFuelRequired
progressAtStall
```

Player status:

```text
STALLED
```

---

## 16.1 Stall Timer

Stall timer runs in real-world time.

It does not stop when:
- player closes browser,
- app is backgrounded,
- wallet disconnects.

Display:

```text
now - stalledAt
```

---

## 16.2 Stall Penalty Cap

Gameplay/rating penalty should cap.

Historical wait time should not.

Recommended placeholder:

```text
STALL_PENALTY_CAP = 30 min
```

After 30 minutes:
- rating cannot worsen further,
- actual stall time continues recording.

Example:

```text
Penalty time: 30m cap
Actual stall: 3d 7h 19m
```

This supports funny long-term records without making the game punitive.

---

# 17. Refueling While Stalled

Any subsequent confirmed DFlow swap:

1. awards fuel,
2. applies fuel to remaining trip,
3. resumes trip if possible.

Example:

```text
Remaining trip: 8 fuel
Swap reward: 13 fuel

8 completes journey
5 remains
```

No new passenger is assigned while STALLED.

---

# 18. Swapping While Driving

If player makes a swap during PICKUP or DRIVING:

- award fuel,
- apply it to current active journey,
- do not assign another passenger.

The player can use repeated swaps to ensure completion.

---

# 19. Fare Completion

When destination is reached:

1. set fare COMPLETE,
2. award fare points,
3. increment completed fare count,
4. update player location,
5. return player to AVAILABLE,
6. clear active fare,
7. generate NPC completion review/event,
8. replenish fare pool.

---

# 20. Fare Points

MVP values should be simple.

Suggested base scale:

| Fare Type | Points |
|---|---:|
| Easy / cheap | 10–20 |
| Standard | 25–40 |
| Harder condition | 45–70 |
| High-value / rare | 80–120 |
| Special | 150+ |

Point value can depend on:
- swap requirement difficulty,
- pickup distance,
- expected trip distance,
- rarity.

For Day 1, manually assign points.

---

# 21. Leaderboard

Primary leaderboard ranking:

```text
totalPoints DESC
```

Display:

```text
rank
wallet/display name
completedFares
points
```

Do not use rating to determine leaderboard position.

This allows:
- reckless high-scoring drivers,
- safe highly rated drivers,

to coexist.

---

# 22. Driver Rating — Post-MVP Rule Stub

Rating is cosmetic/reputation-focused.

Recommended basic model:

Each completed fare starts at:

```text
5 stars
```

Reduce based on stall duration.

Example:

| Stall Time | Rating |
|---:|---:|
| none | 5 |
| <30 sec | 4 |
| 30–90 sec | 3 |
| 90 sec–3 min | 2 |
| >3 min | 1 |

Penalty timing may cap mechanically while real duration remains visible.

Not required for core MVP.

---

# 23. NPC Reviews

NPC reviews are generated from:

```text
npc personality
fare result
stall duration
destination
trip duration
```

MVP can use templates.

No LLM required.

Example categories:

```text
clean_trip
short_stall
long_stall
extreme_stall
fast_trip
airport_trip
```

---

# 24. Global Feed — Post-MVP Rule Stub

Feed events can include:

```text
FARE_COMPLETE
PLAYER_STALLED
PLAYER_REFUELED
LONG_STALL
NPC_REVIEW
RANK_CHANGE
RESCUE_REQUEST
RESCUE_COMPLETE
```

NPC comments are public.

Players do not post.

---

# 25. Long-Stall Flavor

Actual stall duration may generate increasingly dramatic public commentary.

Suggested milestones:

```text
5 min
15 min
30 min
1 hour
6 hours
24 hours
3 days
```

Example:

```text
5m:
"We haven't moved."

30m:
"Is another driver coming?"

24h:
"My flight was yesterday."

3d:
"I live here now."
```

These are flavor only unless rescue is enabled.

---

# 26. Rescue System — Stretch Rules

Rescue is not required for Day-One MVP.

After a configurable stall threshold:

```text
RESCUE_ELIGIBLE_AFTER = 30 min
```

Passenger may become rescue eligible.

---

## 26.1 Rescue Request

A rescue request contains:

```text
originalPlayer
npc
originalDestination
strandedDuration
newRescueCondition
rescuePoints
expiresAt
```

Rescue condition is newly generated.

It does not need to match original fare condition.

---

## 26.2 Rescue Claim

Another player completes the rescue swap condition.

First successful qualifying confirmed swap claims the rescue.

The rescued passenger becomes part of rescuer's asynchronous run.

Original player's active fare ends as:

```text
ABANDONED
```

---

## 26.3 Rescue Reward

Suggested:

```text
remainingFareValue + rescueBonus
```

Example:

```text
remaining fare: 42
rescue bonus: 30
total: 72
```

---

## 26.4 Rescue Escalation

Optional future mechanic:

As rescue waits longer:

```text
requirement becomes easier
reward becomes larger
```

Example:

```text
30m:
Stable → SOL >= $10
+25

45m:
SOL pair >= $5
+40

60m:
Any swap >= $1
+60
```

Not MVP.

---

# 27. NPC Spawn Rules

NPC personas are reusable.

A persona can appear many times over an epoch.

NPC spawn chooses:

```text
persona
pickup location
destination
condition
expiry
points
```

Persona and location combinations should be constrained by preferences later.

For MVP:
- random valid combinations are acceptable.

---

# 28. Destination Selection

Destination must not equal pickup.

Prefer distance bands.

Example:

```text
SHORT
MEDIUM
LONG
VERY_LONG
```

Rare passengers may have greater chance of long destinations.

Airport should be relatively rare.

Suggested MVP airport chance:

```text
5–10%
```

Enough to create comedy without every fare being brutal.

---

# 29. Risk Design Principle

The game should allow bad decisions.

Do not require enough fuel to complete a fare before accepting it.

This is deliberate.

The game becomes interesting when players choose:

```text
safe nearby fare
vs
high-value risky fare
```

Stalling is content, not merely failure.

---

# 30. No Game Over

Crazy Tuk has no permanent game-over state.

If player stalls:

```text
make another swap
```

If passenger later abandons player:

```text
player becomes AVAILABLE again
```

Player always has a path back into play.

---

# 31. Anti-Duplicate Swap Rule

Every DFlow swap used by Crazy Tuk must be processed exactly once.

Use:

```text
confirmed transaction signature
```

as unique event ID.

If signature already processed:

```text
award nothing
```

This is critical.

---

# 32. Minimum Swap Rule

Recommended MVP global minimum:

```text
MIN_GAME_SWAP_USD = $1
```

Swaps below this:
- may still execute through DFlow,
- but do not award game fuel or qualify for fares.

This prevents trivial dust spam.

Can be tuned.

---

# 33. Token Categories

MVP token categories:

```text
stable
volatile
```

No more categories are needed initially.

Example:

```text
USDC = stable
USDT = stable

SOL = volatile
BONK = volatile
JUP = volatile
PENGU = volatile
```

---

# 34. Current Supported MVP Tokens

Suggested initial list:

```text
SOL
USDC
USDT
BONK
JUP
PENGU
```

Expand only after core loop is stable.

---

# 35. Game Configuration Constants

All tunable values should live in one config file.

Suggested:

```text
STARTING_FUEL
MIN_GAME_SWAP_USD

MIN_ACTIVE_FARES
MAX_ACTIVE_FARES

COMMON_EXPIRY_MIN
COMMON_EXPIRY_MAX

PICKUP_ANIMATION_SECONDS

STALL_PENALTY_CAP
RESCUE_ELIGIBLE_AFTER

AIRPORT_DESTINATION_CHANCE

FUEL_TIERS

AUTO_MATCH_PRIORITY
SELECTED_FARE_STRICT
```

---

# 36. Recommended Day-One Defaults

```text
STARTING_FUEL = 20

MIN_GAME_SWAP_USD = 1

MIN_ACTIVE_FARES = 5
MAX_ACTIVE_FARES = 8

FARE_EXPIRY_MIN = 10 min
FARE_EXPIRY_MAX = 45 min

PICKUP_ANIMATION = 3 sec

STALL_PENALTY_CAP = 30 min

RESCUE_ELIGIBLE_AFTER = disabled

AIRPORT_DESTINATION_CHANCE = 0.07

SELECTED_FARE_STRICT = true
```

---

# 37. MVP Test Scenarios

## Test A — Normal Fare

```text
Player AVAILABLE
fuel = 20

Select SOL_PAIR fare
pickup cost = 3

Make $5 SOL → USDC
swap confirms
+5 fuel

pickup succeeds
destination reveals
trip costs 12

fare completes
points awarded
player AVAILABLE
```

---

## Test B — Auto-Match

```text
No fare selected

Player makes $10 USDC → SOL
swap confirms
+8 fuel

system finds:
ANY_SWAP
SOL_PAIR
STABLE_TO_VOLATILE

system chooses highest-point reachable fare
fare assigned
```

---

## Test C — Fuel Only

```text
No matching fares

swap confirms
+fuel

no passenger assigned
player remains AVAILABLE
```

---

## Test D — Stall

```text
Current fuel after pickup = 8
trip cost = 15

travel reaches 53%
fuel = 0

status = STALLED
remaining cost = 7
```

---

## Test E — Resume

```text
Player STALLED
remaining cost = 7

make DFlow swap
+12 fuel

7 completes trip
5 fuel remains

points awarded
status = AVAILABLE
```

---

## Test F — Duplicate Signature

```text
confirmed signature already exists

interpretConfirmedSwap called again

fuel awarded = 0
fare changes = 0
```

---

# 38. MVP Success Criteria

The gameplay rules are functioning correctly when:

- [ ] Player can make a successful DFlow swap.
- [ ] Successful swap awards correct fuel.
- [ ] Failed swap awards no fuel.
- [ ] Duplicate swap cannot be farmed.
- [ ] Fare condition matching works.
- [ ] Manual selected fare works.
- [ ] Auto-match works.
- [ ] Pickup fuel is consumed.
- [ ] Destination remains hidden until pickup.
- [ ] Player can accept a fare they cannot finish.
- [ ] Insufficient fuel produces a stall.
- [ ] Stall timer persists.
- [ ] Another swap resumes stalled fare.
- [ ] Excess fuel carries over.
- [ ] Fare completion awards points.
- [ ] Player returns to AVAILABLE.
- [ ] Leaderboard uses points.

---

# 39. Design Rule for Future Mechanics

Any new mechanic should answer at least one of these:

1. Does it make the swap more meaningful?
2. Does it make geography more meaningful?
3. Does it create a funny/social consequence from player behavior?
4. Does it improve retention without making the core loop harder to understand?

If not, do not add it.

---

# 40. Core Rule Summary

The game can be explained in five lines:

> **Every confirmed DFlow swap gives you fuel.**

> **Some swaps also qualify you for passengers.**

> **Passengers have hidden destinations.**

> **If you run out of fuel, you stall until you swap again.**

> **Deliver passengers to earn points and climb the leaderboard.**
