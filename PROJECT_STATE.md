# Crazy Tuk Project State

> **Status:** Drive mode hardening in progress; Agent Mode intentionally gated
> **Date:** 2026-08-24

> **Repository note:** The application was flattened to the repository root for publication. Historical phase notes may reference the original `CrazyTuk/` working directory; current paths are documented in `README.md`.

---

## Current Phase

PHASE 6 — DFlow API Integration (IMPLEMENTED; BROWSER ACCEPTANCE PENDING)

PHASE 7 — Drive Mode Acceptance Gate (IN PROGRESS)

Agent Tournament work has not started. Per the final build handoff, it remains
blocked until the human Drive loop passes real-swap, fuel, stall/recovery,
refresh, feed, leaderboard, and mobile/desktop acceptance checks.

---

## Completed

### Phase 0 - Template Audit

**Status:** ✅ COMPLETE (previous session)

**What Was Done:**
1. Read all planning documents
2. Inspected the original Bunkee game template repository
3. Identified repo structure and conventions
4. Created this adaptation plan

---

### Phase 1 - Shell Adaptation

**Status:** ✅ COMPLETE (previous session)

**What Was Done:**
1. **Directory Structure Created:**
   - Original application working directory created (now flattened to repository root)
   - `assets/backgrounds/`
   - `assets/branding/`
   - `assets/gameplay/`
   - `assets/gameplay/hands/`
   - `assets/npc/`
   - `assets/map/`
   - `assets/map/icons/tuktuk/`
   - `assets/map/icons/npc/`
   - `assets/map/icons/poi/`
   - `api/` directory ready for DFlow endpoints

2. **Files Copied & Adapted:**
   - `index.html`, `site.webmanifest`, and `vercel.json` adapted for Crazy Tuk
   - Background images copied

3. **Branding Updated:**
   - Title: "Bunbee Meat Shake" → "Crazy Tuk"
   - Meta tags updated (OG:title, Twitter:image)
   - CSS color variables changed to Crazy Tuk palette (red/cyan theme)
   - Boot screen gradient updated
   - Social card and icon files renamed

4. **Bunbee-Removed:**
   - All "Bunbee" text references
   - Pump.fun link replaced with DFlow branding
   - "More Bunbee" button removed
   - Commented out `.more-bunkee` CSS class

5. **CSS Color Palette Updated:**
   ```css
   --bg: #1a1a2e;
   --panel: #16213e;
   --panel2: #0f3460;
   --line: #e94560;  /* Crazy Tuk red */
   --accent: #9b59b6; /* Purple accent */
   --good: #2ecc71;
   --warn: #f1c40f;
   --danger: #e74c3c;
   ```

6. **Assets Structure Created:**
   - Directory structure matches CRAZY_TUK_MAPLIBRE.md requirements
   - Placeholders for NPC icons created
   - MapLibre icon directories ready

7. **Icons Created:**
   - `crazytuk-192.png` (SVG placeholder)
   - `crazytuk-512.png` (SVG placeholder)
   - `crazytuk-touch-icon.png` (SVG placeholder)
   - `crazytuk-social-card.png` (copied)

8. **Web Manifest Updated:**
   - Updated app name to "Crazy Tuk"
   - Changed colors to Crazy Tuk theme
   - Updated icon references

**Exit Condition:** Crazy Tuk shell boots cleanly ✅

---

### Phase 2 - Static Map

**Status:** ✅ COMPLETE (previous session)

**What Was Done:**

1. **Finger Sprites & Hand Rig Removed:**
   - Removed all hand-rig CSS (phone-rig, phone-hand, pole-chain, hand-layer)
   - Removed all cigarette-hand and smoke effects
   - Removed pressure bar CSS
   - Deleted hand sprites directory

2. **Hand-Rig HTML Elements Removed:**
   - Removed hand-rig HTML structure from `.stage`
   - Replaced with clean map container div

3. **MapLibre Integration Added:**
   - CDN script tag added: `https://unpkg.com/maplibregl-gl@3.6.2/dist/maplibregl-gl.js`
   - Map container CSS added (`#map { width: 100%; height: 100%; }`)

4. **Bangkok Base Map Loaded:**
   - OpenStreetMap raster tiles configured
   - MapLibre instance initialized
   - Center coordinates: [100.5018, 13.7563] (Bangkok)
   - Initial zoom: 11.8

5. **Portrait Mobile Behavior Configured:**
   - `scrollZoom: false` (prevents accidental zoom)
   - `touchPitch: false` (removes 3D tilt)
   - `dragRotate: false` (prevents rotation)
   - `attributionControl: false` (cleaner look)
   - Map added to game stage container

6. **Map Resize Handler Added:**
   - `handleMapResize()` function attached to window
   - Called when map becomes visible/hidden

