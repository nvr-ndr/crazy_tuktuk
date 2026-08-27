# Crazy TukTuk — Event-Driven Agent Runner Architecture Plan

**Status:** Approved — implementation in progress  
**Date:** 2026-08-27  
**Prerequisites:** `RAILWAY_AUDIT.md`, `CRAZY_TUK_DAILY_AGENT_MODE_IMPLEMENTATION.md`

## 1. Current architecture

The repository contains a static/Vercel frontend, Vercel functions for OSRM and the human DFlow order proxy, Neon persistence, and one on-demand Railway HTTP Runner. Railway is not currently a continuous autonomous worker: `agent-runner/server.mjs` exposes authentication, development Agent Run creation, quote persistence, Daily Shift state/events, zones, leaderboard, profile, ghost, and activity APIs. It has no scheduler, queue consumer, autonomous fare loop, or Agent transaction signer.

The frontend still owns the compatibility Agent simulation in `index.html`: localStorage state, browser timers, fare generation, fare selection, trip animation, mock bankroll/fuel, and results. Drive gameplay remains browser-local in `js/game.js`, `js/fareMatcher.js`, `js/fuel.js`, `data/player.js`, and `js/events.js`. Cached routes are primarily in `data/routeCacheSubset.js`; route metrics are in `data/routeMetrics.js`.

Current Agent Runner tables include `daily_shifts`, `agent_shift_states`, `daily_shift_events`, `daily_shift_results`, `zone_states`, legacy `tournaments`/`agent_runs`, Agents, swaps, Pit Calls, sessions, and activity. Existing Daily tables are a foundation, not yet a complete authoritative simulation.

## 2. Target architecture

Vercel serves the frontend and stateless server functions. Neon is the authoritative state machine. Each invocation claims a due Agent or an explicit user command, reads current state/world state, performs one bounded transition in a database transaction, appends an immutable event, and sets `next_action_at`. No invocation precomputes a shift or future fare decisions.

The browser reads authoritative snapshots and interpolates visuals from trip start/progress/duration. It never decides score, gas, fare ownership, event outcomes, route selection, shift timing, or final rank.

Railway remains temporarily available for compatibility and as a fallback scheduler/execution boundary. It is not removed during this plan.

## 3. Explicit Agent state machine

Authoritative per-shift states:

```text
READY_NEXT_SHIFT → ACTIVE
ACTIVE → EVALUATING_FARES
EVALUATING_FARES → ACTIVE                 (reject/wait)
EVALUATING_FARES → FARE_ACCEPTED
FARE_ACCEPTED → ROUTE_SELECTED
ROUTE_SELECTED → ON_TRIP
ON_TRIP → ON_TRIP                          (event/time advancement)
ON_TRIP → TRIP_COMPLETED → ACTIVE
ON_TRIP → STALLED
ON_TRIP → PARKED
ACTIVE → UNDERFUNDED
ACTIVE → SHIFT_COMPLETE
STALLED → SHIFT_COMPLETE
PARKED → SHIFT_COMPLETE
```

A conceptual `EVENT_PENDING` transition may be represented by `next_action_at` plus an unresolved-event record rather than a long-lived process. Only the transition function may change state. Clients may submit Pit Call commands, never arbitrary status writes.

## 4. Authoritative database model

Adapt the existing schema instead of duplicating it.

### Required tables/columns

- `daily_shifts`: UTC shift key, status, start/end, finalization metadata.
- `agent_shift_states`: Agent/shift status, bankroll reference, gas allocated/remaining, score, fares, Pit Calls, current zone, active trip ID, state version, `next_action_at`, lease/claim metadata.
- `agent_trips`: Agent, fare, origin/destination, selected route reference/geometry, route distance, `base_duration_seconds`, `trip_started_at`, progress, accumulated time/gas/score modifiers, resolved-event IDs, status, derived `projected_arrival`, `next_action_at`, version.
- `daily_fares`: server-owned fare opportunities, visibility/eligibility, passenger, pickup/destination, reward/economy data, expiry, claimed Agent, and locked surge value.
- `route_catalog`: versioned cached route subset or route object reference, primary/alternative metrics and geometry.
- `trip_events`: append-only immutable event records with idempotency key and effect payload.
- `agent_commands`: Pit Calls and future owner commands, target (`CURRENT_TRIP` or `NEXT_DECISION`), status, sequence, expiry, idempotency key.
- `zone_states`: shift/zone population, demand, supply, surge state, version and update time.
- `daily_shift_results`: immutable final snapshot and rank.
- `transition_attempts` or equivalent unique idempotency records for invocation/command claims.

