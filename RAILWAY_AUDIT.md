# Crazy TukTuk Railway / Agent Infrastructure Audit

**Date:** 2026-08-27  
**Scope:** Repository-only audit. No code, infrastructure, environment variables, or wallet custody was changed.

## Executive conclusion

The repository does not currently contain a continuously running autonomous Agent worker. Railway hosts one small on-demand HTTP Runner that authenticates wallets, stores Agent/quote records in Neon, and requests development DFlow quotes. The actual Drive swap execution path is a Vercel same-origin API plus browser wallet signing.

The proposed Vercel Functions + Neon architecture is viable for the current repository, but not by directly moving the existing Runner. The event-driven state-machine design is the correct target: Neon stores unresolved state and `next_action_at`; a server function atomically advances one transition per invocation. Reliable wake-up for agents without an open browser remains unresolved and requires an external scheduler/queue/cron capability unless Vercel Cron is accepted as the wake source.

**Recommendation: use a hybrid architecture initially.** Move stateless authenticated APIs and transition handlers to Vercel Functions, retain Railway temporarily for scheduled wakeups or as a fallback execution boundary, and only remove Railway after wake-up, transaction signing, and recovery tests pass. A Vercel-only target is plausible, but the repository does not yet prove reliable scheduled execution or secure server-side Agent wallet custody on Vercel.

## Railway inventory

### Services

Repository evidence identifies one Railway service: the `agent-runner` Node service built from `agent-runner/Dockerfile`. The Docker image copies `server.mjs`, `dflow.mjs`, `migrate.mjs`, `db/schema.sql`, and `package.json`, installs dependencies, and starts `node server.mjs`.

No second Worker, cron process, queue consumer, or repository-defined Railway service was found.

### Railway-hosted endpoints

The Runner HTTP endpoints in `agent-runner/server.mjs` are:

- `POST /v1/auth/challenge`
- `POST /v1/auth/verify`
- `POST /v1/dev/agent-runs`
- `GET /v1/daily-shift`
- `POST /v1/daily-shift/events`
- `POST /v1/daily-shift/route-decision`
- `POST /v1/daily-shift/zones/tick`
- `GET /v1/daily-shift/zones`
- `GET /v1/daily-shift/leaderboard`
- `GET /v1/daily-shift/ghosts`
- `GET /v1/agents/:agentId/profile`
- `POST /v1/activity`
- `GET /v1/activity`
- `POST /v1/agent-runs/:agentRunId/quotes`
- `GET /v1/agent-runs/:agentRunId/history`
- `GET /health`
- `GET /ready`
- `GET /v1/status`

The frontend references the Railway URL through `data/config.js:47` (`AGENT_RUNNER_URL`) and calls it directly from `index.html` for authentication, Agent Run registration, quotes, Daily Shift state, and zone state.

## Environment variables

### Directly read by the Runner

| Variable | Location/use | Classification |
|---|---|---|
| `PORT` | HTTP listener | A |
| `DATABASE_URL` | Neon connection and readiness requirement | A, secret handling required |
| `RUNNER_ALLOWED_ORIGINS` | CORS allowlist | A |
| `DAILY_AGENT_GAS_ALLOCATION` | Default server gas allocation | A |
| `DFLOW_BINARY` | DFlow CLI command path | B; CLI-specific |
| `DFLOW_TRADE_API_URL` | DFlow trade/quote URL | A/B depending execution design |
| `DFLOW_API_KEY` | DFlow request header | A, secret handling required |
| `DFLOW_ALLOWED_TOKENS` | Quote guardrail | A |
| `DFLOW_MAX_TRADE_USD` | Quote guardrail | A |
| `DFLOW_MAX_DAILY_VOLUME_USD` | Quote guardrail | A |
| `DFLOW_MAX_WALLET_VALUE_USD` | Quote guardrail | A |
| `DFLOW_PLATFORM_FEE_BPS` | Fee configuration | A |
| `DFLOW_PLATFORM_FEE_MODE` | Input/output fee denomination | A |
| `DFLOW_PLATFORM_FEE_ACCOUNT` | Fee recipient | A, secret/config handling required |
| `DFLOW_PASSPHRASE` | Checked by trading configuration | B; custody migration unresolved |
| `DFLOW_VERIFY_SIGNATURES` | Readiness reporting | A |

`agent-runner/Dockerfile` also sets image defaults `DFLOW_AGENT=crazy-tuk` and `DFLOW_VERIFY_SIGNATURES=1`. `api/dflow/order.js` independently reads `DFLOW_ORDER_URL` and `DFLOW_API_KEY` for the Vercel DFlow order proxy. `DFLOW_ORDER_URL` defaults to the development DFlow endpoint.

## Process, timers, and in-memory state