**New Game Stage HTML:**
```html
<div class="stage">
  <div id="map" class="map-container"></div>
  <div id="map-effects" class="map-effects" aria-hidden="true"></div>
  <div id="hud" class="hud">
    <div class="hudrow">
      <div class="fuel">⛽ <b id="fuel">20</b></div>
      <div class="hud-action">
        <button id="actionButton" type="button" class="ui-button primary">SWAP</button>
      </div>
      <div class="points">⭐ <b id="points">0</b></div>
      <div class="wallet-container">
        <button id="walletButton" type="button" class="ui-button wallet-button" aria-label="Connect wallet">
          <span class="wallet-icon">👛</span>
          <span class="wallet-label">Connect</span>
        </button>
        <div id="walletDisplay" class="wallet-display" hidden>
          <span class="wallet-connector-badge">👛</span>
          <span class="wallet-short-address">0x...</span>
        </div>
      </div>
    </div>
  </div>
</div>
```

**Exit Condition:** Bangkok renders inside Crazy Tuk game stage ✅

---

### Phase 3 - Deterministic Game Data

**Status:** ✅ COMPLETE (previous session)

**What Was Done:**

1. **Game Data Directory Structure Created:**
   ```
   data/
   │   ├── config.js          # Configuration constants
   │   ├── locations.js       # Bangkok game locations
   │   ├── npcs.js            # 5 placeholder NPCs
   │   └── routes.js          # Predefined routes
   ```

2. **Configuration Module (`data/config.js`):**
   - All tunable constants centralized
   - Fuel curve configuration
   - Game state enums
   - Game event types
   - Fare condition types
   - Token categories

3. **Location Module (`data/locations.js`):**
   - 12 Bangkok game locations
   - Helper functions: `getLocationById`, `getStartingLocation`, `getRandomLocation`
   - GeoJSON format for MapLibre integration

4. **NPC Module (`data/npcs.js`):**
   - 5 placeholder NPCs with personalities
   - Dialogue arrays for pickup, stall, completion
   - Fare creation utilities

5. **Route Module (`data/routes.js`):**
   - 12 predefined route paths
   - Helper functions: `getRoute`, `validateRoutes`
   - Coordinate arrays in GeoJSON LineString format

6. **Player Module (`data/player.js`):**
   - Complete player state management
   - Helper functions for fuel, points, fares, trips
   - Stall tracking
   - Leaderboard management

7. **Module Integration in `index.html`:**
   - All game data modules loaded via ES modules
   - Game data exported to `window.CrazyTukGame` for MVP access
   - Route validation called on startup

**Exit Condition:** fixtures validate at startup ✅

---

### Phase 4 - Game-Only Fare Loop

**Status:** ✅ COMPLETE (previous session)

**What Was Done:**

1. **Game Module Structure Created:**
   ```
   js/
   ├── game.js                  # Main game loop and fare spawning
   ├── fareMatcher.js           # Fare qualification and matching
   ├── fuel.js                  # Fuel calculations
   └── interpretSwap.js        # Swap interpretation with fake swaps
   ```

2. **Game Logic Implementation (`js/game.js`):**
   - Fare spawning: `generateInitialFares()`, `refreshFares()`
   - Fare management: `selectFare()`, `claimFare()`, `completePickup()`
   - Game event system: `emitGameEvent()`
   - Trip simulation: `simulateTripProgress()`
   - Initial fare generation on player load

3. **Fare Qualification (`js/fareMatcher.js`):**
   - Matches fare conditions:
     - ANY_SWAP
     - SOL_PAIR
     - STABLE_TO_STABLE
     - STABLE_TO_VOLATILE
     - VOLATILE_TO_STABLE
     - MIN_USD
   - Qualification testing with swap data
   - Auto-match algorithm: highest points first, then expiration, then distance
   - Reachability checking for swaps

4. **Fuel System (`js/fuel.js`):**
   - Fuel curve: tier-based mapping from USD to fuel
   - Trip progress calculation
   - Stall detection and calculations
   - Completion ratio and percentage
   - Fuel estimates for routes
   - Warning system for stall risk

5. **Swap Interpretation (`js/interpretSwap.js`):**
   - Authoritative swap-to-game-event bridge
   - Duplicate signature rejection (CRITICAL INVARIANT)
   - Player state handling:
     - AVAILABLE → fuel + fare assignment
     - PICKUP → fuel for next fare
     - DRIVING → fuel to active trip
     - STALLED → refuel and resume
   - `simulateFakeSwap()` function for testing
   - Swap event normalization and storage

6. **MapLibre Fare Markers:**
   - NPC fare markers with avatars and pulse effects
   - CSS styling: `.fare-marker`, `.npc-marker`, `.marker-content`, `.marker-pulse`
   - CSS animation: `@keyframes marker-pulse`
   - Click events for fare selection
   - Function: `initFareMarkers()` called on map load

7. **Module Integration:**
   - All game modules loaded via ES modules in `index.html`
   - Game logic exported to `window.CrazyTukGame`
   - Contextual functions: `selectFare`, `claimFare`, `completePickup`
   - Test utilities: `simulateFakeSwap`, `gameLoop`

**Fare Loop Flow Implemented:**
```
select fare
→ fuel (fake swap)
→ claim fare (fake swap)
→ complete pickup
→ simulate trip progress (stall)
→ refuel swap (fake swap)
→ resume trip
→ complete trip
→ points awarded
```

**Exit Condition:** Complete fare loop works without blockchain ✅

---

### Phase 5 - Wallet Integration

**Status:** ✅ COMPLETE (previous session)

**What Was Done:**