All monetary values should use numeric/integer minor units, not floating-point. Add foreign keys, unique `(shift_id, agent_id)`, unique event/command idempotency keys, indexes on `(next_action_at, status)`, `(shift_id, zone_id)`, and active trip/status lookups.

## 5. Immutable event and transition model

Use an append-only event log without requiring full event sourcing. A transition transaction should:

1. claim/lock the Agent state;
2. verify expected state and version;
3. verify idempotency key is not already applied;
4. calculate effects from current rows and versioned rules;
5. insert the immutable event/effect record;
6. update state and increment version;
7. set `next_action_at` and clear/replace active work;
8. commit.

Events include `SHIFT_STARTED`, `FARE_REJECTED`, `FARE_ACCEPTED`, `ROUTE_SELECTED`, `TRIP_STARTED`, `TRIP_ADVANCED`, `CRAZY_EVENT_TRIGGERED`, `CRAZY_EVENT_RESOLVED`, `PIT_CALL_ISSUED`, `PIT_CALL_CONSUMED`, `TRIP_COMPLETED`, `AGENT_STALLED`, `AGENT_PARKED`, `SHIFT_FINALIZED`, and financial quote/submit/confirm/reconcile events. Store rule version, inputs, effects, actor, and transition ID for debugging.

## 6. Fare authority migration

Move fare generation and eligibility from localStorage/`js/game.js` to server modules. Fare generation must be deterministic from a persisted shift/world seed plus current state, but candidates should be generated or refreshed only when the Agent observes—not for the whole shift.

The decision function reads current fares, expiry, zone state, gas, rank, strategy, Pit Calls, bankroll, and current time. It can reject all fares and set a cooldown. Acceptance locks one fare to one Agent and records `FARE_ACCEPTED`; duplicate claims fail by unique constraint/row lock. Fare completion is accepted only for the active trip and valid transition version.

## 7. Route packaging and authoritative route decisions

Extract route logic from `data/routeMetrics.js` into a pure server-compatible module. Package a versioned, server-readable copy of the generated `data/routeCacheSubset.js` data in a future server module or shared package; do not rely on the browser copy for authority.

On acceptance, the server reads primary and alternative cached metrics, evaluates the current Agent strategy/economy, writes `ROUTE_SELECTED`, and stores the exact route version, variant, distance, geometry/reference, and reason. If only one route exists, select primary explicitly. No live routing request is required for gameplay.

## 8. Dynamic trip timing

Never persist `expected_arrival` as immutable truth. Persist:

- trip/fare/Agent IDs;
- origin, destination, selected route and route version;
- distance and base duration;
- trip start and last advancement timestamps;
- authoritative progress;
- accumulated time, gas, and score modifiers;
- resolved event IDs and unresolved event/transition state;
- projected arrival as derived/cache data;
- status, version, and `next_action_at`.

An advancement transition computes elapsed simulation time from server timestamps, applies only events due at that point, updates progress and modifiers, and derives projected arrival. A Crazy Event can change duration or gas after departure; the next projection is calculated from the updated model. The frontend interpolates between the last authoritative snapshot and the current projected state.

## 9. Crazy Events

Extract event definitions/effects from `data/events.js` into a server-safe catalog with versioned effect schemas. Do not pre-roll an entire shift. At trip start, persist only the event schedule/seed boundary needed for the next unresolved event. When `next_action_at` is reached, one transition claims the trip, selects the event from current state, resolves it once, appends immutable trigger/resolution records, applies time/gas/score effects, and schedules the next transition.

