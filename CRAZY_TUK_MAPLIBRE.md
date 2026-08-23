# CRAZY TUKTUK — MAPLIBRE IMPLEMENTATION SPEC

> **Status:** MVP planning / build handoff  
> **Scope:** How CrazyTukTuk should use MapLibre GL JS inside the existing game template  
> **Primary constraint:** Adapt the existing HTML/CSS/vanilla-JS game structure rather than rebuilding the app around a map framework.

---

## 1. Purpose

CrazyTukTuk should use **MapLibre GL JS as the geographic renderer for the game world**, not as the application framework and not as a navigation product.

MapLibre is responsible for:

1. Rendering Bangkok geography.
2. Positioning CrazyTukTuk game objects in geographic space.
3. Rendering predefined travel paths.
4. Handling map pan/zoom/tap interaction.
5. Handling camera framing and movement.

CrazyTukTuk code remains responsible for:

- game state
- fares
- NPC state
- rewards / money
- trip progression
- route selection
- animation state
- UI
- menus
- effects
- audio
- persistence

The intended structure is therefore:

```text
CRAZY TUKTUK GAME
        │
        ├── Game State
        ├── Fare / NPC Logic
        ├── Player State
        ├── UI / Effects
        │
        └── Map Adapter
                │
                ▼
          MapLibre GL JS
                │
                ▼
         Bangkok map data
```

Do **not** fork MapLibre or modify its rendering engine for the MVP.

---

# 2. Base Technical Stack

Use the same general technical philosophy as the supplied game template.

## MVP stack

| Layer | Technology |
|---|---|
| App | HTML5 |
| Styling | CSS |
| Game Logic | Vanilla JavaScript |
| Geographic Renderer | MapLibre GL JS |
| Base Map | MapLibre-compatible vector style / tiles |
| Game World Data | Local JS / GeoJSON |
| Route Data | Local predefined coordinate paths |
| Game Sprites | PNG / WebP |
| Animation Loop | `requestAnimationFrame()` |
| UI Animation | CSS transitions + CSS keyframes |
| Persistence | `localStorage` |
| Mobile Packaging | PWA |
| Framework | None |
| Game Engine | None |
| Backend | Not required for local MVP |

### Explicit MVP decisions

- **No React**
- **No Phaser**
- **No routing API**
- **No traffic simulation**
- **No live traffic data**
- **No weather system**
- **No city events**
- **No multiplayer**
- **No agent simulation**
- **No complex backend requirement**

The existing template already demonstrates that a compact browser game can provide animation, state, mobile handling, PWA support, effects, scene transitions, and a real-time game loop without a framework.

---

# 3. Start From the Existing Game Template

The supplied HTML should be treated as the **structural predecessor** of CrazyTukTuk.

Do not start with a blank MapLibre demo and then attempt to rebuild the game shell around it.

Instead:

1. Clone/copy the game repo template.
2. Preserve its responsive portrait shell.
3. Preserve its PWA setup.
4. Preserve its boot/loading behavior.
5. Preserve its title-screen structure.
6. Preserve its How to Play and Settings panel patterns.
7. Preserve its scene transition mechanism.
8. Remove the Bunkee-specific gameplay code.
9. Replace the existing `.stage` gameplay contents with the CrazyTukTuk map stage.
10. Add TukTuk-specific assets, map data, fare logic, and animation.

## Important repo check before implementation

Before coding against this document, inspect the actual template repository and compare it with the supplied `index.html`.

Check for:

- current directory structure
- service worker configuration, if present
- `site.webmanifest`
- favicon / Apple touch icon conventions
- social-card conventions
- API routes inherited from the template
- global leaderboard code that may no longer be needed
- deployment configuration
- asset paths
- build/deploy scripts
- mobile viewport fixes
- any code that has moved out of `index.html`
- existing reusable CSS/components
- any updated template conventions not visible in the supplied HTML

**Prefer adapting the repository's current implementation over blindly copying snippets from this spec.**

This document describes architecture and behavior, not an instruction to preserve obsolete template code.

---

# 4. Preserve the Portrait-First Game Shell

The supplied template constrains desktop gameplay to a portrait game viewport and switches to full-bleed mobile behavior.

Preserve that design.

Conceptually:

```text
Desktop

        ┌─────────────────┐
        │                 │
        │                 │
        │      GAME       │
        │                 │
        │                 │
        │                 │
        └─────────────────┘


Mobile

┌───────────────────────────┐
│                           │
│         FULL BLEED        │
│                           │
│          GAME             │
│                           │
└───────────────────────────┘
```

The map should occupy the gameplay stage rather than the entire browser window.

---

# 5. DOM / Layout Architecture

The existing structure is conceptually:

```html
<div id="game" class="game">
  <div class="stage">
    <!-- gameplay -->
  </div>
</div>
```

CrazyTukTuk should evolve this into:

```html
<div id="game" class="game" hidden>
  <div class="stage map-stage">

    <div id="map"></div>

    <div id="mapEffects" class="map-effects" aria-hidden="true"></div>

    <div id="gameHud" class="game-hud">
      <!-- money / current fare / controls -->
    </div>

    <section id="fareCard" class="fare-card" hidden>
      <!-- NPC fare information -->
    </section>

  </div>
</div>
```

## Important MapLibre constraint

Keep the MapLibre map container itself empty.

Correct:

```html
<div class="stage">
  <div id="map"></div>
  <div class="game-hud"></div>
</div>
```

Avoid:

```html
<div id="map">
  <div class="game-hud"></div>
</div>
```

Map UI and game UI should be siblings layered through CSS positioning and z-index.

---

# 6. Rendering Layers

Think of the scene as three rendering systems.

```text
┌─────────────────────────────────────┐
│ HTML / CSS UI + EFFECTS             │
│                                     │
│ fare cards, coins, speech bubbles,  │
│ transitions, menus, reward effects  │
├─────────────────────────────────────┤
│ MAPLIBRE GAME OBJECTS               │
│                                     │
│ TukTuk, NPCs, game POIs, routes     │
├─────────────────────────────────────┤
│ MAPLIBRE BASE MAP                   │
│                                     │
│ roads, river, parks, buildings      │
└─────────────────────────────────────┘
```

Do not force all game effects into MapLibre.

Use MapLibre for geographic objects.

Use HTML/CSS for screen-space UI and spectacle.

---

# 7. Map Initialization

Create one persistent MapLibre map instance for the gameplay scene.

Example direction:

```js
const map = new maplibregl.Map({
  container: "map",
  style: CRAZY_TUK_MAP_STYLE,
  center: [100.5018, 13.7563],
  zoom: INITIAL_ZOOM,
  pitch: 0,
  bearing: 0,
  attributionControl: false,
  scrollZoom: false,
  touchPitch: false
});
```

Exact values should live in config rather than being scattered through game code.

Suggested configuration:

```js
export const MAP_CONFIG = {
  center: [100.5018, 13.7563],
  initialZoom: 11.8,
  minZoom: 10.5,
  maxZoom: 16,
  pitch: 0,
  bearing: 0
};
```

## MVP interaction

Allow:

- drag / pan
- pinch zoom
- tap game objects

Disable or restrict:

- pitch
- 3D tilt
- accidental rotation
- desktop wheel zoom if it harms game interaction

The target feel is an **interactive game board**, not a generic maps interface.

---

# 8. Base Map Style

For MVP, use an existing MapLibre-compatible vector source/style as the basis.

Do **not** build custom map tiles.

Do **not** attempt to hand-illustrate all Bangkok streets.

Create or derive:

```text
assets/map/crazy-tuk-style.json
```

## Style goals

The underlying map should be visually quiet.

Retain enough real geography that Bangkok remains recognizable.

### Keep

- Chao Phraya River
- major canals where useful
- parks
- major roads
- selected secondary roads
- broad building texture
- major neighborhood / district labels if useful

### Reduce / suppress

- excessive minor road labels
- generic business POIs
- building numbers
- transit clutter
- administrative clutter
- tiny map icons
- irrelevant commercial labels

### Adjust

- background
- water
- roads
- road casing
- park fill
- building opacity
- label color
- label hierarchy

CrazyTukTuk art assets should provide visual personality above this subdued geographic foundation.

---

# 9. Recommended Map Layer Order

Suggested MVP render stack:

```text
TOP

player-tuktuk
fare-pickups
destination-icons
game-pois
route-completed
route-upcoming
base-map-labels
major-roads
minor-roads
buildings
parks
water
background

BOTTOM
```

Exact MapLibre layer insertion points should be checked against the chosen base style's layer IDs.

Do not hardcode an assumed base-style layer ID without inspecting the style JSON.

---

# 10. Game World Data

CrazyTukTuk world locations should be separate from base map data.

Use a local GeoJSON-compatible structure.

Example:

```js
export const LOCATIONS = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "grand-palace",
      properties: {
        name: "Grand Palace",
        kind: "landmark",
        icon: "grand-palace"
      },
      geometry: {
        type: "Point",
        coordinates: [100.4913, 13.7500]
      }
    }
  ]
};
```

MVP target:

**approximately 12–15 curated game locations.**

These may include a mix of:

- recognizable real landmarks
- neighborhoods
- sponsor/hackathon-relevant POIs
- fictional CrazyTukTuk locations

Do not import thousands of ordinary Bangkok businesses.

The game world should remain curated and legible.

---

# 11. Map Sources

Recommended custom MapLibre sources:

```text
game-locations
fare-pickups
active-destination
active-route-upcoming
active-route-completed
player
```

Example:

```js
map.addSource("game-locations", {
  type: "geojson",
  data: LOCATIONS
});
```

The player should have its own source because it updates frequently.

```js
map.addSource("player", {
  type: "geojson",
  data: createPlayerGeoJSON(initialPosition)
});
```

Update using:

```js
map.getSource("player").setData(updatedPlayerGeoJSON);
```

---

# 12. Game Icons / Sprites

Use MapLibre symbol layers for most geographically anchored game objects.

Suggested asset structure:

```text
assets/
└── map/
    ├── icons/
    │   ├── tuktuk/
    │   ├── npc/
    │   ├── poi/
    │   ├── pickup.png
    │   └── destination.png
    │
    └── crazy-tuk-style.json
```

Load assets through MapLibre and register them with stable IDs.

Conceptually:

```js
const image = await map.loadImage("assets/map/icons/pickup.png");
map.addImage("pickup", image.data);
```

Then:

```js
map.addLayer({
  id: "fare-pickups",
  type: "symbol",
  source: "fare-pickups",
  layout: {
    "icon-image": "pickup",
    "icon-size": 0.6,
    "icon-allow-overlap": true
  }
});
```

Avoid creating large numbers of DOM markers unless a specific effect requires HTML.

---

# 13. Predefined Routes — MVP Decision

**CrazyTukTuk MVP will use predefined paths.**

There is no routing API in the MVP.

MapLibre renders routes but does not need to calculate them.

Store route data locally.

Example:

```js
export const ROUTES = {
  "siam-chinatown": {
    from: "siam",
    to: "chinatown",
    durationMs: 12000,
    coordinates: [
      [100.5347, 13.7466],
      [100.5310, 13.7448],
      [100.5262, 13.7424],
      [100.5200, 13.7410],
      [100.5100, 13.7400]
    ]
  }
};
```

## Route authoring goals

Predefined routes may deliberately:

- pass interesting landmarks
- favor visually readable roads
- cross bridges
- use entertaining curves
- avoid visually confusing areas
- take a game-appropriate amount of time

They do **not** need to reproduce real driving duration.

Game time and geographic distance are separate concepts.

Example:

```text
Real journey:
~25 minutes

CrazyTuk journey:
~12 seconds
```

---

# 14. Route Rendering

Represent a route as a GeoJSON `LineString`.

Example:

```js
map.addSource("active-route-upcoming", {
  type: "geojson",
  data: {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: []
    }
  }
});
```

Add a line layer:

```js
map.addLayer({
  id: "route-upcoming",
  type: "line",
  source: "active-route-upcoming",
  layout: {
    "line-cap": "round",
    "line-join": "round"
  },
  paint: {
    "line-width": 6
  }
});
```

Use a second source/layer for completed route progress.

Conceptually:

```text
completed                    remaining

━━━━━━━━━━━━━━━━🛺────────────────────★
```

Recommended sources:

```text
active-route-completed
active-route-upcoming
```

---

# 15. Route Reveal Animation

When a fare is accepted, do not instantly display the entire route.

