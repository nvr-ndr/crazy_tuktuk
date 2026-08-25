# Crazy Tuk — DFlow × Superteam Thailand Buildathon

## One-line pitch

Crazy Tuk turns a DFlow swap into a playable Bangkok delivery decision: users hire an autonomous tuk-tuk driver, fund its dedicated wallet, and watch it choose eligible fares, quote routes, and earn a score.

## What works today

- Drive Mode provides the human Crazy Tuk loop.
- Tournament Mode creates a mock agent driver and runs an autonomous Shift on the same map/ride system.
- Each Agent fare obtains a real keyless DFlow development quote before the existing mock ride completion.
- Quotes carry a 50 bps platform fee and are persisted to Neon with quote, fee, and audit-event data.
- The public Runner requires a short-lived Solana wallet signature session; anonymous quote/run writes are rejected.
- Guardrails restrict quote pairs to SOL, USDC, and USDT and cap a single quote at $5 by default.

## DFlow’s role

The product begins where a swap ends. A DFlow quote is the agent’s economic decision that unlocks the gameplay loop: quote → fare eligibility → fuel/ride simulation → score → tournament record. The eventual execution path will use the same persisted quote record, fee configuration, and guardrails after DFlow Agent CLI access is approved.

## Safety posture

- Development endpoint only; no transaction execution route exists.
- No user funds or agent wallet has been created or funded.
- 0.5% platform fees use DFlow-supported parameters and a configured USDC token account.
- Wallet-signed sessions expire after 30 minutes and are stored as hashes in Neon.
- Runner-wide quote limit is 1 TPS; no polling worker runs on Railway.

## Two-minute demo outline

1. Open Tournament Mode and create a driver.
2. Start an Agent Shift on the full Bangkok map.
3. Show the passenger/fare selection and the Dashboard’s “DFlow dev quote · no funds moved” event.
4. Open Agent Activity to show the quote pair, output, and 50 bps platform fee.
5. Show the autonomous pickup and ride animation.
6. Open the Agent dashboard/history and explain the guardrails and signed-session protection.
7. Close on Tournament results and the persistent quote audit trail.
