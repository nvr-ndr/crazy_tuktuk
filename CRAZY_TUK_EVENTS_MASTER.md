# CRAZY TUKTUK — CRAZY EVENTS MASTER

## Purpose

Crazy Events are short illustrated interstitial events that can occur while a passenger is already being driven from pickup to destination.

They add gameplay, personality, randomness, risk/reward, and spectator moments to the ride without requiring the visible MapLibre route to change.

**Core rule:** the tuk-tuk continues along its existing visual route. Crazy Events modify the simulated ride state instead of recalculating or visually rerouting the map.

Potential effects include:

- Time added or removed
- Fuel consumed or saved
- CRAZY score gained
- Tips or other rewards
- Temporary ride modifiers
- Passenger reactions
- Player or autonomous-agent decisions

The same event engine should support both player Drive Mode and autonomous Agent/Tournament Mode.

---

# 1. Event Taxonomy

| Type | Code | Behavior |
|---|---|---|
| Incident | `AUTO` | Event resolves automatically |
| Decision | `CHOICE` | Driver/player chooses between options |
| Gamble | `RISK` | Choice invokes weighted probability outcomes |
| Opportunity | `OPPORTUNITY` | Optional diversion or reward |
| Passenger | `PASSENGER` | Passenger initiates the situation |
| Rare / Wild | `WILD` | Low-frequency, high-flavor or high-chaos event |

Events may also carry tags such as:

`traffic`, `weather`, `bangkok`, `animal`, `mechanical`, `passenger`, `risk`, `lucky`, `social`, `weird`, `rare`, `shortcut`, `delay`

---

# 2. Core Ride Effects

For the initial implementation, keep event effects deliberately small and legible.

- `timeSeconds` — positive adds time; negative removes time
- `fuel` — modifies fuel
- `crazy` — adds or removes CRAZY score
- `tip` — modifies passenger tip/reward

Future systems may add:

- passenger mood
- temporary buffs/debuffs
- event-chain modifiers
- tournament-specific bonuses
- reputation

---

# 3. Master Event List

## Traffic & Bangkok Street Chaos

| ID | Event | Type | Core Mechanic |
|---|---|---|---|
| `traffic_gridlock` | Bangkok Gridlock | AUTO | +time |
| `green_light_miracle` | Green Light Miracle | AUTO | -time |
| `perfect_gap` | Perfect Gap | AUTO | -time, +CRAZY |
| `market_spillover` | Market Spillover | AUTO | +time |
| `train_crossing` | Train Crossing | CHOICE | wait vs detour |
| `funeral_procession` | Funeral Procession | CHOICE | wait vs respectful detour |
| `mystery_soi` | Mystery Soi | RISK | normal route vs shortcut gamble |
| `road_construction` | Surprise Roadworks | CHOICE | wait vs detour |
| `delivery_truck` | Delivery Truck Blockade | AUTO | +time |
| `wrong_way_motorbikes` | Motorbike Swarm | AUTO | +time / +CRAZY |
| `traffic_cop` | The Wave-Through | AUTO | -time |
| `road_block` | Road Block | CHOICE | wait vs find way around |

## Weather & Environment

| ID | Event | Type | Core Mechanic |
|---|---|---|---|
| `monsoon_burst` | Monsoon! | AUTO | +time / +fuel use |
| `flooded_soi` | Flooded Soi | RISK | cross vs detour |
| `heatwave` | Bangkok Heat | AUTO | fuel/time penalty |
| `fallen_branch` | Fallen Branch | CHOICE | squeeze through vs detour |
| `giant_puddle` | The Puddle | RISK | slow vs blast through |
| `tailwind` | Lucky Tailwind | AUTO | -time / fuel saving |
| `flash_flood` | Water Rising! | WILD | substantial randomized penalty |

## Animals

| ID | Event | Type | Core Mechanic |
|---|---|---|---|
| `monitor_lizard` | Monitor Lizard Crossing | AUTO | +time / +CRAZY |
| `street_dog` | Street Dog Standoff | AUTO | +time |
| `pigeon_apocalypse` | Pigeon Apocalypse | AUTO | +CRAZY |
| `cat_in_road` | The Cat | CHOICE | stop vs maneuver |
| `chicken_escape` | Chicken Run | AUTO | +time / +CRAZY |
| `pig_escape` | Pig Escape! | WILD | +time / +CRAZY |
| `elephant_traffic` | Elephant in Traffic | WILD | +time / large CRAZY |
| `soi_monkeys` | Monkey Business | WILD | randomized chaos |

## Mechanical / Tuk-Tuk

| ID | Event | Type | Core Mechanic |
|---|---|---|---|
| `engine_sputter` | Engine Sputter | AUTO | +time / fuel |
| `low_fuel` | Running on Fumes | CHOICE | refuel vs risk |
| `flat_tire` | Flat Tire | WILD | major delay |
| `engine_overheat` | Running Hot | CHOICE | stop vs push it |
| `mystery_rattle` | What's That Noise? | RISK | inspect vs ignore |
| `turbo_moment` | Somehow... Turbo | AUTO | -time / +CRAZY |
| `duct_tape_fix` | Bangkok Engineering | OPPORTUNITY | quick repair gamble |

## Passenger-Generated Events