Reveal the path progressively.

```text
frame 1

🛺━


frame 2

🛺━━━━━━


frame 3

🛺━━━━━━━━━━━━━━━━★
```

Implementation options:

1. progressively add route coordinates to the displayed LineString
2. interpolate additional points where necessary for smoother reveal

Keep this effect short.

It should communicate the trip, not delay gameplay.

---

# 16. TukTuk Movement

The TukTuk travels along the predefined route using the same broad real-time pattern already used by the template:

```js
requestAnimationFrame(gameLoop);
```

Suggested trip state:

```js
activeTrip = {
  routeId: "siam-chinatown",
  startedAt: performance.now(),
  durationMs: 12000,
  progress: 0
};
```

Game loop:

```js
function gameLoop(now) {
  updateTrip(now);
  updatePlayerPosition();
  updateRouteProgress();
  updateCamera();
  requestAnimationFrame(gameLoop);
}
```

## Route interpolation

Do not simply jump from coordinate to coordinate.

Interpolate continuously along the predefined line.

Prefer distance-aware interpolation so segments of different lengths produce roughly consistent travel speed.

Possible implementation:

1. calculate each segment's distance once
2. calculate cumulative route distance
3. convert normalized trip progress to distance along route
4. find containing segment
5. interpolate between its two coordinates

This can remain local vanilla JS.

No physics engine is necessary.

---

# 17. TukTuk Visual Animation

Geographic position and visual animation should be treated as separate layers of motion.

MapLibre determines:

> where the TukTuk is.

Animation determines:

> how the TukTuk feels.

## MVP TukTuk effects

Implement:

- subtle idle bounce
- stronger driving bounce
- orientation based on route direction if practical
- small exhaust effect
- optional 2–4 frame driving sprite cycle

Possible TukTuk assets:

```text
tuktuk-idle-01.png
tuktuk-idle-02.png

tuktuk-drive-01.png
tuktuk-drive-02.png
tuktuk-drive-03.png
tuktuk-drive-04.png
```

Do not require this entire sprite set for the first playable implementation.

A single TukTuk asset plus bounce can be the initial milestone.

---

# 18. CSS / DOM Effects Over the Map

Use HTML/CSS for effects that do not need geographic rendering precision.

Examples:

- coins
- fare amount popup
- pickup speech bubble
- dropoff celebration
- screen flash
- scene transition
- button animation
- HUD movement
- reward animation
- notification text

This follows the supplied template's existing approach.

Potential screen-space dropoff effect:

```text
        +฿240
      ✦   ✦   ✦

         🛺
```

---

# 19. Exhaust Effect

The existing template already uses repeated CSS smoke elements and keyframe animation.

Adapt that concept for TukTuk exhaust.

Possible approach:

```html
<div id="exhaustLayer" class="exhaust-layer" aria-hidden="true"></div>
```

Spawn a limited number of ephemeral particles while driving.

Each puff:

1. appears near the TukTuk's screen position
2. grows slightly
3. drifts backward/upward
4. fades
5. is removed/recycled

Keep the particle count bounded.

A small pooled particle system is preferable to continuously creating unlimited DOM nodes.

---

# 20. NPC / Fare Markers

MVP fare pickups should be geographic point features.

Each pickup feature should contain a `fareId`.

Example:

```json
{
  "type": "Feature",
  "properties": {
    "fareId": "fare-001",
    "npcId": "tourist-01",
    "icon": "npc-tourist"
  },
  "geometry": {
    "type": "Point",
    "coordinates": [100.533, 13.744]
  }
}
```

Tap via MapLibre layer event:

```js
map.on("click", "fare-pickups", handleFareClick);
```

Flow:

```text
tap NPC marker
      ↓
retrieve feature.properties.fareId
      ↓
game.js resolves fare
      ↓
UI shows fare card
```

Do not put fare economy logic inside `map.js`.

---

# 21. Fare Card

Fare card remains standard HTML UI layered above the map.

Example information:

```text
┌───────────────────────────┐
│        TOURIST            │
│                           │
│ SIAM → CHINATOWN          │
│                           │
│           ฿180            │
│                           │
│       [ PICK UP ]         │
└───────────────────────────┘
```

Possible MVP actions:

- Accept
- Dismiss / select another fare

MapLibre should only notify the game which fare was tapped.

The UI controller decides what happens next.

---

# 22. NPC Marker Animation

Markers should not look like standard mapping pins.

Recommended MVP animation:

- slow idle bob
- small selected pulse
- optional short attention bounce when newly spawned

Avoid making every POI continuously animate.

Motion hierarchy should prioritize:

1. active TukTuk
2. selected fare
3. available fares
4. static world landmarks

---

# 23. Pickup Animation

When the TukTuk reaches the pickup:

Possible sequence:

1. TukTuk stops.
2. NPC marker does a short bounce.
3. NPC marker moves/fades toward TukTuk or disappears.
4. small speech bubble / response appears.
5. trip enters `TO_DESTINATION`.

Keep this short enough that repeated fares do not become annoying.

---

# 24. Dropoff Animation

At destination:

1. TukTuk stops.
2. passenger exits or destination reacts.
3. reward amount animates.
4. money HUD updates.
5. short celebratory visual.
6. active route clears.
7. new fare state begins.

Potential effects:

- coin burst
- number pop
- small map pulse
- light screen shake
- haptic vibration where supported

Reuse the visual language of the template rather than adding a separate animation engine.

---

# 25. Camera States

The MVP needs only a few deliberate camera modes.

## Explore

Player can inspect the nearby map.

## Fare Selected

Frame:

- current TukTuk
- pickup
- destination

Use map camera fitting rather than hardcoded camera positions.

## Driving

Camera follows or periodically recenters on the TukTuk.

Avoid excessive camera motion.

## Arrival

Optional subtle destination zoom.

## Post-Fare

Return to useful nearby gameplay framing.

---

# 26. UI-Aware Camera Padding

The bottom fare card will obscure part of the map.

Camera operations should account for this.

When fitting pickup + destination:

```text
┌───────────────────────────┐
│                           │
│   👤                      │
│                           │
│                  ★        │
│                           │
│                           │
│ ┌───────────────────────┐ │
│ │       FARE CARD       │ │
│ └───────────────────────┘ │
└───────────────────────────┘
```

Use MapLibre camera padding so important objects are not placed behind UI.

Padding values should come from configuration or measured layout.

---

# 27. Start Screen / Menus

Preserve the existing template's basic scene architecture.

CrazyTukTuk should have:

```text
START
MAP
HOW TO PLAY
SETTINGS
```

Possible later screens:

```text
DRIVER PROFILE
GARAGE
LEADERBOARD
```

But these are not necessary for initial local MVP.

The map should not exist as the background for every menu unless there is a deliberate design reason.

Existing illustrated background assets can continue to be used for:

- start screen
- settings
- how to play
- overlays

---

# 28. Reuse the Existing Iris Scene Transition

The supplied template already implements an iris close/open transition between scenes.

Keep/adapt this for CrazyTukTuk.

Possible transitions:

```text
TITLE
  ↓ iris
MAP

MAP
  ↓ iris
HOW TO PLAY

MAP
  ↓ iris
SETTINGS
```

Do not spend MVP time creating a new scene manager just to replace a working effect.

---

# 29. Asset Migration From Template

When adapting the repo, explicitly audit every inherited asset.

## Replace

- Bunkee branding
- Bunkee gameplay art
- Bunkee icon
- Bunkee social card
- Bunkee background art where not reusable
- Bunkee leaderboard references
- Bunkee URLs
- Bunkee strings
- Bunkee localStorage keys

## Add

```text
assets/branding/logo.png

assets/backgrounds/start-bg.png
assets/backgrounds/menu-bg.png

assets/map/icons/tuktuk/
assets/map/icons/npc/
assets/map/icons/poi/
assets/map/crazy-tuk-style.json

assets/ui/
assets/audio/
```

Use the actual template repo's required asset names/sizes where those conventions matter.

---

# 30. PWA / Mobile Behavior

Preserve the existing template's PWA/mobile handling wherever still useful.

Check/reuse:

- viewport meta settings
- `viewport-fit=cover`
- safe-area handling
- standalone mode checks
- `apple-touch-icon`
- `site.webmanifest`
- install interstitial behavior
- responsive game viewport height workaround
- full-bleed mobile layout
- desktop portrait frame
- overscroll prevention
- touch interaction behavior

