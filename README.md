# 🛺 CrazyTukTuk

**Swap. Drive. Survive Bangkok.**

CrazyTukTuk is a swap-powered Bangkok tuk-tuk strategy game built for the DFlow × Superteam Thailand Buildathon. It turns the moment after a Solana swap into interactive gameplay: find passengers, evaluate fares, manage fuel and time, react to Crazy Events, and complete rides across a living Bangkok map.

> **Buildathon theme:** Build what happens after the swap.

## Game modes

### Driver Mode

Players explore Bangkok, compare fares, execute DFlow-powered swaps, pick up passengers, follow road-based routes, manage fuel, and make decisions during Crazy Events that affect time, fuel, score, earnings, and passenger satisfaction.

### Agentic Mode

Players fund an agent wallet and let an autonomous driver evaluate fares, routes, zone conditions, and events. Scheduled wakes allow the agent to continue operating when the browser is closed. Limited **Pit Calls** let players guide the agent’s strategy without taking over every decision.

## How it works

```text
Player or Agent decision
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