| ID | Event | Type | Core Mechanic |
|---|---|---|---|
| `street_food_stop` | STOP! FOOD! | PASSENGER | stop vs refuse |
| `passenger_shortcut` | I Know a Shortcut | PASSENGER / RISK | trust passenger |
| `forgot_phone` | MY PHONE! | PASSENGER | turn back vs continue |
| `photo_stop` | Wait, Take My Picture! | PASSENGER | time vs tip |
| `wrong_destination` | Actually... | PASSENGER | destination confusion |
| `passenger_late` | I'm Late! | PASSENGER | aggressive vs normal driving |
| `passenger_nap` | Passenger Passed Out | PASSENGER | wake vs continue |
| `passenger_sick` | Uh Oh... | PASSENGER | stop vs push onward |
| `friend_spotted` | THAT'S MY FRIEND! | PASSENGER | stop vs continue |
| `lost_item` | Something Fell Out! | PASSENGER | retrieve vs continue |

## Opportunities

| ID | Event | Type | Core Mechanic |
|---|---|---|---|
| `rival_tuktuk` | Rival Tuk-Tuk | OPPORTUNITY / RISK | race vs ignore |
| `side_fare` | Quick Side Fare | OPPORTUNITY | reward vs time |
| `lucky_shrine` | Lucky Shrine | OPPORTUNITY | time cost for buff |
| `lost_tourist` | Lost Tourist | OPPORTUNITY | help for reward |
| `street_vendor_deal` | Roadside Deal | OPPORTUNITY | mystery modifier |
| `shortcut_tip` | Hot Tip | OPPORTUNITY | acquire shortcut information |
| `fallen_cash` | Money in the Road! | OPPORTUNITY | stop vs continue |

## Bangkok Insanity / Rare Events

| ID | Event | Type | Core Mechanic |
|---|---|---|---|
| `songkran_ambush` | Songkran Ambush! | WILD | time + large CRAZY |
| `movie_set_blockade` | Movie Set Blockade | WILD | blocked street / delay |
| `wedding_convoy` | Wedding Convoy | WILD | delay + CRAZY |
| `celebrity_spotted` | Celebrity?! | OPPORTUNITY | stop vs drive |
| `escaped_balloon` | Giant Balloon Attack | WILD | absurd minor delay |
| `street_dance` | Dance Break | OPPORTUNITY | time for CRAZY |
| `fireworks` | Surprise Fireworks | AUTO | CRAZY bonus |
| `tuktuk_parade` | Tuk-Tuk Parade | WILD | major CRAZY |
| `ghost_passenger` | Ghost in the Soi | WILD | rare supernatural event |
| `portal_soi` | That Soi Wasn't There Before | WILD | extreme shortcut gamble |

---

# 4. Recommended JSON Format

Events should be data-driven so new events can be added without modifying the core ride engine.

```json
{
  "id": "flooded_soi",
  "version": 1,

  "title": "FLOODED SOI!",
  "subtitle": "The shortcut is disappearing underwater.",

  "type": "RISK",
  "rarity": "COMMON",
  "weight": 10,

  "tags": [
    "weather",
    "traffic",
    "bangkok",
    "risk"
  ],

  "art": {
    "asset": "/events/flooded_soi.webp",
    "alt": "A tuk-tuk facing a flooded Bangkok soi"
  },

  "trigger": {
    "minRideProgress": 0.2,
    "maxRideProgress": 0.75,
    "minRemainingSeconds": 30,
    "oncePerRide": true
  },

  "choices": [
    {
      "id": "cross",
      "label": "SEND IT",
      "agentBias": {
        "aggression": 0.8,
        "riskTolerance": 0.9,
        "patience": -0.5
      },
      "outcomes": [
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
        },
        {
          "id": "cross_stall",
          "weight": 35,
          "effects": {
            "timeSeconds": 40,
            "fuel": -4,
            "crazy": 50,
            "tip": 0
          },
          "reactionTag": "RISK_FAIL",
          "resultText": "Bad idea. Very bad idea."
        }
      ]
    },
    {
      "id": "detour",
      "label": "DETOUR",
      "agentBias": {
        "aggression": -0.5,
        "riskTolerance": -0.7,
        "patience": 0.7
      },
      "outcomes": [
        {
          "id": "safe_detour",
          "weight": 100,
          "effects": {
            "timeSeconds": 20,
            "fuel": -2,
            "crazy": 0,
            "tip": 0
          },
          "reactionTag": "SAFE_CHOICE",
          "resultText": "Probably for the best."
        }
      ]
    }
  ]
}
```

## AUTO Event Example

```json
{
  "id": "monitor_lizard",
  "version": 1,

  "title": "MAKE WAY!",
  "subtitle": "A local resident has right of way.",

  "type": "AUTO",
  "rarity": "COMMON",
  "weight": 8,

  "tags": [
    "animal",
    "bangkok",
    "weird"
  ],

  "art": {
    "asset": "/events/monitor_lizard.webp",
    "alt": "A large monitor lizard crossing in front of a tuk-tuk"
  },

  "trigger": {
    "minRideProgress": 0.15,
    "maxRideProgress": 0.85,
    "oncePerRide": true
  },

  "outcomes": [
    {
      "id": "lizard_crossing",
      "weight": 100,
      "effects": {
        "timeSeconds": 15,
        "fuel": 0,
        "crazy": 50,
        "tip": 0
      },
      "reactionTag": "WEIRD",
      "resultText": "He is in absolutely no hurry."
    }
  ]
}
```

---

# 5. Agent Personality Hooks

Choice events should support autonomous decision-making through personality biases.

Initial driver parameters:

- `aggression`
- `patience`
- `greed`
- `riskTolerance`
- `passengerFocus`
- `chaos`

A choice can provide positive or negative affinities for these traits.

Example:

```json
"agentBias": {
  "aggression": 0.8,
  "riskTolerance": 0.9,
  "patience": -0.5,
  "chaos": 0.4
}
```

The eventual event-mode integration document should define the exact scoring formula used by autonomous drivers.