MapLibre itself must be tested specifically in:

- Safari iOS browser
- installed iOS PWA
- Android Chrome
- installed Android PWA
- desktop Chrome

Pay attention to:

- pinch gesture conflicts
- accidental page scroll
- map resizing after PWA launch
- safe-area overlays
- CSS viewport height differences
- canvas resizing when switching scenes

Call:

```js
map.resize();
```

whenever the map becomes visible after being hidden or its containing layout changes.

---

# 31. Proposed Project Structure

Adapt this to the real template repo rather than forcing it if the repo already has a stronger convention.

```text
crazytuktuk/
│
├── index.html
├── site.webmanifest
├── crazytuk.ico
├── apple-touch-icon.png
├── social-card.png
│
├── assets/
│   │
│   ├── branding/
│   │   └── logo.png
│   │
│   ├── backgrounds/
│   │
│   ├── ui/
│   │
│   ├── audio/
│   │
│   ├── npc/
│   │
│   └── map/
│       ├── icons/
│       │   ├── tuktuk/
│       │   ├── npc/
│       │   └── poi/
│       └── crazy-tuk-style.json
│
├── data/
│   ├── locations.js
│   ├── fares.js
│   └── routes.js
│
└── js/
    ├── config.js
    ├── game.js
    ├── map.js
    ├── player.js
    ├── fares.js
    ├── animation.js
    └── ui.js
```

The supplied template keeps almost everything in one HTML file.

That is acceptable for the template's scale, but CrazyTukTuk should split map/game/data responsibilities because the boundaries are already clear.

Do not introduce a bundler solely to support this split if simple ES modules or script files are sufficient.

---

# 32. Module Responsibilities

## `config.js`

Contains tunable values.

Examples:

```js
MAP_CONFIG
CAMERA_CONFIG
TRIP_SPEED
ROUTE_REVEAL_DURATION
TUKTUK_BOUNCE_AMOUNT
FARE_SPAWN_DELAY
ANIMATION_DURATIONS
```

Keep values centralized to make iteration easy.

---

## `map.js`

Map rendering adapter only.

Suggested public interface:

```js
initMap()

showLocations(locations)

showFarePickup(fare)

showDestination(location)

showRoute(route)

updateRouteProgress(progress)

setPlayerPosition(position)

focusFare(pickup, destination)

followPlayer(position)

clearFare()

setExploreCamera()

resizeMap()
```

`map.js` should **not** know:

- player money
- reward formulas
- whether a fare should spawn
- NPC personality
- progression rules

---

## `routes.js`

Stores predefined route geometry and route metadata.

Example:

```js
{
  id,
  from,
  to,
  durationMs,
  coordinates
}
```

Routes should be validated at startup in development.

Check that:

- at least two coordinates exist
- coordinates are valid `[lng, lat]`
- route start is reasonably close to origin location
- route end is reasonably close to destination
- route IDs are unique

---

## `locations.js`

Stores curated world locations.

Recommended fields:

```js
{
  id,
  name,
  type,
  coordinates,
  icon,
  enabled
}
```

Possible later fields:

```js
district
description
unlockCondition
fareWeight
sponsor
```

Do not overbuild these for MVP.

---

## `fares.js`

Responsible for:

- available fare definitions
- selecting/spawning fares
- accepting fare
- linking origin/destination to predefined route
- fare completion

Map rendering should be called through `map.js`.

---

## `player.js`

Responsible for:

- current geographic location
- current route
- trip state
- interpolated progress
- money
- driver state

Possible state machine:

```text
IDLE
↓
TO_PICKUP
↓
PICKUP
↓
TO_DESTINATION
↓
DROPOFF
↓
IDLE
```

---

## `animation.js`

Optional shared effect helper.

Could contain:

```js
spawnCoinBurst()
spawnExhaust()
showRewardPop()
screenShake()
pulseMarker()
```

Do not create this file until multiple effects actually need shared code.

---

## `ui.js`

Responsible for:

- fare card
- money display
- start screen
- how-to-play panel
- settings
- overlays
- messages
- scene transitions

Reuse patterns from the existing template.

---

# 33. Game Loop

