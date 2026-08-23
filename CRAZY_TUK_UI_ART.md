# Crazy Tuk — UI / Art Direction / Asset Checklist

## 0. Purpose

This document defines the visual/UI requirements for **Crazy Tuk** and acts as the art-production checklist for the hackathon build.

A specific template repo will provide the exact dimensions for some UI assets. Where exact sizes are repo-dependent, this document records the **required asset type and role** rather than inventing dimensions.

Primary visual goal:

> **Crazy Tuk should feel like a mobile arcade game layered over Bangkok, not a generic DeFi dashboard.**

The map is the main gameplay surface. DFlow trading should be visually integrated but still clearly recognizable as a real token swap.

---

# 1. Visual Direction

## Overall Style

Target:

```text
Bangkok street energy
+
late-90s / early-2000s arcade game
+
mobile rideshare UI
+
crypto-native humor
```

Avoid:

- generic glassmorphism,
- corporate fintech,
- realistic driving simulation,
- overly detailed isometric world,
- Google Maps / Grab clone aesthetic,
- excessive crypto terminal UI.

The interface should feel:

- bright,
- fast,
- readable,
- slightly chaotic,
- playful,
- Thai without becoming tourist-kitsch.

---

# 2. Map Art Direction

## Map Engine

MVP:

```text
MapLibre GL JS
```

MapLibre provides:

- real Bangkok geography,
- pan/zoom,
- road and river context,
- markers,
- route lines,
- custom visual styling.

Crazy Tuk provides all game presentation on top.

---

## Map Style Goal

The map should not look like ordinary navigation software.

Preferred treatment:

- simplified road hierarchy,
- muted or stylized base map,
- strong Chao Phraya River silhouette,
- parks retained,
- unnecessary POIs removed,
- custom Crazy Tuk labels over real map geography,
- exaggerated game markers.

The map is a **game board first**.

---

## MVP Map Layers

```text
1. MapLibre base
2. zone / neighborhood labels
3. authored Crazy Tuk location markers
4. passenger markers
5. player tuk-tuk marker
6. active route line
7. destination marker
8. effects / dialogue bubbles
9. HUD
```

---

# 3. Location Marker Style

Locations should not look like default map pins.

Suggested format:

```text
small illustrated icon
+
short location label
```

Examples:

```text
🍜 Midnight Noodles
🎧 Basement 404
💉 Face Factory
◎ Based Studio
✈️ Airport
```

Final art can use custom mini-icons instead of emoji.

Important:

- readable at mobile scale,
- tap target larger than visible icon,
- labels may appear only at useful zoom levels,
- active pickup should visually dominate nearby background locations.

---

# 4. Passenger Marker Style

NPC passenger marker:

```text
portrait
+
expiry timer
```

Example:

```text
[ PLOY PORTRAIT ]
   08:42
```

States:

```text
AVAILABLE
SELECTED
EXPIRING
ACTIVE
RESCUE (later)
```

Recommended visual hierarchy:

- available = normal portrait,
- selected = highlighted ring,
- expiring soon = animated/pulsing timer,
- unreachable = dimmed,
- rescue = special icon/border later.

---

# 5. Tuk-Tuk Sprite Requirements

For MVP, one tuk-tuk design is enough.

Avoid building a full vehicle customization system.

## Required

### Idle Tuk-Tuk
Static map marker / idle vehicle.

### Driving Tuk-Tuk
Simple looping motion.

Recommended:

```text
3–4 frames
```

Possible animation:

```text
frame 1 — normal
frame 2 — slight bounce
frame 3 — wheels shifted
frame 4 — slight bounce opposite
```

### Stalled Tuk-Tuk
Vehicle stopped.

Could reuse idle sprite with:

- smoke puff,
- hazard icon,
- empty fuel indicator,
- skull / stall badge rendered separately.

---

## Directional Sprites

Because MapLibre is top-down, we do not need full isometric animation.

Minimum:

```text
RIGHT
LEFT
```

Preferred if easy:

```text
RIGHT
LEFT
UP-RIGHT
DOWN-RIGHT
```

Mirroring can reduce required art.

The renderer can rotate or flip sprites when acceptable.

---

# 6. Tuk-Tuk Effects

Small separate effects are better than baking them into every sprite.

Suggested assets:

```text
speed lines
dust / exhaust puff
stall smoke
fuel splash / refuel effect
pickup pop
destination arrival burst
points pop
```

Most can also be CSS/SVG animation rather than raster assets.