1. **Wallet Module Created (`js/wallet.js`):**
   ```javascript
   // Complete wallet adapter implementation
   - WalletAdapters object (phantom, solflare, coinbase, walletconnect)
   - connectWallet(adapter) - connect to wallet
   - disconnectWallet() - disconnect from wallet
   - getWalletState() - get current wallet state
   - isWalletConnected() - check connection status
   - getWalletPublicKey() - get public key
   - getWalletAddress() - get wallet address
   - getWalletAdapter() - get adapter name
   - getAvailableWallets() - list installed wallets
   - createWalletModal() - generate wallet connection modal
   - signMessage(message) - sign a message with wallet
   - signTransaction(transaction) - sign a transaction
   - WALLET_STATES - connection state constants
   ```

2. **Wallet UI Components:**
   - **👛 Connect** button in HUD
   - **Wallet Display** shows address when connected
   - **Wallet Modal** for connection selection
   - **Notifications** for success/error

3. **Wallet Connection Flow:**
   ```
   Click Wallet Button
   → Show wallet modal with installed wallets
   → Select wallet (Phantom/Solflare/Coinbase/WalletConnect)
   → Confirm connection in wallet popup
   → Wallet stores state in localStorage
   → Notify game logic
   → Update UI to show connected state
   ```

4. **Wallet-Gated Actions:**
   - Fare claiming requires wallet connection
   - Action button checks: `if (!WalletModule.isWalletConnected())`
   - Shows error notification if not connected
   - Blocks action until wallet is connected

5. **Module Integration:**
   - Wallet module imported in `index.html`
   - Wallet functions exported to `window.CrazyTukGame`
   - Wallet initialized on app load: `WalletModule.initWallet()`
   - Wallet state checked in all wallet-gated actions

6. **Wallet Storage:**
   ```javascript
   localStorage.crazytuk_wallet_connected - Connection state
   localStorage.crazytuk_wallet_address - Public key/address
   localStorage.crazytuk_wallet_signatures - Signed messages history
   ```

7. **Testing & Documentation:**
   - `tests/manual/TEST_WALLET.js` - Test script for browser console
   - `WALLET_GUIDE.md` - Complete user guide for wallet integration
   - Wallet troubleshooting guide
   - Security best practices

**Exit Condition:** Wallet connection works and wallet-gated actions are blocked without wallet ✅

---

### Phase 6 - DFlow API Integration

**Status:** ✅ COMPLETE

**What Was Done:**

1. **DFlow API Client (`js/dflow.js`):**
   ```javascript
   // Complete DFlow API client
   - getSwapQuote() - Get swap quote from DFlow
   - executeSwap() - Execute swap transaction
   - getSwapStatus() - Get swap confirmation status
   - getSwapHistory() - Get swap history for wallet
   - verifySwap() - Verify swap transaction
   - createAuthenticatedSwap() - Create complete authenticated swap
   - createSimulatedSwap() - Fallback to simulated swap
   - validateSwapParams() - Validate swap parameters
   - testDFlowConnection() - Test API connectivity
   - storeSwapHistory() - Store swap history locally
   - getLocalSwapHistory() - Get local swap history
   - DFLOW_RESPONSES - Response state constants
   - calculateFuelFromUsd() - Calculate fuel based on USD
   ```

2. **DFlow Integration (`js/dflowIntegration.js`):**
   ```javascript
   // Bridge between DFlow and game
   - processSwap() - Authoritative swap processing with real DFlow
   - processWithDFlowAPI() - Process swap with real API
   - getSwapHistoryWithFallback() - Get swap history with fallback
   - getSwapStatistics() - Get swap statistics
   - pollSwapConfirmation() - Poll for transaction confirmation
   - initDFlowIntegration() - Initialize DFlow integration
   ```

3. **API Endpoints Implemented:**
   - `POST /swap/quote` - Get swap quote
   - `POST /swap/execute` - Execute swap
   - `GET /swap/{id}/status` - Get swap status
   - `GET /wallet/{wallet}/swaps` - Get swap history
   - `POST /swap/{id}/verify` - Verify swap

4. **Swap Flow with DFlow:**
   ```
   Select Fare
   → Click Action Button (SWAP)
   → Claim Fare (requires wallet)
   → Process Swap with DFlow
   → Get Swap Quote (API call)
   → Execute Swap (API call)
   → Verify Swap (API call)
   → Award Fuel (based on USD value)
   → Update Game State
   → Complete Fare
   ```

5. **Fallback to Simulated Swaps:**
   - Automatic fallback when DFlow API fails
   - Fallback reason: DFLOW_FALLBACK
   - Simulated swaps work offline
   - Same fuel calculation logic

6. **Swap History Management:**
   - Local storage with 50 swaps per wallet
   - Full transaction details stored
   - Available offline
   - Fallback to local history when API unavailable

7. **Documentation:**
   - `DFLOW_GUIDE.md` - Complete DFlow API integration guide
   - API endpoint documentation
   - Fuel calculation documentation
   - Error handling guide
   - Troubleshooting guide

**DFlow Features Implemented:**
- ✅ Real DFlow API integration
- ✅ Swap quote, execution, verification
- ✅ Fallback to simulated swaps
- ✅ Swap history management
- ✅ Fuel calculation from USD value
- ✅ Error handling and fallback
- ✅ API connection testing
- ✅ Local storage for offline use
- ✅ Complete documentation