Retain the existing `requestAnimationFrame()` philosophy.

Suggested:

```js
let lastFrame = performance.now();

function loop(now) {
  const dt = Math.min((now - lastFrame) / 1000, 0.1);
  lastFrame = now;

  updateGame(now, dt);
  updateTrip(now, dt);
  updateAnimations(now, dt);

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
```

Do not perform unnecessary work every frame.

Examples:

- geographic player update: every frame while driving
- fare spawning: timer/state event
- menu updates: event-driven
- static map data: loaded once

---

# 34. Initial MVP Game Loop

The complete first playable loop should be:

```text
TITLE
  ↓
START
  ↓
MAP
  ↓
FARE APPEARS
  ↓
PLAYER TAPS NPC
  ↓
FARE CARD
  ↓
ACCEPT
  ↓
ROUTE REVEALS
  ↓
TUKTUK DRIVES TO PICKUP
  ↓
PICKUP ANIMATION
  ↓
TUKTUK DRIVES TO DESTINATION
  ↓
DROPOFF ANIMATION
  ↓
MONEY INCREASES
  ↓
ROUTE CLEARS
  ↓
NEW FARE
```

Do not add secondary systems until this loop feels good.

---

# 35. Minimum MapLibre Feature Surface

The MVP intentionally depends on a small subset of MapLibre.

Primary APIs/concepts:

```text
new maplibregl.Map()

map.addSource()
  └── GeoJSON

map.addLayer()
  ├── symbol
  └── line

map.loadImage()
map.addImage()

GeoJSONSource.setData()

map.on("click", layer)

map camera APIs
  ├── fitBounds()
  ├── easeTo()
  └── related camera movement

map.resize()
```

Avoid depending on advanced MapLibre features unless they solve an actual MVP problem.

---

# 36. Effects Scope for MVP

Include enough motion to make the map feel like a game.

Recommended initial effects:

1. TukTuk smoothly follows predefined routes.
2. TukTuk has subtle idle/driving bounce.
3. Small exhaust puffs while moving.
4. Fare NPCs have a restrained idle bounce.
5. Selected fare visually pulses.
6. Route draws/reveals when accepted.
7. Completed route fills behind TukTuk.
8. Camera smoothly reframes selected fare.
9. Camera follows TukTuk while driving.
10. Pickup has a short NPC transition.
11. Dropoff shows reward/coin effect.
12. Existing iris scene transition is reused.
13. Start logo keeps playful CSS motion.

Everything else is optional.

---

# 37. What Not To Build Yet

Explicitly defer:

- live routing
- OSRM
- Valhalla
- GraphHopper
- Google Directions
- traffic
- weather
- dynamic events
- live Bangkok POI search
- real-time public transit
- procedural city simulation
- district economy
- hundreds of NPCs
- Phaser integration
- React migration
- 3D buildings
- MapLibre renderer modifications
- custom vector-tile pipeline
- custom tile server

These may be revisited after the local playable MVP exists.

---

# 38. Implementation Order

## Phase MAP-0 — Template Audit

- clone/open the actual template repo
- compare repo to supplied HTML
- identify reusable shell
- identify Bunkee-only code
- identify deployment/PWA conventions
- confirm asset conventions
- confirm how CSS/JS are currently organized

**Deliverable:** short repo adaptation note before major coding.

---

## Phase MAP-1 — Static Map

- add MapLibre dependency
- create map container
- preserve portrait shell
- load Bangkok base map
- confirm mobile / desktop sizing
- confirm map resize behavior after scene transitions

**Success:** Bangkok renders inside the existing game stage.

---

## Phase MAP-2 — CrazyTuk Styling

- suppress unwanted base layers
- adjust water / roads / parks / buildings
- reduce label clutter
- establish CrazyTuk map palette

**Success:** map no longer looks like a generic navigation app.

---

## Phase MAP-3 — World POIs

- define ~12–15 game locations
- load custom icons
- add `game-locations` source
- render symbol layer
- verify tap behavior

**Success:** CrazyTuk landmarks sit correctly over Bangkok.

---

## Phase MAP-4 — Player TukTuk

- add player GeoJSON source
- add TukTuk sprite
- update source programmatically
- implement bounce
- verify camera following

