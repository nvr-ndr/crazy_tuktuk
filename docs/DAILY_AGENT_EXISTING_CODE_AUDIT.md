# Daily Agent Existing Code Audit

**Date:** 2026-08-27  
**Phase:** 0 — Codebase audit / no behavior change

## Summary

The repository contains a working Agent-mode demonstration layered into the single Drive map surface. Visual reuse and cached-route integration are in place, but the active implementation is still a browser-owned, ten-minute Tournament mock. It is not yet a server-authoritative recurring Daily Shift.

No application behavior was changed during this audit.

## Existing implementation

### UI and navigation

- Title entry: `index.html:3497`, `#titleTournament`, labeled `TOURNAMENT`.
- Panel markup: `index.html:3826-3839`, including `TOURNAMENT MODE`, `BANGKOK SHIFT #0042`, a fake `STARTS IN` countdown, registration copy, and `ENTER TOURNAMENT`.
- Panel wiring: `index.html:5334-5349`; the entry opens the tournament panel and then the Agent Garage.
- Lobby renderer: `index.html:5358-5385`; it switches between registration and live copy using local mock state.
- Agent HUD: `index.html:3608`, `#agentStartShift`, still exposes `START SHIFT` in the normal Agent surface.
- Leaderboard: `index.html:3797` exposes a `TOURNAMENT` tab; `renderTournamentLeaderboard` near `index.html:4925` uses local deterministic rivals and local Agent score.
- Results/dashboard/history markup: `index.html:3674+` and `index.html:3728+`; these are reusable Agent surfaces.

The map, fare sheets, trip card, route animation, HUD, activity, and dashboard are shared with Drive mode, matching the handoff’s reuse requirement.

### Agent state and autonomous loop

- `getTournamentConfig`: `index.html:5040-5050`; reads `TOURNAMENT_*` constants.
- `getAgentShiftDuration`: `index.html:5147-5150`; permits the development `agentShiftSeconds` query override.
- Local keys: `MOCK_AGENT_KEY`, `AGENT_RUN_KEY`, `AGENT_SHIFT_HISTORY_KEY`, and swap/activity keys around `index.html:4799-5050`.
- Shift start: `startAutonomousDriveShift` at `index.html:5293+`; initializes fuel, score, bankroll, fares, Pit Calls, and a browser interval.
- Browser economics: `index.html:5311-5325`; bankroll and dashboard values advance from elapsed browser time.
- Fare loop: `runAutonomousFareCycle` at `index.html:5220+`; selects a local fare, chooses a cached route, optionally requests a quote, then locally credits fuel and completes the fare.
- Finalization: `finishAgentShift` at `index.html:5183+`; writes results/history to localStorage and marks the mock state `FINISHED`.
- Next shift: `agentResultsNext` handler near `index.html:5479`; resets local state to `READY`.

Closing the browser stops the autonomous loop. Shift timing, score, fare completion, fuel, bankroll simulation, and finalization are not server-authoritative.

### Wallet, funding, and Runner authentication

- Human wallet connection/signing: `js/wallet.js`.
- Runner authentication: `authenticateAgentRunner` around `index.html:5060+`, using `/v1/auth/challenge` and `/v1/auth/verify`.
- Runner registration: `ensureAgentRunnerRun` around `index.html:5055+`, calling `POST /v1/dev/agent-runs`.
- Garage creation/funding: `index.html:5410-5441`; driver archetype, strategy, creation, and funding are represented in localStorage. No real DFlow agent wallet is created or funded by this flow.

### Backend and autonomous execution

- Runner entry: `agent-runner/server.mjs`.
- Development run route: `POST /v1/dev/agent-runs`, `server.mjs:140-177`; creates/upserts a fixed development tournament and an `agent_runs` row with a ten-minute end time.
- Quote route: `POST /v1/agent-runs/:agentRunId/quotes`, `server.mjs:212+`; authenticates ownership, applies DFlow guardrails, persists a `QUOTED` swap, and records `QUOTE_RECEIVED`.
- History route: `GET /v1/agent-runs/:agentRunId/history`, `server.mjs:272+`.
- Status route: `GET /v1/status`, `server.mjs:333+`; reports the latest tournament and grouped run counts.
- No scheduler, worker, eligibility scan, fare-decision worker, shift cutoff/finalization worker, or persistent autonomous execution loop exists in the repository.