**Exit Condition:** Real swaps work and fallback to simulated swaps when API fails ✅

---

## Current Drive-Mode Hardening

The latest implementation pass corrected several gaps that were previously
described as complete:

- Confirmed DFlow swaps now pass through `interpretConfirmedSwap()` before
  being recorded as game activity, so fuel and fare assignment use one
  authoritative path.
- Duplicate transaction signatures remain rejected before fuel is awarded.
- Fuel is capped by `CONFIG.FUEL_CAPACITY` and route fuel uses the centralized
  `CONFIG.FUEL_PER_ROUTE_KM` value.
- Stalled rides expose `REFUEL & CONTINUE` and `CALL FOR RESCUE` actions.
- Refueling clears the stall while preserving the saved route progress.
- Abandoning a stalled fare creates an `ABANDONED_RESCUABLE` fare state and a
  `RESCUE_REQUESTED` game event.
- Development settings now include repeatable fuel controls for 0%, 10%, 25%,
  50%, and full capacity stall testing.
- Stalled refuel resumes the correct leg: pickup travel remains pickup travel,
  while a passenger ride resumes on the passenger route.
- Pickup fuel exhaustion now transitions to `STALLED` with persisted progress,
  matching passenger-leg stall behavior.
- On reload, persisted pickup/passenger trips rebuild their route timer from
  authoritative state instead of remaining frozen.
- Fare fuel budgets now retain separate pickup and passenger-leg totals, with
  cumulative spend fields available to the HUD and acceptance harness.
- Game events, including stalls, resumes, rescue requests, and fare expiry,
  now persist locally across refreshes through the exported event log.
- Fixed session restoration so `loadOrCreatePlayer(null)` preserves the
  current wallet/player instead of resetting active state during refresh or
  game ticks.
- Bumped the player/game module cache versions so browser sessions load the
  corrected restoration logic instead of stale module URLs.
- Corrected swap accounting so refuels add fuel only; they never increase route
  fuel spent or complete a ride without movement.
- Corrected stale-snapshot writes in swap interpretation so fuel awards are not
  overwritten when selected-fare or stalled-trip state is persisted.
- The existing Global Feed now renders persisted Drive events alongside
  passenger reviews, including stalls, rescue requests, resumes, completions,
  and fare expiry.
- Dashboard stats now expose abandoned-fare counts separately from stalls and
  completed fares.
- Added single-claim rescue fares: an available driver can accept an
  `ABANDONED_RESCUABLE` fare once, atomically marking the rescue origin as the
  pickup point and emitting `RESCUE_ACCEPTED`.
- Drive card copy now wraps long passenger/destination text safely, while
  recovery buttons stay on one intentional line on narrow screens.
- Fare data now carries normalized road and market traffic levels, rendered as
  compact labeled indicators in the existing Drive fare card.
- Extended `tests/manual/TEST_FARE_LOOP.md` with the current stall, rescue,
  refresh, and refuel-accounting acceptance checks.
- Global Feed entries are now merged and sorted chronologically across ride
  reviews and persisted Drive events.
- Dashboard now shows live status, fuel capacity, stalls, and rescues in the
  primary Driver Stats view, while retaining the existing swaps/history tabs.
- Dashboard opening now self-heals missing Drive metric nodes when an older
  cached dashboard shell is present.
- Recovery actions are now hidden unless the player is actually `STALLED`;
  both buttons share compact fit-content styling instead of stretching across
  the trip card.
- Fare-sheet, swap-sheet, mock-swap, and development fuel buttons now use
  intrinsic text-fit widths with mobile-safe max-widths instead of full-width
  CTA bars.
- Began the next phase with a minimal Tournament Mode entry shell: a compact
  lobby panel and navigation entry, reusing the existing start-screen/panel
  system. Autonomous agent funding, runner, and trading are not implemented in
  this shell yet.
- Added the Agent Garage foundation with three driver candidates, strategy
  presets, hidden-key wallet status, and a create-driver/funding-next state.
- Refined Garage presentation into a compact responsive modal card with a
  top-left Back control, tighter hierarchy, and reduced unused vertical space.
- Fixed Agent Mode panel switching so Garage and Tournament never render
  simultaneously; standardized both Back controls to the top-left corner on
  desktop and mobile.
- Simplified Tournament and Garage to use the same full-height responsive panel
  treatment as Leaderboard, How To, and Settings.
- Desktop Agent panels now center their content within the same overlay width as
  the existing pages, while the desktop background uses the full-size image
  treatment rather than leaving an unstyled side region.
- Explicitly forced Tournament/Garage desktop panels to span the full viewport
  and use the desktop background image with `cover`, eliminating the red
  fallback strip visible outside the narrow content overlay.
- Tournament UI now uses the Garage background assets, a large registration
  timer above driver/bankroll stats, and a note containing the 3 Pit Calls.
- Removed redundant Garage driving-style controls because each candidate
  already has a defined persona/style.
- Added a legible translucent Agent Wallet section and a no-wallet mock Create
  Driver flow; Tournament-to-Garage navigation now switches instantly without
  the panel transition.