**Success:** TukTuk can be moved smoothly around the map.

---

## Phase MAP-5 — Predefined Routes

- create first several route paths
- render route line
- implement route reveal
- interpolate TukTuk along route
- implement completed/upcoming route split

**Success:** TukTuk drives smoothly between two predefined locations.

---

## Phase MAP-6 — Fare Interaction

- add pickup NPC source
- tap NPC
- show fare card
- accept fare
- focus pickup/destination
- start trip

**Success:** player can initiate a fare from the map.

---

## Phase MAP-7 — Pickup / Dropoff Loop

- drive to pickup
- pickup effect
- drive to destination
- dropoff effect
- reward update
- reset trip
- spawn next fare

**Success:** complete playable loop.

---

## Phase MAP-8 — Polish

- exhaust
- route styling
- camera easing
- reward effects
- sound
- haptics
- menu/map transitions
- low-end mobile performance pass

---

# 39. Build Guardrails

During implementation:

### Preserve simplicity

If a feature can be implemented cleanly in vanilla JS, do not introduce a framework.

### Keep map logic isolated

Game systems should not directly manipulate arbitrary MapLibre internals throughout the codebase.

Route rendering and player rendering should pass through `map.js`.

### Keep tuning values configurable

Animation speeds and camera timing should not be scattered magic numbers.

### Prefer game feel over geographic realism

Routes are choreographed gameplay paths.

### Test mobile early

Do not finish desktop implementation before testing installed/mobile behavior.

### Reuse the template

Do not rewrite working PWA, scene-transition, viewport, menu, or responsive code without a reason.

### Remove dead inherited code

Do not leave disabled Bunkee systems, leaderboard code, motion-sensor code, or unrelated assets hanging around "just in case."

---

# 40. Questions to Resolve During Repo Adaptation

The implementation agent should check the repo and answer these before or during MAP-0:

1. Is the live template still a single `index.html`, or has code been modularized?
2. Is MapLibre best loaded through the repo's current dependency convention or direct browser import?
3. Is there already a reusable scene/navigation helper?
4. Is there a service worker that caches game assets?
5. Should map sprite assets be added to that cache?
6. Is there a current asset naming convention?
7. Does the repo already expose config/constants separately?
8. Are leaderboards/API routes part of a generic template or Bunkee-specific?
9. Which PWA installation logic should survive?
10. Does hiding/showing the gameplay scene require explicit `map.resize()` calls?
11. Are there existing sound helpers worth reusing?
12. Are there existing effect utilities worth keeping?
13. Does the deploy target impose any CSP restrictions on MapLibre tile/style endpoints?
14. Should the base map/style be remote during the hackathon MVP or pinned/self-hosted later?

Do not block the initial prototype on questions that can be safely answered experimentally.

---

# 41. Reference Architecture

Final target for the MVP:

```text
┌───────────────────────────────────────┐
│            CRAZY TUKTUK               │
│                                       │
│  HTML / CSS UI                        │
│  ├── start                            │
│  ├── fare card                        │
│  ├── HUD                              │
│  ├── settings                         │
│  └── effects                          │
│                                       │
│  Vanilla JS Game                      │
│  ├── game state                       │
│  ├── player                           │
│  ├── fares                            │
│  ├── predefined routes                │
│  └── animation loop                   │
│                                       │
│  Map Adapter                          │
│  ├── sources                          │
│  ├── layers                           │
│  ├── camera                           │
│  └── interactions                     │
│                                       │
│  MapLibre GL JS                       │
│  └── Bangkok vector geography         │
│                                       │
└───────────────────────────────────────┘
```

---

# 42. Final MVP Technical Decision

For the first playable CrazyTukTuk:

> **Adapt the existing portrait-first HTML/CSS/vanilla-JS PWA game template. Use MapLibre GL JS only as the geographic renderer inside the gameplay stage. Store a curated set of Bangkok game locations and predefined route paths locally. Animate the TukTuk with the existing `requestAnimationFrame` game-loop philosophy, use MapLibre GeoJSON sources/layers for geographically anchored objects and routes, and use HTML/CSS for UI, rewards, transitions, particles, and other game effects. Do not add React, Phaser, live routing, or additional simulation systems until the core fare loop is playable and fun.**