---

# 6. Passenger Reaction Architecture

Do **not** author bespoke dialogue for every NPC/event combination.

Instead, NPCs should have reaction profiles such as:

- `CALM`
- `IMPATIENT`
- `NERVOUS`
- `THRILL_SEEKER`
- `GRUMPY`
- `CHAOTIC`
- `RESERVED`

Events return broad reaction tags such as:

- `DELAY_MINOR`
- `DELAY_MAJOR`
- `DANGER`
- `LUCKY`
- `SHORTCUT`
- `WEIRD`
- `RISK_WIN`
- `RISK_FAIL`
- `SAFE_CHOICE`
- `DRIVER_RISK`
- `DRIVER_SAFE`
- `WIN`
- `FAIL`

Dialogue can then be selected from the intersection of:

`NPC reaction profile + event reaction tag`

Important NPCs may later receive a small number of bespoke event-specific Easter egg lines.

---

# 7. Event Artwork Specification

## Format

**Recommended ratio:** 4:5 portrait.

Suggested generation/export size:

`1024 × 1280`

The artwork should function as a centered illustrated interstitial over the map on desktop and mobile.

Artwork should contain **no baked-in UI or text**. Event title, description, choices, results, and stat changes should be rendered by the game UI.

## Camera / Shot Taxonomy

Event art should not inherit one default camera angle from the style reference. The **event determines the camera**.

Use these shot codes when planning and generating artwork:

- `DRIVER_POV` — seated driver eye-level view through the tuk-tuk
- `DRIVER_OTS` — just behind and slightly above the driver's shoulder
- `PASSENGER_POV` — seated rear-passenger eye-level view
- `PASSENGER_OTS` — just behind or beside the passenger position
- `LOW_ACTION` — external low-angle cinematic action shot focused on the event
- `SIDE_PROFILE` — wide side/profile shot showing the tuk-tuk and event spatially
- `ELEVATED` — slightly top-down / tactical view
- `HIGH_ANGLE_ACTION` — steep cinematic overhead-oblique view from roughly one to three stories above the street; close enough to clearly read the tuk-tuk, driver, obstacle, traffic flow, and surrounding road geometry while still feeling like action key art rather than a map
- `EXTERNAL_CINEMATIC` — wider spectacle-oriented exterior composition

### Interior Perspective Rule

For `DRIVER_POV` and `DRIVER_OTS`:

> Camera is positioned at realistic seated tuk-tuk driver eye height, clearly above the handlebars and above the road surface, looking slightly downward onto the street ahead. The visible roadway should fall away beneath the camera rather than rise toward it. Avoid low cockpit framing, dashboard-level camera placement, or any perspective that makes the driver appear below street level.

For `PASSENGER_POV`:

> Camera is positioned at realistic seated rear-passenger eye height, elevated above the road, looking slightly forward and downward through or past the tuk-tuk cabin.

### High-Angle Action Rule

For `HIGH_ANGLE_ACTION`:

> Camera is positioned high above the street at a steep three-quarter overhead angle, similar to a view from a low building, pedestrian bridge, or elevated balcony. The tuk-tuk and event should remain large and readable rather than tiny map-like objects. Use the angle to show how the obstacle disrupts the whole street: surrounding cars, motorbikes, pedestrians, animals, barriers, or production equipment should form a clear spatial pattern around the tuk-tuk.

Composition guidelines:

- keep the tuk-tuk as a major focal object, not a miniature
- preserve strong facial/body readability for the driver where visible
- the driver may lean out, stand beside the tuk-tuk, or gesture from the cabin when the event allows it
- preserve the same 4:5 portrait ratio and visual density as other event cards
- avoid true top-down / satellite-like framing
- avoid excessive distance, haze, depth blur, or tiny background characters
- favor crisp linework and readable silhouettes across the whole frame
- for active-fare events, keep the passenger hidden, cropped, shadowed, or otherwise non-specific

### Passenger Visibility Rule

For any event that occurs **during an active fare** but is **not passenger-generated**, imply that a passenger may be present without locking the artwork to a specific NPC.

Preferred treatments:

- hidden off-frame
- obscured by the driver, seat frame, roof pillar, motion, weather, smoke, splash, birds, or other event action
- partial hand, arm, shoulder, leg, or silhouette
- rear-seat shape visible without readable identity

If an exterior angle makes the passenger compartment clearly empty, that image should be treated as a **pickup-leg / pre-fare** version unless the composition can plausibly obscure the passenger area.

For passenger-generated events, the passenger's **action must be readable**, but their identity does not need to be.

## Master Style Prompt

Use this base prompt for every event image:

> Vertical 4:5 illustrated game event card artwork for CrazyTukTuk, set in Bangkok, Thailand. Stylized Southeast Asian adventure-anime aesthetic, chunky expressive silhouettes, bold variable ink outlines, hand-drawn characterful linework, cel-shaded lighting, slightly gritty urban texture, muted tropical natural colors with selective saturated accents, playful exaggerated perspective, energetic composition, contemporary Bangkok street details, expressive characters, humorous but cinematic mood. Designed as premium 2D indie game key art, not photorealistic, not 3D render. Use the style reference for art direction, character styling, linework, palette, and world consistency only; do not inherit its camera angle or passenger composition by default. Full-bleed illustration with one immediately readable focal event, strong foreground/midground/background separation. NO TEXT, NO LOGOS, NO UI, NO BORDER.

Append one of the following scene descriptions.

---

# 8. Event Art Prompts

## Traffic & Bangkok Street Chaos

### `traffic_gridlock` — Bangkok Gridlock

