# 🛺 CrazyTukTuk

**Swap. Drive. Survive Bangkok.**

CrazyTukTuk is a swap-powered Bangkok tuk-tuk strategy game built for the DFlow × Superteam Thailand Buildathon. It turns the moment after a Solana swap into interactive gameplay: find passengers, evaluate fares, manage fuel and time, react to Crazy Events, and complete rides across a living Bangkok map.

> **Buildathon theme:** Build what happens after the swap.

## Game modes

### Driver Mode

Players explore Bangkok, compare fares, execute DFlow-powered swaps, pick up passengers, follow road-based routes, manage fuel, and make decisions during Crazy Events that affect time, fuel, score, earnings, and passenger satisfaction.

### Agentic Mode

**Preview:** Players can explore persistent agent state, autonomous fare/route/event decisions, scheduled wakes, and limited **Pit Calls**. Live DFlow Agent CLI trading is pending DFlow production API access; this mode must not be described as currently executing autonomous onchain trades.

Agentic Mode currently demonstrates the persistence, decision, and wake infrastructure. Autonomous live swaps and funded onchain execution will remain disabled until the required DFlow API access is available and verified.

## How it works

```text
Player decision (live) / Agent decision (preview)
          ↓
      DFlow swap
          ↓
    Confirmed game action
          ↓
  Passenger / route / fuel state
          ↓
       Gameplay continues
```

Distance, pickup cost, trip cost, traffic, surge, passenger tolerance, current position, and event risk all influence whether a fare is worth taking.

## Competitive scoring

Standard Mode uses a server-calculated score. The browser cannot submit an arbitrary score delta.

The current formula is intentionally compact and keeps capital independent from competitive points:

```text
Objective fare value = clamp(round((10 + distance × 3.5 + fuel pressure + condition bonus) / 5) × 5, 15, 120)

Passenger multiplier:
  1★ = 0.8×   2★ = 0.9×   3★ = 1.0×   4★ = 1.1×   5★ = 1.2×

Final score = objective fare value × passenger multiplier + event contribution
```

Fuel pressure applies only when a fare uses more than the baseline fuel allowance. Fare minimum-dollar requirements, swap size, and Production Test Mode amounts do not increase the score. Standard does not award an alternative-route bonus; Agentic Mode retains its separate route-selection logic.

Crazy Event outcomes are allowlisted for Standard scoring and contribute at most ±40 points per fare. Passenger satisfaction is converted to a bounded 1–5 star rating, so strong service can improve a score without overwhelming route and fuel performance. Results are recorded idempotently against the completed fare and confirmed transaction.

## Crazy Events

Trips can encounter traffic incidents, passenger requests, shortcuts, opportunities, mechanical problems, weather, and other Bangkok moments. Events may modify time, fuel, score, earnings, risk, or passenger satisfaction. Some resolve automatically; others require a choice.

## Technology

- **Frontend:** responsive JavaScript UI, MapLibre, Bangkok map and route visualization
- **Blockchain:** Solana, DFlow, supported Solana wallets
- **Backend:** Vercel serverless APIs and scheduled Agent wakes
- **Database:** Neon Postgres for persistent Agent state, fares, trips, events, commands, and route state
- **Routing:** cached/precomputed Bangkok route geometry with lazy-loaded Cloudflare R2 route chunks

## Architecture

Agent wakes acquire an execution lease, reconstruct current state from Neon, evaluate the next decision, progress trips or events, persist the result, and schedule the next wake. The system is designed to continue without a permanently running game process or an open browser.

## Project status

- [x] Bangkok game map
- [x] Passenger and fare system
- [x] Driver gameplay loop
- [x] Road-following route visualization
- [x] Cached and lazy-loaded route data
- [x] DFlow swap integration architecture
- [x] Crazy Events system
- [x] Agentic fare selection and Pit Calls
- [x] Persistent Agent trips and scheduled wakes
- [x] Neon-backed Agent APIs
- [x] Agentic preview infrastructure
- [ ] Live DFlow Agent CLI production trading (pending DFlow API access)
- [ ] Additional UI polish
- [ ] Expanded economy and districts
- [ ] Competitive leaderboard experience

## Run locally

Requirements:

- Node.js 18 or newer
- A modern browser
- Phantom or another supported Solana wallet for real swap testing

Start the local server:

```powershell
node dev-server.cjs
```

Open `http://localhost:8080`.

## Links

- [Live demo](https://crazy-tuktuk.vercel.app/)
- [DFlow × Superteam Thailand Buildathon](https://stth-buildathon.vercel.app/)
- [Buildathon rules](https://stth-buildathon.vercel.app/rules/)
- [Superteam Thailand](https://x.com/SuperteamTH)

## Vision

Most swap interfaces end with “Transaction confirmed.” CrazyTukTuk treats that moment as the beginning:

```text
Transaction confirmed.
Passenger acquired.
Start the engine.
```

**DFlow provides the transaction layer. CrazyTukTuk provides what happens next.**