Event outcome randomness must be stored with the event seed/outcome. Client art and copy may remain static Vercel assets. The server owns outcome and effects; the browser only displays them.

## 10. Gas, stalls, and parking

Gas allocation is created once per Agent/shift. Every authoritative movement transition computes actual route gas from cached distance and applies modifiers atomically. Gas cannot become negative. If a trip cannot continue, the server chooses/records `PARKED` or `STALLED` according to configured strategy/rules; it does not allow the browser to refuel an active Daily Shift.

`STALLED` ends the current shift’s active competition and preserves career state. `PARKED` is an intentional stop and may retain placement. Gas, stall, park, and penalty effects are immutable events. Existing human Drive refuel/rescue mechanics remain separate.

## 11. Pit Calls

Pit Call submission becomes `POST /api/agent/commands` with an owner-authenticated session, shift ID, target, instruction, and idempotency key. In a transaction, validate ownership, active shift, command type, remaining allowance, and command freshness; insert a unique command and decrement the authoritative allowance exactly once.

Commands targeting `CURRENT_TRIP` are consumed at the next safe trip transition (or immediately only for explicitly safe effects). `NEXT_DECISION` commands remain pending until the Agent reaches `EVALUATING_FARES`/`ACTIVE`. Stale commands expire with an event and do not refund unless the product rule explicitly says so. The decision function consumes pending commands before autonomous logic and records `PIT_CALL_CONSUMED`.

## 12. Zones and shared economy

Zone ticks should be transition inputs, not client authority. A bounded worker aggregates active Agent locations/trips, computes demand/supply, and updates one zone row per transaction/version. Fare generation reads the current zone state. A surge value is locked into an accepted fare; later normalization/oversupply affects future fares, not an accepted fare retroactively.

Initially allow at most one primary surge zone. Zone state changes and reasons are logged. The Agent should receive current zone conditions at each actual decision boundary.

## 13. Frontend live visualization

Add server snapshot APIs for Agent state, active trip, events, leaderboard, zones, and ghosts. The browser may poll on view entry/visibility and use optimistic presentation only for animation. It must not submit score/gas/time as authoritative effects.

For a trip snapshot, interpolate route position from geometry, `trip_started_at`, progress, base duration, accumulated modifiers, and current server time. When a new snapshot changes projected duration, blend the visual timeline to the new projection. Do not write per-frame or per-second positions to Neon.

## 14. `next_action_at` and wake architecture

Every unresolved Agent/trip state has a server-derived `next_action_at`. Typical values are next fare observation, pickup completion, event resolution, passenger-leg completion, Pit Call boundary, stall check, or shift cutoff.

The preferred wake design is a bounded batch endpoint/function:

```text
scheduled wake
→ claim up to N due states
→ advance one transition per claimed state
→ commit and release
→ return remaining due count
```

Use Vercel Cron as the first candidate scheduler if its plan/limits meet required frequency and duration. Keep Railway as temporary fallback. Browser-triggered advancement is an opportunistic secondary path only. If Cron is insufficient, adopt an external scheduler/queue; Neon alone cannot wake code.

## 15. Atomic claims and idempotency

Use Postgres transactions and row locks or optimistic versions. A claim should atomically select due rows with `FOR UPDATE SKIP LOCKED`, set a short lease/claim token, and return the transition version. A transition updates only `WHERE id = ? AND version = ? AND lease_token = ?`.

Every invocation, command, fare claim, event resolution, score award, gas consumption, swap attempt, and finalization gets an idempotency key. Unique constraints make retries safe. A timeout after a DFlow submission must enter `SUBMITTED/UNKNOWN` reconciliation, not retry blindly.

## 16. Failure, recovery, and reconciliation

Add structured transition logs and a reconciler for leased/stuck states. Retry database failures with bounded backoff. If event insertion succeeds but state update fails, a transaction prevents partial application. If a server crashes after an external transaction is submitted, reconcile by DFlow request ID/signature before retrying. Finalization is immutable and payout failure cannot alter rank.

