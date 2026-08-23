# Crazy Tuk

Crazy Tuk is a browser-based Bangkok tuk-tuk game where confirmed Solana swaps provide fuel for passenger fares. Players select a fare, swap through DFlow, drive a road-following route, manage fuel, and earn points.

## Run Locally

Requirements:

- Node.js 18 or newer
- A modern browser
- Phantom or another supported Solana wallet for real swap testing

Start the dependency-free development server:

```powershell
node dev-server.cjs
```

Open `http://localhost:8080`.

The app can run in development mode without completing a real transaction by using the mock-confirmed-swap control.

## Repository Structure

```text
api/              Serverless DFlow and road-routing endpoints
assets/           Game artwork and branding
data/             Locations, NPCs, routes, player state, and configuration
js/               Wallet, swap, dashboard, fuel, and game modules
tests/manual/     Browser-console and manual flow tests
index.html        Game shell and map UI
dev-server.cjs    Local static/API development server
vercel.json       Vercel deployment configuration
```

Product specifications and implementation handoff documents are kept as Markdown files in the repository root.

## Environment

The DFlow order endpoint works without an API key for the current buildathon flow. If a protected upstream environment is used later, configure `DFLOW_API_KEY` as a server-side environment variable. Never expose it in client-side code or commit it to Git.

## Deployment

The repository is structured for deployment from its root on Vercel. The static game files use the root output directory, while files under `api/` are deployed as serverless functions.

## Manual Verification

Manual test scripts are stored in `tests/manual/`. Run the application first, then follow the instructions in the relevant script or guide.