---

# 7. NPC Portrait Requirements

Final target:

```text
30 NPC portraits
```

MVP:

```text
5–8 portraits
```

Portrait requirements:

- clear at small map-marker size,
- distinctive silhouette,
- strong facial expression,
- minimal background,
- consistent style,
- cropped so face/head reads quickly.

Recommended base deliverable:

```text
1 neutral portrait per NPC
```

Optional later:

```text
1 annoyed/stalled expression per NPC
```

Do not make full-body character sprites.

---

# 8. MVP NPC Portrait Priority

Create first:

```text
Auntie Lek
Dave
Ploy
P'Bank
Crypto Bro
```

Optional next:

```text
Mint
Beam
Uncle Somchai
```

---

# 9. Primary App Scenes

The existing game template should be reused wherever possible.

Exact layout dimensions should follow the template repo.

---

## Scene 0 — Loading

Purpose:

- initialize app,
- preload essential assets,
- establish brand.

Visual content:

```text
Crazy Tuk logo
loading indicator
Powered by DFlow
optional Superteam Thailand / hackathon logo
```

Optional loading lines:

- "Finding questionable passengers..."
- "Checking the fuel gauge..."
- "Avoiding Sukhumvit traffic..."
- "Waking up the driver..."

---

## Scene 1 — Home Screen / Install Interstitial

Existing template can be reused.

Purpose:

```text
Best played when added to Home Screen
```

Required:

```text
app icon
short instruction
continue anyway button
```

Always skippable.

---

## Scene 2 — Start Screen

Required:

```text
Crazy Tuk logo
hero artwork
START DRIVING
HOW TO PLAY
LEADERBOARD
wallet state / connect if appropriate
Powered by DFlow
```

Recommended hero:

```text
tuk-tuk tearing through stylized Bangkok
```

The start screen should sell the game in one glance.

---

## Scene 3 — Map / Gameplay

This is the primary game scene.

Required:

```text
MapLibre map
player tuk-tuk
available NPCs
active route
current destination
top HUD
bottom navigation / primary actions
```

HUD minimum:

```text
FUEL
POINTS
RANK
```

Rating can be added later.

---

## Scene 4 — Swap

Can be:

- dedicated scene,
- full-height mobile sheet,
- panel overlay.

Required:

```text
input token
input amount
output token
estimated output
estimated Crazy Tuk fuel
selected / matching fare indicator
SWAP & DRIVE
Powered by DFlow
collapsed trade details
```

Keep token UX familiar.

The game theme should wrap the swap, not obscure it.

---

## Scene 5 — Global Feed

Post-MVP / high-priority polish.

Venmo-style scrolling activity.

Examples:

```text
NPC review
player stalled
NPC complaint
fare complete
refuel
rank movement
rescue later
```

NPC commentary should be visually dominant.

---

## Scene 6 — Leaderboard

Required for MVP.

Display:

```text
rank
player
completed fares
points
```

Optional:

```text
rating
stalls
```

---

## Scene 7 — Driver Profile

Post-MVP.

Rideshare-inspired presentation:

```text
avatar / tuk-tuk
wallet / display name
star rating
fare count
points
stall count
longest stall
NPC reviews
```

---

# 10. Core Modals / Sheets

These should be overlays, not standalone pages.

---

## Wallet Connect

Triggered from any authenticated action.

Contents:

```text
Connect wallet
supported wallet options
cancel
```

Keep it minimal.

---

## NPC Fare Detail

Required:

```text
NPC portrait
name
one-line bio
pickup location
pickup fuel cost
swap requirement
points
expiry
SELECT FARE
```

Destination stays hidden.

---

## Selected Fare Mini-Card

Persistent small card:

```text
NPC
required swap
expiry
MAKE SWAP
```

---

## Swap Pending

States:

```text
waiting for signature
submitting
confirming
```

Visual theme can use:

```text
starting engine...
```

Do not hide the fact that a real transaction is pending.

---

## Swap Success

Required:

```text
swap successful
fuel earned
fare matched / current trip result
```

Then transition back into map gameplay.

---

## Destination Reveal

After pickup:

```text
NPC
destination
trip fuel required
current fuel
risk warning
DRIVE
```

This is a major dramatic/comedic moment.

---

## Stall

Required:

```text
OUT OF GAS
NPC
stall timer
remaining fuel needed
NPC comment
SWAP TO REFUEL
```

Should feel embarrassing and funny.

---

## Fare Complete

Required:

```text
FARE COMPLETE
points earned
remaining fuel
NPC completion comment
```

Optional later:

```text
star rating
review posted to feed
```

---

# 11. Mobile Layout Rules

Crazy Tuk is mobile-first.

The app should remain playable at narrow portrait widths.

Recommended navigation:

```text
MAP
SWAP
FEED
RANK
ME
```

If five tabs are too crowded, use:

```text
MAP
SWAP
FEED
MORE
```

with leaderboard/profile inside MORE.

---

## Mobile Map

Map should occupy most of the available screen.

HUD floats above map.

Bottom sheets handle:

- fare detail,
- swap,
- stall,
- fare completion.

Avoid navigating away from the map unless necessary.

---

## Mobile Tap Targets

Interactive map objects should have generous invisible touch areas.

NPC marker visible art can be small.

Tap target should remain large enough for comfortable use.

---

# 12. Desktop Layout Rules

Desktop should feel like an expanded version of mobile, not a different game.

Preferred:

```text
map remains primary
```

Possible layout:

```text
┌───────────────────────────────┬─────────────┐
│                               │             │
│            MAP                │ LIVE FEED   │
│                               │             │
│                               │             │
├───────────────────────────────┴─────────────┤
│ HUD / NAV / SWAP ACTION                     │
└─────────────────────────────────────────────┘
```

If global feed is not implemented yet:

```text
map can simply expand
```

Do not fill desktop with unnecessary dashboard cards.

---

# 13. Responsive Principle

Do not create separate mobile and desktop feature sets.

Same:

```text
state
map
fare
swap
player
```

Different presentation only.

---

# 14. App / Web Branding Asset Checklist

Exact dimensions should be copied from the template repo once inspected.

The following assets should exist.

---

## App Icon — Required

### iOS / PWA App Icon PNG

Required:

```text
square PNG
no transparency if template/iOS requires opaque background
high-resolution master
```

Use the exact icon dimensions expected by the repo.

Typical project may require multiple generated sizes, but create one high-quality square master first.

Art direction:

```text
Crazy Tuk logo mark
or
recognizable tuk-tuk icon
```

Must read at very small size.

Avoid tiny text.

---

## Android / PWA Icons

If the template manifest requests them, generate:

```text
standard app icon PNG
maskable app icon PNG
```

Exact dimensions from repo.

Maskable version should have generous safe padding.

---

## Site Favicon

Required:

```text
favicon.ico
```

Also useful if supported:

```text
favicon PNG
SVG favicon
```

Primary requirement from user:

```text
.ico for site
```

Keep icon extremely simple.

---

## Share Banner / Social Preview

Required:

```text
Open Graph / social share banner
```

Common target:

```text
1200 × 630
```

Verify template metadata before export.

Content suggestion:

```text
CRAZY TUK logo
Bangkok map / tuk-tuk scene
"Swap. Drive. Don't Run Out of Gas."
Powered by DFlow
```

Should work when shared on:

- X,
- Discord,
- Telegram,
- link previews.

---

## Splash / Start Hero

Required:

```text
main title-screen artwork
```

Template repo determines aspect ratio.

Recommended scene:

```text
tuk-tuk
Bangkok nightlife
passengers / map hints
arcade energy
```

Need versions/crops if desktop and mobile hero framing differ.

---

## Loading Logo / Mark

Required:

```text
Crazy Tuk primary logo
```

Prefer transparent PNG or SVG if template supports SVG.

---

## Wordmark

Useful separate asset:

```text
CRAZY TUK wordmark
```

This allows logo mark + text to be arranged differently on:

- loading,
- start,
- HUD,
- share banner.

---

# 15. Core Logo Asset Set

Recommended production list:

```text
crazy-tuk-logo-full
crazy-tuk-wordmark
crazy-tuk-mark
```

Output formats depending on repo support:

```text
SVG
transparent PNG
```

Do not duplicate exports until actual template sizes are known.

---

# 16. DFlow / Partner Branding Assets

Need clean placement for:

```text
Powered by DFlow
```

Also potentially:

```text
Superteam Thailand
Buildathon branding
```

Use official assets if provided by organizers.

Do not redraw sponsor logos manually.

Possible placements:

- loading screen,
- start screen,
- swap scene,
- footer / about.

DFlow should be especially visible on the swap scene.

---

# 17. Map Asset Checklist

Even with MapLibre, custom visual assets are required.

MVP:

```text
player tuk-tuk marker
NPC markers / portraits
pickup marker state
destination marker
airport marker
selected fare marker
route style
stall marker
```

Later:

```text
custom zone icons
custom location-category icons
crypto-event marker
rescue marker
ghost tuk-tuk style
```

---

# 18. Location Icon Checklist

Do not create one unique illustration for all 50 locations initially.

Create reusable category icons first.

Suggested category set:

```text
food
bar / nightlife
club / music
cafe
market
mall / shopping
park
muay thai / gym
beauty / clinic
coworking
crypto event
hotel / hostel
tourism
transit
airport
arts
mystery / special
```

~16 reusable icons can represent most locations.

Unique logo-like graphics can be added later for standout places.

---

# 19. HUD Asset Checklist

HUD should primarily use vector/UI components.

Possible icons:

```text
fuel
points / trophy
rank
star
wallet
map
swap
feed
profile
timer
stall
rescue
```

Prefer:

```text
SVG / icon library
```

over generated raster art unless the template requires custom art.

---

# 20. Effects / Feedback Assets

High-value visual feedback:

```text
+FUEL burst
+POINTS burst
FARE FOUND
PASSENGER PICKED UP
DESTINATION REVEALED
OUT OF GAS
ENGINE STARTED
FARE COMPLETE
```

These can be text animation + lightweight effects.

No dedicated raster assets required unless desired.

---

# 21. Audio Stub

Not required, but high-value if fast.

Possible sound moments:

```text
tuk-tuk engine start
horn
pickup chime
destination reveal sting
stall sputter
fare complete
points
```

Do not delay build for audio.

---

# 22. Asset Generation Priority

Generate in this order.

## P0 — Branding / Required App Assets

```text
1. Crazy Tuk primary logo
2. app icon master PNG
3. site favicon.ico
4. social share banner
5. start-screen hero image
```

These are required for presentation/submission quality.

---

## P1 — Core Gameplay

```text
6. tuk-tuk sprite
7. 5 MVP NPC portraits
8. passenger marker treatment
9. destination / pickup marker set
10. basic location-category icons
```

---

## P2 — Polish

```text
11. expanded NPC portraits
12. more location icons
13. special airport art
14. crypto-event markers
15. stall/refuel visual effects
16. feed avatars / badges
```

---

# 23. Repo-Specific Asset Audit

Before final export, inspect the template repo for:

```text
/public
/assets
/icons
/manifest
metadata
favicon references
Open Graph references
splash assets
loading images
mobile safe areas
```

Create a final checklist containing:

```text
exact filename
exact dimensions
file format
transparency requirement
where used
```

Do not guess these sizes in advance.

---

# 24. Suggested Final Asset Manifest Format

When repo is available, create:

```text
ASSET NAME
FILE NAME
DIMENSIONS
FORMAT
TRANSPARENCY
USAGE
STATUS
```

Example:

```text
App icon
icon-512.png
[repo-required size]
PNG
opaque
PWA / mobile
TODO
```

---

# 25. MVP UI Acceptance Criteria

UI is ready for hackathon when:

- [ ] Loading screen is branded.
- [ ] Start screen looks like a game.
- [ ] Wallet connection is obvious.
- [ ] Map is primary visual surface.
- [ ] Player tuk-tuk is immediately identifiable.
- [ ] NPC fares are readable/tappable.
- [ ] Swap interface is understandable.
- [ ] DFlow attribution is visible.
- [ ] Fuel effect is visible before and after swap.
- [ ] Destination reveal feels dramatic.
- [ ] Stall state is unmistakable.
- [ ] Fare completion visibly awards points.
- [ ] Leaderboard is readable on mobile.
- [ ] Desktop preserves the same experience.
- [ ] App icon exists.
- [ ] favicon.ico exists.
- [ ] social share banner exists.

---

# 26. One-Day Art Rule

For the hackathon:

> **Do not generate unique art where a reusable UI treatment will work.**

Examples:

Do:

```text
one tuk-tuk sprite
five NPC portraits
sixteen category icons
```

Do not:

```text
fifty unique building paintings
thirty animated passenger bodies
eight tuk-tuk skins
```

The game should look authored without requiring a full game's asset budget.

---

# 27. Final Visual Principle

The desired player reaction is:

> **"This looks like a weird little Bangkok arcade game."**

Then they open Swap and realize:

> **"Wait — this is actually executing through DFlow."**

Then the swap confirms:

> **"Oh. The swap just became the game."**

That transition is the most important UI/art moment in Crazy Tuk.