Test stale leases, duplicate requests, two browsers, Vercel retries, function timeout, Neon transient failure, DFlow timeout/unknown, route missing, event mutation, shift cutoff, and replay/rebuild from event history.

## 17. DFlow and wallet boundary

During migration, preserve quote-only/mock Agent behavior. Human Drive signing remains browser-wallet based. Do not migrate Agent custody in this plan.

Create a separate future workstream to verify DFlow Agent wallet creation, vault format, encryption, decryption boundary, Vercel runtime compatibility, signing, key rotation, backups, compromise response, and transaction reconciliation. No private key may reach the browser. If server-side signing requires a dedicated KMS/custody service, classify that dependency as external rather than forcing secrets into Vercel environment variables.

## 18. Vercel/API structure

Likely future files:

- `api/agent/shift.js` — snapshot/current state
- `api/agent/advance.js` — bounded claimed transition
- `api/agent/commands.js` — Pit Calls
- `api/agent/leaderboard.js`
- `api/agent/ghosts.js`
- `api/agent/zones.js`
- `api/cron/agent-wake.js` — scheduler entry, protected by secret
- `api/_lib/db.js`, `api/_lib/auth.js`, `api/_lib/transition.js`
- `api/_lib/agentRules.js`, `api/_lib/routes.js`, `api/_lib/events.js`

Existing `api/route.js` and `api/dflow/order.js` remain intact. Avoid importing browser modules that depend on `window`/localStorage into Functions.

## 19. Responsibilities

### Vercel

Stateless HTTP functions, auth verification, bounded transitions, fare/route/event/game rules, DFlow quote calls, read APIs, and eventually protected wake entry.

### Neon

All authoritative Agent, fare, trip, route, gas, zone, event, command, score, shift, leaderboard, and reconciliation state.

### Railway during migration

Existing Runner compatibility endpoints, quote-only fallback, optional wake/scheduler fallback, and shadow comparison. Do not duplicate authoritative writes without explicit shadow isolation.

## 20. Security boundaries

- Verify wallet signatures server-side and bind sessions to Agent owner.
- Never trust browser score, gas, rank, route outcome, event outcome, or timestamps.
- Restrict cron endpoint with a secret and rate limit it.
- Validate route/fare IDs against Neon/server catalog.
- Keep DFlow keys and future signer material server-side.
- Redact private data from leaderboard/ghost endpoints.
- Use short-lived sessions, hashed tokens, origin checks, and request size limits.
- Audit all financial and state transitions.

## 21. Implementation phases

### Phase A — Architecture checkpoint

**Objective:** Approve this target and scheduler choice before implementation.

**Files:** `RAILWAY_AUDIT.md`, this plan, `PROJECT_STATE.md`.  
**Database:** none.  
**Backend/frontend:** none.  
**Invariants:** Railway remains; Phase 11 remains paused.  
**Steps:** confirm hybrid staging, define Cron/external scheduler limits, define transition vocabulary.  
**Tests:** review checklist and threat model.  
**Done:** written architecture decision and rollback owner.  
**Rollback:** reject plan; current Runner remains unchanged.

**Status:** COMPLETE (2026-08-27). The Railway audit is complete, hybrid staging is the approved decision, Railway remains available, and Phase 11 remains paused.

### Phase B — Shared rule extraction and route package

**Objective:** Make route, fare-economy, gas, and event rules server-importable without changing Drive behavior.

**Files:** create `api/_lib/`; extract from `data/routeMetrics.js`, `data/routeCacheSubset.js`, `data/events.js`; preserve existing imports.  
**Database:** add route catalog version metadata if needed.  
**Backend:** pure functions only.  
**Frontend:** no behavior change.  
**Invariants:** Drive tests and cached route outputs remain identical.  
**Tests:** golden route metrics, alternative selection, event effect fixtures, fare economy fixtures.  
**Done:** Vercel-compatible modules run without browser globals.  
**Rollback:** keep old imports and remove new modules.