A tuk-tuk completely trapped in absurd Bangkok traffic, cars, taxis and motorbikes packed tightly around it, viewed preferably from realistic driver eye height looking slightly downward into the street ahead. The driver is tense at the controls; any passenger remains off-frame or only subtly implied. Towering city structures and tangled utility wires behind them, oppressive sense of everything being completely stuck.

### `green_light_miracle` — Green Light Miracle

A black tuk-tuk speeding triumphantly down a Bangkok avenue while a long sequence of traffic lights ahead simultaneously glow green, unusually empty road opening magically before the vehicle, driver shocked and delighted, dramatic speed lines and glorious lucky atmosphere.

### `perfect_gap` — Perfect Gap

A skilled tuk-tuk driver spotting an impossibly narrow opening between Bangkok traffic, preferably from driver POV or over-the-shoulder, dynamically slipping through the gap between cars and motorbikes. Exaggerated perspective and kinetic near-miss composition; any passenger is hidden by framing or only suggested with a partial hand gripping the rail.

### `market_spillover` — Market Spillover

A tuk-tuk encountering a bustling street market spilling directly into the roadway, fruit carts, umbrellas, baskets, vendors and pedestrians squeezing around the vehicle, colorful controlled chaos, driver searching for a tiny path through.

### `train_crossing` — Train Crossing

Driver POV or over-the-shoulder from a tuk-tuk stopped at a railway crossing as an old train thunders across directly ahead, striped barrier down, impatient motorbikes gathering around, dramatic movement contrasting with the stationary tuk-tuk. Passenger remains off-frame or subtly implied.

### `funeral_procession` — Funeral Procession

A tuk-tuk respectfully stopped behind a Thai funeral procession crossing a Bangkok neighborhood street, subdued ceremonial atmosphere, flowers and procession visible ahead, driver and passenger waiting quietly, respectful rather than comedic depiction.

### `mystery_soi` — Mystery Soi

Tuk-tuk at the entrance of an extremely narrow mysterious Bangkok soi branching away from a busy main road, tangled cables overhead, tiny signs, cats, plants and mysterious glowing depth, driver looking tempted by the improbable shortcut.

### `road_construction` — Surprise Roadworks

Tuk-tuk abruptly confronted by chaotic unanticipated street construction, orange barriers, excavated road, workers and machinery completely blocking the expected route, driver staring at the mess in disbelief.

### `delivery_truck` — Delivery Truck Blockade

A huge delivery truck awkwardly reversing across a tiny Bangkok soi and completely blocking a small tuk-tuk, workers casually unloading boxes while the tuk-tuk driver waits helplessly.

### `wrong_way_motorbikes` — Motorbike Swarm

A tuk-tuk surrounded by a spectacular swarm of motorbikes flowing around it from every possible direction, riders squeezing through impossible spaces, driver focused intensely, energetic Bangkok rush-hour choreography.

### `traffic_cop` — The Wave-Through

A Thai traffic officer dramatically waving a tuk-tuk through a congested intersection while stopped traffic surrounds it, tuk-tuk accelerating into the suddenly opened lane, driver pleasantly surprised.

### `road_block` — Road Block

Tuk-tuk confronting improvised barriers completely blocking a Bangkok street, confused driver leaning sideways to inspect the situation while alternate tiny alleys disappear into the surrounding neighborhood.

---

## Weather & Environment

### `monsoon_burst` — Monsoon!

Tuk-tuk caught suddenly in an intense tropical Bangkok downpour, preferably from driver POV or over-the-shoulder, enormous sheets of rain and water exploding from beneath the wheels. Driver hunched against the storm; any passenger is obscured by rain, spray, seat framing, and cabin shadow. City almost disappears behind the rainfall.

### `flooded_soi` — Flooded Soi

Driver POV or over-the-shoulder from a tuk-tuk stopped dramatically at the entrance of a deeply flooded Bangkok soi, brown rainwater stretching ahead, half-submerged curbs and objects, driver assessing whether the vehicle can make it. Any passenger remains hidden or only partially implied by framing.

### `heatwave` — Bangkok Heat

Tuk-tuk crawling beneath brutal midday Bangkok sun, visible shimmering heat distortion above asphalt, exhausted driver sweating dramatically, passenger fanning themselves, washed bright sky and oppressive tropical heat.

### `fallen_branch` — Fallen Branch

Large tropical tree branch fallen across a narrow Bangkok road after a storm, tuk-tuk confronting it, just enough questionable space visible along one side to possibly squeeze past.

### `giant_puddle` — The Puddle

Tuk-tuk approaching an absurdly enormous roadside puddle, preferably from realistic driver POV looking slightly downward at the road, driver leaning forward determinedly. The puddle dominates the foreground with perfect setup for an enormous splash; any passenger is hidden or later obscured by spray in an exterior version.

### `tailwind` — Lucky Tailwind

Tuk-tuk unexpectedly flying along an open riverside Bangkok road with exaggerated wind at its back, clothing and flags streaming dramatically, driver delighted, vehicle appearing effortlessly fast.

### `flash_flood` — Water Rising!

Sudden dramatic Bangkok flash flood surrounding a tuk-tuk, water visibly rising around the wheels, floating street objects drifting past, driver and passenger realizing the situation has become serious, energetic adventure rather than disaster imagery.

---

## Animals

### `monitor_lizard` — Monitor Lizard Crossing

An enormous Bangkok water monitor lizard casually crossing the road directly in front of a stopped tuk-tuk. Preferred view is realistic driver POV at seated eye height, looking slightly downward onto the road, with the lizard dominating the scene in complete indifference. Alternate over-the-shoulder or low-action exterior shots may show the driver reacting; any passenger remains hidden, cropped, or obscured.