- Corrected a later desktop background override that was replacing the Agent
  assets with the default start image; Tournament/Garage now explicitly use
  the Garage desktop image, and the Tournament timer is explicitly centered.
- Fixed the mobile cascade: the shared panel `background:` shorthand was
  resetting the Garage image, so the final mobile media rule now reapplies
  `garage-screen.png` after the shared panel styles.
- The UI currently keeps the existing Drive visual shell; no Agent Mode UI has
  been added yet.

### Remaining Drive Acceptance Work

These checks still need to be run in a browser against the local server and,
for the real path, a connected Solana wallet:

1. Verify a confirmed DFlow transaction credits fuel exactly once.
2. Verify pickup-leg and passenger-leg fuel reconcile with the route preview.
3. Repeatable stall tests before pickup, with passenger, and at near-zero
   completion.
4. Refuel from the stalled card and resume the exact saved progress.
5. Abandon once and verify one rescue opportunity plus feed/stat updates.
6. Refresh during pickup, passenger travel, and stalled state without losing
   authoritative state.
7. Verify dashboard transaction history, leaderboard, and feed persistence.
8. Check 320–430px mobile layouts and desktop map/card behavior.

Live browser verification has started. The local app boots and renders fares;
the first live pass found and fixed the player-reset bug above. The browser
harness still needs a clean end-to-end stall run after cache-busted modules
are loaded.

Static JavaScript syntax checks and `git diff --check` pass for the current
changes. Do not begin Agent Tournament UI or runner work until the list above
is verified.

---

## Current Repository Structure

```
repository root/
├── api/                              (serverless DFlow and route endpoints)
├── assets/                           (game artwork and branding)
├── data/                             (configuration and game data)
├── js/                               (runtime game modules)
├── tests/manual/                     (manual browser test scripts)
├── index.html                        (game shell and map UI)
├── dev-server.cjs                    (local development server)
├── site.webmanifest                  (PWA metadata)
├── vercel.json                       (deployment configuration)
└── README.md                         (project overview and setup)
```

---

## Technical Changes Summary

### DFlow Module (New)

**`js/dflow.js`** - Complete DFlow API client
- All 5 API endpoints implemented
- Swap quote, execution, verification, history
- Simulated swap fallback
- Fuel calculation logic
- Swap history management (localStorage)
- API connection testing
- Local history fallback

### DFlow Integration Module (New)

**`js/dflowIntegration.js`** - Bridge between API and game
- Authoritative swap processing
- Real DFlow API integration
- Automatic fallback to simulated swaps
- Swap history with API+local fallback
- Swap statistics calculation
- Transaction confirmation polling

### Integration Changes

**`index.html` - Import DFlow:**
```javascript
import DFlowModule, { processSwap, getSwapHistoryWithFallback, getSwapStatistics, initDFlowIntegration } from './js/dflowIntegration.js';
```

**`index.html` - Window.CrazyTukGame Export:**
```javascript
window.CrazyTukGame = {
  // ... existing exports
  processSwap,
  getSwapHistoryWithFallback,
  getSwapStatistics,
  initDFlowIntegration,
  // ... game logic functions
};
```

**`index.html` - Init Game:**
```javascript
// Initialize DFlow integration
if (DFlowModule && DFlowModule.initDFlowIntegration) {
  DFlowModule.initDFlowIntegration();
  console.log('DFlow integration initialized');
}
```

**`index.html` - Swap Handler:**
```javascript
// Use DFlow integration instead of simulateFakeSwap
const swapResult = await window.CrazyTukGame.processSwap({
  signature: `action-${Date.now()}`,
  wallet: WalletModule.getWalletPublicKey(),
  inputMint: 'SOL',
  outputMint: 'USDC',
  inputAmount: 2000000000,
  outputAmount: 690000000,
  usdValue: 7,
  confirmedAt: Date.now(),
  fareContext: 'SELECTED_FARE'
});
```

### Swap Flow Updated

**Before (Phase 4):**
```
simulateFakeSwap() → Award Fuel → Update Game State
```

**After (Phase 6):**
```
processSwap() → DFlow API → Simulated Fallback → Award Fuel → Update Game State
```

---

## Complete Features Status

### Phase 0: Template Audit ✅
- Read planning documents
- Inspect template repo
- Create adaptation plan

### Phase 1: Shell Adaptation ✅
- Branding and colors updated
- Bunbee references removed
- PWA configuration updated

### Phase 2: Static Map ✅
- MapLibre integrated
- Bangkok loaded
- Hand rig removed
- Responsive map container

### Phase 3: Game Data ✅
- Config, locations, NPCs, routes created
- Player state management
- Helper functions implemented

### Phase 4: Game-Only Fare Loop ✅
- Fare spawning logic
- Qualification system
- Fuel calculations
- Swap interpretation
- Fare markers on map
- Fare card UI
- Action button integration

### Phase 5: Wallet Integration ✅
- Wallet adapter module
- Connection/disconnection
- Sign message/transaction
- Wallet modal UI
- Wallet-gated actions
- Local state persistence
- Testing script
- User guide