**Status:** COMPLETE (2026-08-27). Browser-free route, fare, gas, and event helpers and golden tests pass; Drive imports remain unchanged.

### Phase C — Transaction/idempotency primitives

**Objective:** Make one state transition atomic and retry-safe.

**Files:** create `api/_lib/db.js`, `transition.js`; update schema/migration.  
**Database:** versions, leases, transition IDs, event keys, `next_action_at`, indexes.  
**Backend:** claim/lock/commit helpers.  
**Frontend:** none.  
**Tests:** duplicate claim, concurrent claim, rollback after injected failure, stale version/lease.  
**Done:** no duplicate transition can commit.  
**Rollback:** disable new endpoints; additive schema remains unused.

**Status:** COMPLETE (2026-08-27). Transaction, claim, lease, idempotency helpers, additive schema primitives, and tests pass. Endpoint adoption is performed with the authoritative transition model in Phase D.

### Phase D — Authoritative Agent/fare/trip model

**Objective:** Move one Agent’s unresolved state and one trip into Neon without pre-simulation.

**Files:** new tables/modules; compatibility changes to Runner only after tests.  
**Database:** `daily_fares`, `agent_trips`, route catalog, trip events.  
**Backend:** observe, accept, route-select, start-trip, advance, complete/stall/park.  
**Frontend:** read snapshots; retain Drive mode and mock fallback.  
**Invariants:** one active fare/trip; projected arrival is derived.  
**Tests:** concurrent fare claim, route persistence, dynamic duration, cutoff, gas exhaustion, replay.  
**Done:** a complete unresolved trip survives browser closure and advances via an API call.

**Status:** PHASE E PASS (2026-08-27). Phase E live acceptance is 4/4 and shared Phase B–D/Event regression is 20/20. Authoritative Crazy Events, Pit Calls, zones, economy locking, current-world decisions, and integrated fresh-context Neon behavior are verified. Phase F has not started.

### Phase E — Crazy Events, Pit Calls, and zones

**Objective:** Make all live strategic inputs authoritative.

**Files:** `api/_lib/events.js`, commands/zones functions, schema.  
**Database:** event outcomes, commands, zone versions.  
**Backend:** event resolution, command consumption, zone tick.  
**Frontend:** display authoritative events/commands/zones; no outcome calculation.  
**Tests:** event once-only resolution, Pit Call duplicate/stale handling, zone surge/oversupply.  
**Done:** each input can change a future decision without precomputing it.

### Phase F — Bounded wake/scheduler

**Objective:** Advance due Agents without a browser.

**Files:** `api/cron/agent-wake.js`, scheduler config, optional Railway adapter.  
**Database:** due indexes, lease recovery.  
**Backend:** bounded batch claims and metrics.  
**Frontend:** polling only for display.  
**Invariants:** no permanent Agent process; no duplicate claims.  
**Tests:** unattended progress, batch limits, timeout/retry, stale lease, two concurrent wakes.  
**Done:** Agents progress while all browsers are closed.

### Phase G — Shadow migration and frontend cutover

**Objective:** Compare new transitions with compatibility Runner and cut Agent reads/writes over.

**Files:** frontend Agent API adapter; Runner compatibility/shadow routes.  
**Database:** shadow events isolated from authoritative records.  
**Backend:** metrics and reconciliation.  
**Frontend:** localStorage becomes cache/presentation only. Drive remains unchanged.  
**Tests:** two owners, five Agents, restart, stale clients, scoring parity, route/event parity.  
**Done:** shadow results stable and rollback switch exercised.

### Phase H — Wallet custody and real execution decision

**Objective:** Separately verify whether Vercel can safely support Agent signing.

**Files:** future custody module/documentation only after external DFlow verification.  
**Database:** encrypted references/transaction reconciliation if approved.  
**Backend:** quote-only until custody is proven.  
**Tests:** no-key-leak, signing timeout, duplicate submission, reconciliation, rotation/recovery.  
**Done:** explicit custody approval or selected external signer.  
**Rollback:** remain quote-only/mock.