### `street_dog` — Street Dog Standoff

One stubborn Bangkok street dog sitting directly in the middle of a narrow soi, refusing to move while a tuk-tuk waits inches away, driver gesturing at the dog, dog completely unimpressed.

### `pigeon_apocalypse` — Pigeon Apocalypse

Tuk-tuk exploding through a gigantic flock of startled pigeons, birds filling the composition in every direction, preferably from driver POV or a low-action exterior shot. Driver shocked; any passenger is naturally obscured behind the swarm of birds and cabin framing.

### `cat_in_road` — The Cat

Small street cat calmly standing in the road illuminated directly ahead of a tuk-tuk, driver braking dramatically while the cat looks utterly unconcerned.

### `chicken_escape` — Chicken Run

A flock of escaped chickens running chaotically across a Bangkok neighborhood road around a tuk-tuk, driver trying to navigate through them, comic frantic energy.

### `pig_escape` — Pig Escape!

**Preferred shot: `HIGH_ANGLE_ACTION`**

Steep cinematic overhead-oblique view of a Bangkok street after a small livestock truck has broken down or opened unexpectedly. Several pigs are loose across multiple lanes around the CrazyTukTuk, stopped taxis, motorbikes and roadside vendors. The farmer and helpers are trying to round the pigs back toward the truck while the driver leans out of the tuk-tuk or stands beside it in exaggerated frustration. Keep the pigs unharmed and the traffic slowed or stopped. Use crisp readable silhouettes, strong wet-street reflections, and enough proximity that the driver, tuk-tuk and individual pigs remain clearly visible. Any passenger remains hidden or non-specific.

### `elephant_traffic` — Elephant in Traffic

A tuk-tuk unexpectedly encountering an elephant calmly occupying the street amid ordinary Bangkok traffic, preferably from driver POV or a low-action exterior angle. The elephant dominates the scene and makes the tuk-tuk feel tiny. Driver reaction may be visible; any passenger remains hidden or obscured.

### `soi_monkeys` — Monkey Business

Several mischievous monkeys suddenly surrounding a stopped tuk-tuk in a leafy outer-Bangkok soi, one climbing on the vehicle roof, driver attempting to shoo them away, passenger protecting their belongings.

---

## Mechanical / Tuk-Tuk

### `engine_sputter` — Engine Sputter

Tuk-tuk coughing clouds of harmless mechanical smoke from the rear while struggling down a Bangkok road, preferably from driver over-the-shoulder or low-action exterior view. Driver looks back worriedly; smoke and cabin framing obscure any passenger. Vehicle visibly unhappy.

### `low_fuel` — Running on Fumes

Driver POV inside the tuk-tuk with a nearly empty fuel gauge prominent in the foreground and a roadside fuel option visible ahead. Driver tension is implied through hands and posture; any passenger remains off-frame.

### `flat_tire` — Flat Tire

Tuk-tuk leaning awkwardly on a completely flat wheel at the roadside, driver crouched beside the tire in disbelief, passenger waiting nearby amid Bangkok street life.

### `engine_overheat` — Running Hot

Overheated tuk-tuk stopped roadside with steam rising dramatically from its engine, driver inspecting it with improvised tools, hot Bangkok street stretching behind.

### `mystery_rattle` — What's That Noise?

**Preferred shot: rear exterior / investigation shot**

Close rear three-quarter view of the CrazyTukTuk stopped on a Bangkok street with the rear mechanical panel open. The driver stands beside the back of the tuk-tuk scratching his head in puzzled frustration while inspecting the rattling engine area, loose bolts, vibrating fittings, or a suspicious panel. Keep the mood humorous and uncertain rather than catastrophic. Any passenger remains unseen or non-specific.

### `turbo_moment` — Somehow... Turbo

Ordinary tuk-tuk suddenly accelerating with absurd unexpected power, driver wide-eyed, passenger thrown backward slightly, exaggerated speed lines and city streaking behind, playful impossible burst of performance.

### `duct_tape_fix` — Bangkok Engineering

Roadside tuk-tuk repair using an improbable combination of tape, wire and improvised tools, confident local mechanic crouched beside the vehicle while skeptical passenger watches, ingenious humorous energy.

---

## Passenger Events

Passenger-generated events should **not require a fully visible, predefined passenger character**.

The artwork only needs to make the passenger's **action, request, or condition readable**.

Preferred techniques:

- passenger POV
- passenger over-the-shoulder
- passenger hand or arm entering frame
- phone, bag, or other object held in foreground
- partial shoulder or silhouette
- driver reaction to an off-camera passenger
- passenger obscured by cabin framing, motion, weather, or other event effects

The passenger's identity should remain visually flexible unless a future system generates event art dynamically for the specific NPC.

### `street_food_stop` — STOP! FOOD!

**Preferred shot: `PASSENGER_POV` / gesture foreground**

View from the passenger seat of a moving tuk-tuk. A passenger arm enters the foreground, pointing urgently toward an irresistible Bangkok street-food cart outside. Steam and flames rise from a wok or grill while the vendor cooks. The driver turns slightly in surprise at the sudden request. The food stall is the main external focal point; no passenger face is visible.

### `passenger_shortcut` — I Know a Shortcut

**Preferred shot: `PASSENGER_OTS` / gesture foreground**

View from just behind the passenger position inside the tuk-tuk. Only a partial shoulder and pointing arm are visible as the passenger directs the driver toward an impossibly narrow, questionable Bangkok soi branching from the main street. The driver glances toward the indicated alley with obvious skepticism. The passenger identity remains obscured.