- `server.mjs` runs one HTTP server and creates a new `pg.Client` per database request.
- There is no `setInterval`, polling loop, queue consumer, cron handler, or autonomous Agent process in `agent-runner/server.mjs`.
- `dflow.mjs` uses a request timeout via `setTimeout`/`AbortSignal.timeout`; this is request-scoped, not a worker loop.
- In-memory state includes `nextDevelopmentRunAt`, a one-second development rate limit, plus request-local objects and authentication data.
- The browser owns the current compatibility Shift timer and fare loop in `index.html` (`setInterval` in `startAutonomousDriveShift`, `setTimeout` in `runAutonomousFareCycle`). Closing the browser stops that mock loop.
- Vercel's `api/route.js` is a stateless cached OSRM proxy. `api/dflow/order.js` is a stateless DFlow proxy.

## Agent Runner implementation

The Runner currently provides authentication, development Agent Run creation, DFlow quote validation/persistence, Daily Shift state/event endpoints, leaderboard/profile reads, zone state, ghost metadata, and idempotency tables. It does not select fares, execute trips, resolve Crazy Events, consume route time, sign Agent transactions, or wake itself for future decisions.

The current development route still creates a compatibility `tournaments` row and `agent_runs` row. Daily state is stored in `daily_shifts`, `agent_shift_states`, `daily_shift_events`, `daily_shift_results`, and `zone_states`.

## Gameplay and state audit

### Fare generation/evaluation

Fare generation and eligibility are browser-local in `js/game.js` and `js/fareMatcher.js`, with fare data persisted in localStorage. Agent selection is `runAutonomousFareCycle` in `index.html`; it finds a local fare and calls `game.selectFare`.

Classification: **B**. It must become an atomic server transition against current fare/state/world data. Do not pre-select a full shift.

### Route state

Cached routes are in `data/routeCacheSubset.js`; metrics are in `data/routeMetrics.js`. Drive and Agent use them in the browser. The Runner has only a deterministic route-decision contract accepting route metrics; it does not contain the generated route payload.

Classification: **B** for packaging and authoritative trip state; **A** for the pure comparison function once route data is available to the function.

### Gas, stall, park, and zones

Drive gas/stall logic is in `data/player.js`, `js/fuel.js`, and `js/game.js`, persisted locally. Daily server tables support gas, `STALLED`, `PARKED`, and zone states. Event endpoints can apply deltas, but no worker currently decides when to emit them.

Classification: **B**. Transition logic needs atomic compare/update and must never trust browser-supplied score, gas, or timing values.

### Crazy Events

Events are defined in `data/events.js` and resolved through `js/events.js`/`js/game.js`. There is no corresponding Runner event catalog or server-side resolution path. Event assets are frontend files; gameplay effects are currently browser state mutations.

Classification: **B** for authoritative resolution; assets remain **A** on Vercel.

### Polling/realtime

There is no WebSocket/SSE implementation. The Agent frontend makes direct request-based reads to Runner endpoints; the mock animation uses browser timers. There is no reliable wake-up path when no browser is connected.

Classification: **C** for unattended execution unless Vercel Cron, an external scheduler, or a queue service is adopted. Neon alone does not wake code.

## DFlow and Solana audit

### DFlow calls

- Human Drive order proxy: `api/dflow/order.js` forwards browser requests to DFlow.
- Human client: `js/dflow.js` calls `/api/dflow/order`; `js/dflowIntegration.js` handles the order and flow.
- Agent quote path: `agent-runner/dflow.mjs` calls DFlow development/trade endpoints server-side and persists quote data through `server.mjs`.
- Current Agent integration is quote-only; the frontend explicitly records “no funds moved” and falls back to mock gameplay.

### Transaction construction/signing

Human transaction signing occurs in the browser through `js/wallet.js` and `js/dflowIntegration.js:104-106`, followed by client confirmation. The Runner does not currently construct or sign a Solana transaction in the repository. No Agent execution endpoint was found.

Classification: human flow **A** to Vercel Functions plus browser wallet; autonomous Agent signing **B/C** because custody and signer runtime must be designed first.

### Agent wallet creation and private keys

No repository code generates an Agent private key or creates a DFlow Agent wallet. The Runner creates an `agents` row with `dflow_wallet_name` and `wallet_public_key`; development registration uses the connected owner wallet as `wallet_public_key`. This is metadata, not proof of a dedicated funded Agent wallet.

No private-key material is sent to the browser by the repository code. The Runner reads `DFLOW_PASSPHRASE` only indirectly through `tradingConfiguration`; no decryption or signing call is implemented in `server.mjs`. The Docker image has no explicit wallet-volume declaration, though deployment history in `PROJECT_STATE.md` records a Railway volume mounted at `/root`.