### Database source of truth

`agent-runner/db/schema.sql` defines:

- `tournaments`, lines 1-11, with tournament lifecycle and timestamps.
- `agents`, lines 13-21, one Agent per owner wallet.
- `agent_runs`, lines 23-38, linked to a tournament with status, bankroll, score, fares, Pit Calls, and strategy.
- `agent_swaps`, lines 40-58, including quote/execution and platform-fee audit fields.
- `pit_calls`, `agent_events`, `public_activity`, `auth_challenges`, and `agent_sessions`, lines 60+.

Missing Daily Agent concepts include global daily shifts, per-shift state, immutable results, career stats, gas allocation/consumption, parked state, zone state, fare attempts/route decisions, prize accounting, and idempotency keys.

### Scoring, gas, events, ratings, and Pit Calls

- Shared fare point calculation: `data/routeMetrics.js:90-105`; uses route distance/duration, fuel pressure, and route-variant bonuses.
- Drive score award: `js/game.js:560+`.
- Agent score award: `runAutonomousFareCycle` adds `fare.pointValue` after completion; it does not yet use a server-side Daily Agent score breakdown.
- Crazy Event definitions: `data/events.js`; Drive scheduling/application: `js/events.js` and `js/game.js`.
- Drive fuel/stall logic: `data/config.js:4-13`, `js/fuel.js`, `data/player.js`, and `js/game.js:500+`.
- Agent fuel is separately initialized at `index.html:5300` and then simplified locally credited/deducted.
- Agent Pit Call UI is around `index.html:5445+`; changes are local and not persisted to the Runner during the active flow.
- Passenger mood/rating exists in the Drive trip/fare path, but Agent completion does not yet persist/use a Daily Agent rating result.
- Agent activity, swaps, and shift history are localStorage-backed around `index.html:4808-4860`.

The exact Crazy Score audit requested by the specification remains a prerequisite for Phase 11. This audit identifies locations but does not rebalance scoring.

### Cached routes

- Route cache: `data/routeCacheSubset.js`.
- Route metrics: `data/routeMetrics.js`.
- Drive import: `js/game.js:8`.
- Page import: `index.html:1763`.
- Drive route-cache keys/resolution: `index.html:4210-4220`.
- Agent selection: `chooseAgentRouteVariant`, `index.html:5164+`; compares cached primary/alternative distance and duration and updates the fare variant.

The recent cached-route work is reusable. A future server-side Agent engine needs server-readable equivalents so fuel and route decisions remain deterministic without live routing APIs or browser state.

### Developer controls and external infrastructure

- `CONFIG.DEV_MODE` is `true`: `data/config.js:30`.
- Development fuel controls are conditionally exposed in `index.html` near Agent initialization.
- `agentShiftSeconds` is a development-only query override.
- No `TOURNAMENT_MODE_ENABLED` feature flag or unified Developer Controls panel exists.
- Railway Runner URL: `data/config.js:46`.
- Neon migration/schema: `agent-runner/migrate.mjs` and `agent-runner/db/schema.sql`.
- DFlow quote/fee integration: `agent-runner/dflow.mjs` and `server.mjs:212+`.
- Current Agent behavior is quote-only with mock gameplay fallback; real autonomous signing/execution and payout settlement are not active.

## Phase 0 conclusion

Phase 0 is complete. Phase 1 should archive Tournament-specific behavior, add a feature gate if needed, and remove Tournament-specific navigation from the production Agent flow without deleting reusable Agent/Drive systems. Before Phase 3, backend ownership must move from browser-local timers/state to global Daily Shift persistence and workers.