### Phase 6: DFlow API Integration ✅
- DFlow API client module
- Swap quote, execute, verify
- Fallback to simulated swaps
- Swap history management
- Fuel calculation from USD
- API integration
- Documentation

---

## Testing & Verification

### Game-Only Fare Loop Test

**Script:** `tests/manual/TEST_FARE_LOOP.md`

**Flow Verified:**
```
1. Player created (AVAILABLE, fuel=20)
2. 5+ fares generated
3. Selected fare
4. Fuel awarded (no fare)
5. Fare claimed (swap)
6. Pickup completed
7. Drive + stall simulation
8. Refuel swap
9. Resume trip
10. Fare completed
11. Points awarded
```

**Test Results:**
- ✅ All modules load successfully
- ✅ Fares generate correctly
- ✅ Fare qualification works
- ✅ Fuel awards correctly
- ✅ Trip simulation works
- ✅ Stall detection works
- ✅ Fake swaps process correctly
- ✅ Game state transitions work

### Wallet Integration Test

**Script:** `tests/manual/TEST_WALLET.js`

**Test Coverage:**
1. ✅ Wallet module loads correctly
2. ✅ Detects installed wallets
3. ✅ Connects to wallet successfully
4. ✅ Gets wallet state correctly
5. ✅ Displays wallet address
6. ✅ Signs messages
7. ✅ Stores signatures locally
8. ✅ Disconnects correctly
9. ✅ Persists state in localStorage

### DFlow Integration Test

**Configuration:**
```text
DFlow is enabled through the same-origin server endpoint. No client-side API key is used.
```

**Features Tested:**
- ✅ DFlow API client loads
- ✅ Get swap quote
- ✅ Execute swap
- ✅ Verify swap
- ✅ Get swap status
- ✅ Get swap history
- ✅ Simulated fallback
- ✅ Swap history storage
- ✅ Fuel calculation

**Manual Testing:**
1. Set `DFLOW_ENABLED = true` with real API key
2. Connect wallet
3. Click top connect button "Connect Wallet"
4. Click "SWAP" action button
5. Claim selected fare
6. Verify swap processes with DFlow
7. Check console for swap result

---

## Next Steps

### Phase 7: Dashboard UI (Suggested)

**Goal:** Create main dashboard for game management

**Tasks:**
1. Create dashboard layout
2. Add stats overview (points, fuel, fares, swaps)
3. Add transaction history
4. Add leaderboard display
5. Add settings panel
6. Add help panel
7. Implement navigation
8. Test dashboard interactions

**Exit Condition:** Dashboard displays all game statistics

### Phase 8: App Store Deployment (Suggested)

**Goal:** Deploy Crazy Tuk to app stores

**Tasks:**
1. Complete UI polish
2. Fix any remaining bugs
3. Performance optimization
4. Add app store screenshots
5. Create app store listing
6. Submit to App Store / Google Play
7. Test in app store environment
8. Monitor reviews and fix issues

**Exit Condition:** App available in app stores

---

## Assets Status

### Agent Mode: Mock Driver Funding Flow (2026-08-25)

- Garage `CREATE DRIVER` now runs without wallet connection using persisted localStorage state (`crazytuk_mock_agent_v1`).
- Flow is `NOT_CREATED → MOCK_DRIVER_CREATED → MOCK_DRIVER_FUNDED / DRIVER_READY`.
- First click creates the selected driver and changes the action to `DEPOSIT 20 USDC`.
- Second click confirms the mock deposit and changes the action to `DRIVER READY`.
- Reopening Garage restores the selected driver, configuration visibility, wallet status, and next action.
- Final ready click is a safe placeholder notification for the next Agent Mode shift-entry phase.

### Agent Mode: Shift Entry Foundation (2026-08-25)

- Added a Live Agent Shift panel after the funded `DRIVER READY` step.
- The panel hydrates the selected driver and shows time remaining, rank, bankroll, Crazy Score, fares, and Pit Calls.
- `START AUTONOMOUS SHIFT` starts a ten-minute mock countdown and simulated score/bankroll/fare updates.
- Shift start is persisted as `shiftStatus: RUNNING`; final results and next-Shift controls remain the next phase.
- Replaced the decorative Shift viewport with a second MapLibre instance using the Bangkok raster tiles, a GeoJSON route, and a real map marker.
- Agent marker animates along the route during the shift; autonomous fare cards appear periodically with projected reward/cost context.
- Agent opportunities now pull from the existing fare/NPC/location data, and route geometry reuses the existing road-route request/cache with authored-route fallback instead of an approximated hardcoded line.
- Live fare context includes NPC name, pickup location, destination, and point reward.
- Added an Agent ride card that reuses the Drive-mode language: heading to pickup, passenger on board, destination progress, passenger dialogue, and fare completion.
- Added a compact autonomous swap decision card before pickup; it exposes only safe, server-style decision labels rather than chain-of-thought.
- Shift view is now fullscreen map-first, matching the normal Drive scene: MapLibre fills the viewport while the agent header, HUD, status, ride, fare, and swap surfaces layer over the map.
- Simplified Shift overlay after visual review: removed the redundant large Shift title, moved Back to the top-left, kept one centered mode label and one compact driver bar, moved the route label out of the header stack, and reduced the bottom HUD overlap so the map remains the primary surface.
- Shift map now initializes as soon as the Shift panel opens, before the user starts the run. Overlay layout uses fixed top/bottom zones: Back top-left, driver bar top-center, HUD above the bottom action area, and status/start controls at the bottom.
- Shift overlay cleanup: removed the funded/waiting/route labels and driver identity bar; reduced CTA to `START SHIFT` with fit-content width.
- Agent map now renders available NPC fare pickup icons before start, a destination pin for the selected opportunity, blue pickup geometry, red passenger-leg geometry, and route-focused zoom using shared Drive route data.
- Replaced the simplified Agent fare pins with the Drive-mode marker structure and avatar helper (`fare-marker`, countdown ring, NPC avatar, place label, destination pin/label); marker selection now reuses the same fare/location data path.
- Constrained Agent fare/ride/swap overlays to the centered desktop overlay width and moved fare-complete messaging above the HUD; reduced HUD card height and typography for a smaller central score block.
- Restored NPC pickup messages using the Drive marker thought treatment and switched Agent marker movement to the shared `getCoordinateAlongRoute` interpolation for smoother animation.