Classification: **D/B**. Do not migrate custody until the actual DFlow CLI vault format, key encryption, decrypt boundary, signer process, backup/recovery, and rotation policy are verified.

## Neon, filesystem, and recovery

- Neon is accessed through `pg.Client` in `agent-runner/server.mjs` and `migrate.mjs`; connections are opened per request and closed in `finally`.
- Schema is `agent-runner/db/schema.sql`; migration execution is `agent-runner/migrate.mjs`.
- Persistent tables now include Daily Shift state, events, immutable results, zones, Agent records, swaps, sessions, and activity.
- Browser gameplay still depends heavily on localStorage/sessionStorage for fares, player state, swaps, Agent mock state, shift history, and Agent session cache.
- Runner idempotency exists for development run rate limiting, unique shift keys, unique shift state, event idempotency keys, and result uniqueness. Multi-statement updates are not wrapped in a database transaction, so partial failure between event insertion and state update remains possible.
- No retry worker, dead-letter queue, advisory-lock protocol, or recovery reconciler exists.
- Frontend route cache and event art are static repository assets suitable for Vercel. The generated route subset is not copied into the Runner Docker image.

## Railway removal impact

Removing Railway immediately would break:

1. Direct frontend calls to `AGENT_RUNNER_URL` for authentication, Agent Run registration, quotes, Daily Shift, zones, and future event APIs.
2. The current Neon-backed Runner routes unless equivalent Vercel Functions are implemented.
3. Any future DFlow CLI-based custody/signing path.
4. The only currently planned location for unattended Agent execution, although no worker exists yet.
5. CORS assumptions, because the current Runner explicitly allowlists Vercel origins.

It would not inherently break the Drive frontend, OSRM route proxy, or browser wallet signing; those already use Vercel/static frontend paths. It would also not provide a wake-up mechanism by itself—Neon remains passive storage.

## Classification summary

| Area | Class | Reason |
|---|---|---|
| Static frontend/assets | A | Already Vercel-compatible |
| OSRM route proxy | A | Existing Vercel function |
| Human DFlow order proxy | A | Existing Vercel function; retain secrets server-side |
| Runner auth/session APIs | A | Stateless Functions + Neon |
| Quote validation/persistence | A | Stateless Function + Neon; preserve rate limits carefully |
| Daily Shift state transitions | B | Requires atomic event/state machine design |
| Fare/route/trip simulation | B | Must move from localStorage to authoritative Neon transitions |
| Crazy Events | B | Server resolution and unresolved timing required |
| Agent private-key custody/signing | B/D | Actual vault and signer behavior not implemented/verified |
| Continuous worker assumption | C | Replace with wake/scheduling capability |
| Unattended wakeups | C | Vercel Cron/external scheduler/queue required |
| Neon persistence | A/B | Direct move is easy; transaction/locking design is not |
| Browser localStorage gameplay | B | Must become presentation cache, not source of truth |
| Railway Docker/CLI runtime | C | Remove only after custody and wake path are solved |

## Proposed migration sequence

1. Freeze current behavior and do not build the autonomous Railway worker or Phase 11.
2. Decide the wake mechanism: Vercel Cron plus bounded transition claims, or an external queue/scheduler. Define maximum invocation duration and retry semantics.
3. Add database transaction/idempotency primitives: transition keys, row/advisory locks, immutable event log, and reconciliation records.
4. Extract pure shared game rules into server-compatible modules: route metrics, fare eligibility, gas, event effects, scoring inputs, and time projection.
5. Package the generated route subset for the chosen server runtime and version it.
6. Implement Vercel Functions for one transition at a time: observe, accept fare, select route, resolve event, advance trip, complete/stall/park, and finalize shift.
7. Keep Agent wallet custody unchanged until DFlow wallet generation/decryption/signing is explicitly audited. Initially use quote-only or human-signed flows.
8. Add scheduler-driven wakeups that claim due Agents by `next_action_at`; do not pre-simulate future decisions.
9. Wire the frontend to server state and use local interpolation only for display.
10. Test duplicate invocation, timeout after signing, partial Neon failure, stale browser, concurrent owners, shift cutoff, event mutation, and recovery.
11. Run a shadow period with Railway retained but no duplicate writes, compare transition results, then remove Railway only after operational evidence.

## Final recommendation

Recommend **option 3: hybrid architecture** now.

The current repository makes most stateless APIs portable to Vercel, and the event-driven model is a better fit than a continuously running Agent process. However, removing Railway before solving unattended wakeups and Agent wallet custody would create an untested reliability and security gap. Retain Railway temporarily as an operational fallback/scheduler boundary while moving pure APIs and transition logic toward Vercel + Neon. Reassess full Railway removal after the event-driven transition and recovery tests pass.