### `forgot_phone` — MY PHONE!

**Preferred shot: rear-seat close-up**

Close exterior/rear-side view focused on the empty back seat of the CrazyTukTuk where the missing phone should be. An open bag, seat area, or small personal items help communicate that something is missing without defining the passenger. The driver leans backward from the front seat into the rear compartment to help search, visibly alarmed and confused. Keep Bangkok traffic visible beyond the vehicle so the scene still feels mid-ride.

### `photo_stop` — Wait, Take My Picture!

**Preferred shot: `PASSENGER_POV`**

View from the passenger position toward the driver with a passenger hand holding out a phone and gesturing toward a beautiful Bangkok landmark or riverside view. The driver turns back with a funny, clearly annoyed expression—exasperated but still comedic—while the scenic background remains visually appealing. Do not show the passenger's face.

### `wrong_destination` — Actually...

**Preferred shot: `PASSENGER_POV`**

Interior view from the passenger seat. A passenger hand holds a phone toward the driver, clearly presenting revised directions or a changed destination. The driver turns partly back with exhausted disbelief while the road continues ahead. Keep the phone interface abstract and unreadable; no passenger identity is visible.

### `passenger_late` — I'm Late!

**Preferred shot: `PASSENGER_POV` / driver reaction**

View from the passenger position with one passenger hand urgently pointing forward while another holds up a phone or watch-like time cue. The driver grips the controls and reacts to the pressure, with Bangkok traffic ahead creating a sense of urgency. No passenger face is visible.

### `passenger_nap` — Passenger Passed Out

**Preferred shot: `DRIVER_OTS` / rear-seat silhouette**

View from slightly behind the driver as he glances toward the rear seat. A passenger is visibly asleep but shown only as an indistinct slumped silhouette, partial shoulder, legs, or head shape obscured by the seat frame and cabin shadow. Chaotic Bangkok traffic continues outside while the anonymous passenger sleeps through everything.

### `passenger_sick` — Uh Oh...

**Preferred shot: driver reaction / partial passenger**

Interior tuk-tuk scene with the driver reacting in alarm while an anonymous passenger is only partly visible at the edge of frame, leaning urgently toward the open side and raising a hand to signal that the vehicle should stop. Keep the passenger's face obscured by framing or body position. Humorous anticipatory tension only; no vomit or gross imagery.

### `friend_spotted` — THAT'S MY FRIEND!

**Preferred shot: `PASSENGER_POV` / gesture foreground**

View from the passenger side of the moving tuk-tuk. A passenger arm suddenly shoots into the foreground, pointing excitedly toward a surprised person on the Bangkok sidewalk. The driver reacts to the unexpected interruption while the friend outside becomes the scene's secondary focal point. The actual passenger remains off-camera.

### `lost_item` — Something Fell Out!

**Preferred shot: `PASSENGER_POV` looking backward**

View from inside the tuk-tuk looking backward through the open side or rear. A passenger hand reaches desperately toward a harmless personal item bouncing or sliding onto the road behind the moving vehicle. Part of the driver's face may be visible in a mirror as he notices what happened. The passenger remains otherwise unseen.

### Passenger Event Art Rule

For passenger-generated events:

> Make the passenger-triggered action immediately readable without requiring a fully visible passenger character. Prefer passenger POV, over-the-shoulder framing, gesture-only foreground elements, partial silhouettes, or driver reactions to an off-camera passenger. Avoid defining the passenger's face, hairstyle, clothing, age, or gender unless those details are necessary to understand the event.

---

## Opportunities

### `rival_tuktuk` — Rival Tuk-Tuk

Two customized tuk-tuks side by side at a Bangkok traffic light, rival drivers exchanging competitive looks, passengers excited, road opening ahead like an unofficial starting grid.

### `side_fare` — Quick Side Fare

Person at roadside waving money toward a passing occupied tuk-tuk, driver noticing the tempting quick-money opportunity while current passenger looks suspicious.

### `lucky_shrine` — Lucky Shrine

**Preferred shot: `DRIVER_OTS`**

Over-the-shoulder view from just behind the driver as the CrazyTukTuk slows beside a glowing Bangkok roadside shrine. Warm golden light, flowers, garlands, incense and offerings create a lucky, inviting atmosphere while ordinary traffic continues nearby. The driver notices the shrine with curious respect, creating a calmer opportunity moment among the more chaotic events.

### `lost_tourist` — Lost Tourist

Confused tourist standing roadside with phone and map, waving toward passing tuk-tuk, driver and passenger noticing them, chaotic Bangkok intersection behind.

### `street_vendor_deal` — Roadside Deal

Animated street vendor leaning toward stopped tuk-tuk offering a mysterious small object or useful item, driver considering the deal, colorful Bangkok roadside stall surrounding them.

### `shortcut_tip` — Hot Tip

A streetwise local leaning toward the tuk-tuk driver and urgently pointing toward a hidden side route, driver listening while the passenger watches, visual sense that valuable local shortcut information is being exchanged.

### `fallen_cash` — Money in the Road!

**Preferred shot: `LOW_ACTION`**

Dynamic low external action shot of the CrazyTukTuk moving through Bangkok while loose Thai banknotes flutter and tumble across the roadway. The driver leans dramatically out of the side of the moving tuk-tuk, reaching downward toward the money with one hand while still trying to control the vehicle, wearing an excited, reckless expression. Keep the motion exaggerated and playful, with strong speed, perspective and temptation. Any passenger remains hidden or obscured.

---

## Bangkok Insanity / Rare Events

### `songkran_ambush` — Songkran Ambush!