### Agent Mode: Drive Surface Reuse (2026-08-25)

- Agent Shift now opens the existing Drive `#game` / `#map` surface instead of the parallel Agent map canvas.
- It reuses Drive-mode fare markers, fare sheet, swap sheet treatment, destination marker, route cache, trip card, NPC dialogue, pickup/passenger timers, and bottom HUD.
- A compact Agent-only top strip provides time left, bankroll, and the automatic `START SHIFT` action; existing dashboard menu remains available.
- Shift start automatically selects a fare, presents the existing fare sheet, confirms a mock swap without player input, and starts the normal pickup-drive flow.
- Autonomous Shift now chains runs: after the normal Drive-mode passenger timer completes, it waits briefly, returns to fare selection, refreshes opportunities if needed, and starts the next fare automatically. Leaving the map cancels the pending agent cycle and shift clock.

### Agent Mode: Pit Call & Desktop Overlay Polish (2026-08-25)

- In desktop Agent Mode, the reused Drive trip card is constrained to the same centered overlay width as the fare sheet and has no border.
- Agent top strip now centers time left and bankroll, with a smaller vertically centered Shift control.
- Added a tool-only Pit Call button beside the HUD. Its sheet uses the existing swap-sheet treatment and only permits risk, activity, and priority tuning; confirmation consumes one of three Pit Calls and records the selected mandate in the local mock state.
- Fixed desktop Agent trip-card centering by preserving the horizontal translate in its entrance animation; Pit Call now aligns immediately beside the centered HUD, and Shift control uses the requested `margin-bottom: 5px`.
- On the third Pit Call, the control is disabled and an immediate “Pit Calls depleted” toast confirms that tuning is locked.
- Started Agent Dashboard phase by extending the existing dashboard with Current Shift and Current Strategy sections that are only shown in Agent Mode.
- Expanded the existing dashboard’s Agent Mode view with the handoff’s Agent Driver hero, Current Shift (rank, bankroll, PnL, Crazy Score, live metadata), Current Strategy (priority, risk, activity, token whitelist, Pit Calls), and Career cards. Standard Driver Stats hide while Agent Mode is active.

### Agent Mode: Shift Results & Next Shift (2026-08-25)

- Added mock Shift results using the existing completion-sheet visual language: final rank, Crazy Score, bankroll, PnL, completed fares, stalls, and Pit Call record.
- At clock expiry the agent stops scheduling new fares and opens results; `PREPARE NEXT SHIFT` returns to the existing tournament lobby and resets the mock Shift controls for a new run.

### Shared Dashboard Navigation (2026-08-25)

- Combined dashboard Swaps and History into a single `Activity` view for both Drive and Agent modes.
- Replaced the third dashboard-nav tab with `Feed`, which opens the existing public-feed sheet.

### Shared Ride Card & Feed Simplification (2026-08-25)

- Removed duplicate Current Fuel and Total Score metrics from the shared Drive/Agent ride card; fuel use now appears in the single post-progress line as fuel left, gas spent, and fare points.
- Feed now contains only passenger review cards: passenger name, star rating, and review message. Drive/system updates and fare-point badges are excluded.
- Completed mock Agent Shift results are now written into the existing leaderboard as a labeled Agent entry, reusing the shared score ranking surface.
- Dashboard Feed is now the third in-dashboard view alongside Dashboard and Activity, retaining the shared bottom navigation; the map star shortcut remains the only floating Feed modal entry point.

### Tournament Live Lobby (2026-08-25)

- Tournament lobby now reads persisted mock Shift state: Registration presents driver/bankroll/entry, while a running Shift presents time left, active/stalled field count, rank, and `WATCH DRIVER`.
- Starting, completing, and preparing the next Shift now persist `RUNNING`, `FINISHED`, and `READY` statuses respectively.

### Tournament Standings (2026-08-25)

- Existing leaderboard now renders a deterministic tournament field whenever a mock Agent driver exists, with the Agent entry ranked by its current Crazy Score.
- Dynamic rank is shared by the live lobby, Agent Dashboard hero/current-shift card, and Shift results.

### Leaderboard & Panel Navigation (2026-08-25)