### Phase I — Removal gate

**Objective:** Remove Railway only after all responsibilities are proven elsewhere.

**Files:** remove `AGENT_RUNNER_URL` only after cutover; preserve archive docs.  
**Tests:** full production-like recovery and rollback drill.  
**Done:** exit criteria below satisfied.  
**Rollback:** restore Railway URL and compatibility endpoints.

## 22. Testing matrix

Every phase must include unit tests for pure rules, integration tests against Neon, and failure injection. Required scenarios include two owners in one shift, five-plus Agents, browser closure, concurrent wakeups, duplicate fare/event/score/gas/Pit Call/finalization requests, Railway restart, Vercel timeout, Neon failure, route missing/one route, dynamic Crazy Event duration, low gas, stall/park, shift cutoff, stale frontend, DFlow unknown status, and immutable leaderboard results.

## 23. Rollback strategy

Use additive schema migrations and feature flags. Keep the current Railway URL and quote endpoints during shadowing. Cut over read APIs before writes only when snapshots match. Maintain a kill switch returning the frontend to compatibility mode. Never delete old tables or secrets during migration. Disable new scheduler writes before reverting code. Restore the previous Vercel deployment and Railway URL if transition error rates, state divergence, or recovery tests fail.

## 24. Railway removal exit criteria

Railway may be deleted only when all are true:

1. Every required Runner API has a tested Vercel replacement.
2. The frontend has no production reference to `AGENT_RUNNER_URL`.
3. Neon is authoritative for Agent, fare, trip, route, event, gas, zone, Pit Call, score, and results state.
4. Vercel/external scheduling advances due Agents with browsers closed.
5. Atomic claim and duplicate/retry tests pass under concurrent invocation.
6. DFlow unknown/timeout reconciliation is proven, or Agent execution remains explicitly quote-only.
7. Agent custody/signing is independently approved, or no server-side signing is enabled.
8. Shadow testing and a production rollback drill pass.
9. Monitoring, alerting, migration backups, and a rollback deployment exist.

**Earliest safe deletion point:** after Phase I, not before Phase G/F. In particular, do not delete Railway merely because Vercel endpoints exist; unattended wakeups and recovery must be demonstrated first.

## 25. Phase 11 resume point

Do not begin Crazy Score Rebalance until Phase F is complete and Phase G shadow/cutover tests show genuinely unresolved Agent gameplay. Preserve configurable score inputs throughout. Phase 11 then audits and tunes fares, route distance/time, Crazy Events, gas, stalls, parks, passenger effects, and DFlow-related inputs against real event-driven simulations.

## 26. File plan

Expected new files: `api/_lib/db.js`, `auth.js`, `transition.js`, `agentRules.js`, `routes.js`, `events.js`, `trip.js`, `idempotency.js`, `api/agent/*.js`, `api/cron/agent-wake.js`, migration files, and tests. Expected modifications: `agent-runner/db/schema.sql`, `agent-runner/migrate.mjs`, `api/route.js` only if shared helpers are needed, `index.html` Agent API adapter, `data/config.js`, and `PROJECT_STATE.md`. Expected eventual deletion: only compatibility Runner code, old local Agent authority, and `AGENT_RUNNER_URL` references after the removal gate. Do not delete Drive modules, cached route assets, human DFlow signing, or tournament archive documentation.

## 27. Infrastructure decision by stage

```text
Stage 1 — audit/plan:       Vercel + Railway + Neon
Stage 2 — shared extraction: Vercel + Railway + Neon
Stage 3 — state transitions: Vercel + Railway fallback + Neon
Stage 4 — scheduler shadow:  Vercel + Railway scheduler/fallback + Neon
Stage 5 — production cutover: Vercel + Neon, Railway retained for rollback
Final target:                Vercel + Neon, with Cron/external wake capability
```

The earliest safe point to delete Railway is after production-like shadow testing, unattended wake-up proof, atomic/retry/reconciliation tests, and a rollback drill. Until then, hybrid is the recommended architecture.