Tuk-tuk driving directly into an exuberant Songkran water ambush, huge splash exploding across the vehicle, people with water guns along the roadside, joyous controlled chaos. Prefer a low-action exterior or driver POV composition. The driver can be visible reacting, while the passenger area is deliberately obscured by sheets of water, spray, raised arms, and motion so no specific passenger identity is defined.

### `movie_set_blockade` — Movie Set Blockade

**Preferred shot: `HIGH_ANGLE_ACTION`**

Steep cinematic overhead-oblique view of a Bangkok street unexpectedly closed for a film production. The CrazyTukTuk is stopped at the edge of the blockade while an active movie scene occupies the road: cinema camera on a dolly or track, boom operator, large lights and diffusion frames, crew, actors, cables, equipment cases, production tents or vans, cones and temporary barriers. The driver should be clearly visible standing outside the tuk-tuk or leaning dramatically out of it, gesturing in frustrated disbelief at the blocked route. Keep the composition close and crisp enough that the driver, vehicle, camera rig and key crew are individually readable. Any passenger remains hidden or non-specific. No baked-in UI, event title, bonus text, or decorative label is required.

### `wedding_convoy` — Wedding Convoy

Colorful celebratory wedding convoy unexpectedly occupying a Bangkok road ahead of tuk-tuk, decorations, happy people and vehicles creating festive traffic chaos.

### `celebrity_spotted` — Celebrity?!

Passenger excitedly spotting an ambiguous stylish celebrity-like figure surrounded by photographers on Bangkok sidewalk, no recognizable real person, driver deciding whether to stop.

### `escaped_balloon` — Giant Balloon Attack

Enormous escaped promotional balloon drifting absurdly low across a Bangkok street and blocking a tuk-tuk, driver staring upward, surreal playful urban accident.

### `street_dance` — Dance Break

Spontaneous energetic street dance performance occupying the road directly ahead of tuk-tuk, colorful young crowd and performers, driver and passenger watching from vehicle.

### `fireworks` — Surprise Fireworks

Unexpected fireworks bursting above Bangkok street at night while tuk-tuk drives beneath them, passenger looking upward in wonder, dramatic reflections across vehicle and street.

### `tuktuk_parade` — Tuk-Tuk Parade

Huge procession of wildly customized tuk-tuks unexpectedly surrounding the player's vehicle, lights, decorations and eccentric drivers, celebratory vehicular chaos.

### `ghost_passenger` — Ghost in the Soi

Late-night tuk-tuk entering an unusually empty narrow Bangkok soi, mysterious pale human silhouette quietly visible beneath a distant streetlight, driver noticing it, eerie supernatural atmosphere while retaining the game's illustrated adventure style, not horror gore.

### `portal_soi` — That Soi Wasn't There Before

Tuk-tuk driver discovering an impossible narrow Bangkok alley glowing strangely between two ordinary buildings, alley perspective extending far deeper than physically possible, passenger and driver staring into it, magical urban mystery rather than science-fiction portal.

---

# 9. Current Production Set Notes

The current illustrated production set now contains **37 event images**.

For the water/weather portion of the set, retain these distinct events:

- `monsoon_burst` — **Monsoon!**
- `giant_puddle` — **The Puddle**
- `flash_flood` — **Water Rising!**

These remain separate because they communicate different visual/gameplay situations: active rainstorm, a localized road hazard, and a larger sudden flood escalation.

Additional production events added after the initial 30-image batch:

- **31. `pig_escape` — Pig Escape!** — preferred shot `HIGH_ANGLE_ACTION`
- **32. `movie_set_blockade` — Movie Set Blockade** — preferred shot `HIGH_ANGLE_ACTION`
- **33. `lucky_shrine` — Lucky Shrine** — `OPPORTUNITY` — preferred shot `DRIVER_OTS`
- **34. `fallen_cash` — Money in the Road!** — `OPPORTUNITY` — preferred shot `LOW_ACTION`
- **35. `forgot_phone` — MY PHONE!** — `PASSENGER` — preferred shot rear-seat close-up
- **36. `photo_stop` — Wait, Take My Picture!** — `PASSENGER` — preferred shot `PASSENGER_POV`
- **37. `mystery_rattle` — What's That Noise?** — `RISK` — preferred shot rear exterior / investigation shot

The 33–37 additions were specifically chosen to improve type coverage in the production pool:

- two additional `OPPORTUNITY` events
- two additional `PASSENGER` events
- one additional pure `RISK` event

`movie_set_blockade` is the canonical movie-production road-block event in this document.


---

# 10. Initial MVP Curation Goal

This master list is intentionally larger than the first implementation.

The next step is to narrow it to approximately **20 Crazy Events** optimized for:

1. Visual variety
2. Mechanical variety
3. Bangkok identity
4. Interesting autonomous-agent decisions
5. Player-readable A/B choices
6. Risk/reward balance
7. A mixture of positive, negative, neutral, and chaotic outcomes
8. A small number of memorable `WILD` events

A useful initial distribution would be approximately:

- 8 automatic incidents
- 8 decision/risk events
- 4 high-flavor opportunities or wild events

Rare/Wild events should have sufficiently low weights that players do not immediately exhaust the surprise pool.

---

# 11. MVP 20-Event Shot Plan

The initial 20-event set should deliberately mix camera angles instead of repeatedly using the same exterior 3/4 tuk-tuk composition.

Recommended shot assignments:

| Event | Context | Preferred Shot | Alternate | Passenger Treatment | Key Art Note |
|---|---|---|---|---|---|
| `traffic_gridlock` — Bangkok Gridlock | Fare | `DRIVER_POV` | `DRIVER_OTS` | hidden / implied | Driver-eye height looking slightly downward into impossibly dense traffic. |
| `green_light_miracle` — Green Light Miracle | Fare | `DRIVER_POV` | `LOW_ACTION` | hidden | Road opens dramatically ahead; successive green lights are the focal visual. |
| `market_spillover` — Market Spillover | Fare | `DRIVER_POV` | `DRIVER_OTS`, `HIGH_ANGLE_ACTION` | hidden / partial | Market fills the road ahead; passenger can remain completely off-frame. |
| `wrong_way_motorbikes` — Motorbike Swarm | Fare | `DRIVER_POV` | `LOW_ACTION` | obscured | Scooters whip around both sides; cabin framing naturally hides the passenger. |
| `monsoon_burst` — Monsoon! | Fare | `DRIVER_OTS` | `DRIVER_POV` | obscured by rain | Sheets of rain, spray, and cabin shadow conceal the rear seat. |
| `monitor_lizard` — Monitor Lizard Crossing | Fare / Either | `DRIVER_POV` | `DRIVER_OTS`, `LOW_ACTION`, `HIGH_ANGLE_ACTION` | hidden / obscured | Use realistic elevated driver-eye perspective; lizard dominates the road ahead. |
| `pigeon_apocalypse` — Pigeon Apocalypse | Fare | `DRIVER_POV` | `LOW_ACTION`, `HIGH_ANGLE_ACTION` | obscured by birds | Birds filling the frame naturally conceal the passenger compartment. |
| `engine_sputter` — Engine Sputter | Fare | `DRIVER_OTS` | `LOW_ACTION` | obscured | Driver reacts to smoke or mirror; passenger remains behind framing/smoke. |
| `mystery_soi` — Mystery Soi | Fare | `DRIVER_OTS` | `DRIVER_POV` | hidden | Narrow glowing soi ahead is the choice; driver reaction communicates temptation. |
| `train_crossing` — Train Crossing | Fare | `DRIVER_POV` | `DRIVER_OTS` | hidden | Barrier and passing train dominate the windshield. |
| `flooded_soi` — Flooded Soi | Fare | `DRIVER_POV` | `DRIVER_OTS`, `LOW_ACTION` | hidden / partial | Camera above controls, looking slightly down onto the floodwater. |
| `giant_puddle` — The Puddle | Fare | `DRIVER_POV` | `LOW_ACTION` | obscured by splash | POV shows ominous puddle before impact; exterior version can bury rear cabin in spray. |
| `cat_in_road` — The Cat | Fare | `DRIVER_POV` | `LOW_ACTION` | hidden | Tiny unconcerned cat directly ahead; sudden-braking composition. |
| `low_fuel` — Running on Fumes | Fare | `DRIVER_POV` | `DRIVER_OTS` | hidden | Fuel gauge foreground plus roadside fuel option ahead. |
| `street_food_stop` — STOP! FOOD! | Fare | `PASSENGER_POV` | `PASSENGER_OTS` | gesture only | Passenger arm points at food cart; identity never shown. |
| `passenger_shortcut` — I Know a Shortcut | Fare | `PASSENGER_OTS` | `PASSENGER_POV` | shoulder + arm only | Passenger points toward questionable soi while driver reacts. |
| `rival_tuktuk` — Rival Tuk-Tuk | Fare | `DRIVER_POV` | `LOW_ACTION` | hidden / obscured | Rival pulls alongside; their driver is visible, our passenger is not. |
| `songkran_ambush` — Songkran Ambush! | Fare | `LOW_ACTION` | `DRIVER_POV`, `HIGH_ANGLE_ACTION` | obscured by water | Rear cabin is blasted by spray; at most a raised hand or silhouette is visible. |
| `elephant_traffic` — Elephant in Traffic | Fare | `DRIVER_POV` | `LOW_ACTION`, `HIGH_ANGLE_ACTION` | hidden / obscured | Elephant owns the composition; no need to define the passenger. |
| `ghost_passenger` — Ghost in the Soi | Fare | `DRIVER_OTS` | `DRIVER_POV` | hidden / silhouette | Driver looks down an empty dark soi; current passenger stays unseen while the ghost is the clear figure ahead. |

### Context Rule

- `Fare` — artwork should plausibly contain a passenger, but the passenger can be hidden, obscured, partial, or shown from their POV.
- `Pickup` — driver is alone on the way to collect the fare; empty rear seat is acceptable.
- `Either` — composition works in either stage.

If a `SIDE_PROFILE`, `ELEVATED`, `HIGH_ANGLE_ACTION`, or wide exterior shot clearly reveals an empty rear seat, prefer using that asset for a `Pickup`-leg event rather than during an active fare. For active-fare high-angle scenes, hide the rear passenger area through roof geometry, cropping, shadow, surrounding action, or another natural obstruction.

---

# 12. Future Event Mode Integration Document

This file is the **master event content and art source**.

A later `CRAZY_TUK_EVENTS_SYSTEM.md` should combine this material with the full implementation design, including:

- Ride-state integration
- Event trigger frequency
- Event cooldowns
- Per-ride event limits
- Event eligibility
- Route-progress trigger windows
- Player Drive Mode interstitial UI
- Agent/Tournament Mode decision logic
- Agent personality scoring
- Outcome probability resolution
- Passenger dialogue archetypes
- Result animations
- Time/fuel/score application
- Temporary buffs and debuffs
- Tournament scoring implications
- Event history/logging
- Replay/spectator presentation
- Analytics and balancing
- Asset loading
- JSON validation
- Adding new events without modifying the ride engine

The visible map route should remain unchanged unless a future version explicitly introduces true dynamic rerouting.