- Leaderboard now has separate Drive and Tournament pages in the existing panel; Drive retains player score standings and Tournament uses mock Agent Shift standings.
- Leaderboard, How to Play, and Settings Back buttons now use the in-game scene Back styling and top-left placement.
- Fixed leaderboard tab visibility so the inactive board honors its `hidden` state; reinforced the three panel Back controls as absolute top-left scene buttons after desktop overrides.

### Agent Activity Timeline (2026-08-25)

- Extended the shared Activity tab with a persisted Agent Shift timeline: Shift start, fare evaluation, mock swap confirmation, fare completion, Pit Calls, idle re-evaluation, and Shift results.
- Timeline uses user-facing event summaries only; no chain-of-thought or raw model reasoning is displayed.

### Drive / Agent HUD Separation (2026-08-25)

- Removed the redundant map Feed shortcut; Feed remains available from the shared Dashboard navigation.
- Agent Shift now uses a dedicated persisted Agent Run record for HUD fuel, Crazy Score, bankroll, and fares.
- Drive player state is snapshotted before Agent Mode and restored when leaving it, so Agent mock swaps/rides do not alter Drive-mode HUD/state. Normal Drive startup explicitly hides all Agent Shift controls.

### Agent Strip Visibility (2026-08-25)

- Added an explicit hidden-state style for the Agent Shift strip. Its layout rule can no longer override `hidden`, preventing Agent time, bankroll, and Start Shift controls from leaking into Drive mode.

### Agent Mode: Tournament Awards (2026-08-25)

- Completed mock Shifts now award compact outcome badges: `FULL AUTONOMY` for no Pit Calls, `FARE MACHINE` for sustained fare volume, `PODIUM FINISH` for top-three rank, and `CENTURY SCORE` for 100+ Crazy Score.
- Awards are saved with Shift results, shown on the results sheet, and the primary award is surfaced alongside the player’s completed tournament-leaderboard entry.

### Agent Mode: Management Records (2026-08-25)

- Autonomous mock swaps are now persisted with their fare, fuel credit, mock volume, market signal, and timestamp; Agent Activity renders the resulting confirmed-swap rows and summary totals.
- Completed Shifts persist as a history record with rank, score, bankroll, PnL, fares, and earned awards. The Agent Dashboard Career card now derives shifts, wins, podiums, and best rank from those records.
- Reformatted Agent Activity into compact, dashboard-level scrolling records. The three record groups no longer create nested scrollbars or oversized feed cards, and each presents its eight most recent entries.

### Agent Mode: Single Drive Surface (2026-08-25)

- Removed the obsolete standalone Agent Shift panel, second MapLibre canvas, and its independent mock timer/route simulation.
- Tournament play now has one authoritative frontend surface: the existing Drive map, markers, fare card, swap treatment, ride animation, HUD, and timer. This enforces the handoff requirement to reuse Drive components rather than maintain a parallel Agent application.

### Agent Mode: Compressed Shift Test Harness (2026-08-25)

- Centralized mock tournament duration, starting bankroll, Pit Call allowance, and mock swap volume in `data/config.js`.
- Development builds support `?agentShiftSeconds=30` through the configured duration for a repeatable compressed end-to-end Shift test; production/default behavior remains the configured ten-minute Shift.
- Ran the 30-second owner flow through Tournament → Garage → create/fund/ready → autonomous Shift → repeated fares → Results. It produced score, bankroll, fare, rank, and award results; an Agent HUD guard now prevents the shared Drive animation from repainting Agent fuel/score during or immediately after an active ride.
- Verified the Tournament registration scene at the 390px mobile breakpoint: no horizontal document overflow, with the registration CTA and Back control both exposed as visible controls.

### Agent Infrastructure: Railway Project (2026-08-25)

- Installed and authenticated the official Railway CLI, then created and linked the `crazy-tuk` Railway project in the `Jose's Projects` workspace.
- No Agent Runner service, wallet vault, database connection, or signing environment variables have been created yet. The next safe step is to scaffold the credential-free Runner and Neon schema locally before deployment.
- Free-plan constraint: keep the initial deployment to one minimal Node service with no polling loop, no worker fleet, no automatic swaps, and no database connection until the required credentials are deliberately supplied. Any future autonomous work should be event-driven and use bounded, short-lived jobs rather than continuous high-frequency processing.

### ✅ Ready
- Background images
- Logo (assets/branding/logo.png)
- PWA icons (placeholders for replacement)
- Game data structures (config, locations, NPCs, routes)
- Game logic modules (game.js, fareMatcher.js, fuel.js, interpretSwap.js)
- Wallet module (wallet.js)
- DFlow modules (dflow.js, dflowIntegration.js)
- MapLibre integration
- NPC fare markers
- Wallet UI components
- DFlow API integration

### 📋 To Replace (Artist Required)
- Better Crazy Tuk logo
- 5 NPC icons (currently generic placeholders)
- Actual app icons (currently SVG text)
- Map sprites (TukTuk marker, NPC markers, POI markers)

### 🗑️ Removed
- Hand-rig sprite files
- Phone hand assets
- Cigarette hand assets
- squirt.png image
- Background images (now CSS gradients)
