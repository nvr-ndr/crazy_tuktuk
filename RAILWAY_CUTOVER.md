# Railway Cutover Boundary

## Status

The Daily Agent control path is migrated to Vercel API routes backed by Neon:

- wallet challenge and verification: `/api/auth/challenge`, `/api/auth/verify`
- Agent registration and shift lifecycle: `/api/agent/register`, `/api/agent/shift`, `/api/agent/transition`
- zones and Pit Calls: `/api/agent/zones`, `/api/agent/pit-call`
- unattended wake endpoint: `/api/cron/agent-wake`

## Hobby-plan scheduling

Vercel Hobby cannot register a five-minute Cron Job. The Vercel Cron
declaration is intentionally omitted from `vercel.json`; use cron-job.org to
call the endpoint instead.

Configure one cron-job.org job as follows:

- URL: `https://crazy-tuktuk.vercel.app/api/cron/agent-wake`
- Method: `POST`
- Schedule: every 5 minutes
- Header: `Authorization: Bearer <CRON_SECRET>`
- Expected response: HTTP 200 with the wake summary

Set the same high-entropy value as `CRON_SECRET` in the Vercel Production
environment, then redeploy. Do not put the secret in the URL or frontend.

The browser remains a presentation and input client. It does not decide fares,
authorize bankroll transitions, or sign autonomous swaps.

## Railway boundary

Railway remains deployed and untouched. `AGENT_RUNNER_URL` and the legacy Runner
remain available only as an explicit quote-simulation fallback. The frontend's
normal Daily Agent path does not call that fallback; enablement requires
`useLegacyQuoteFallback === true` in tournament configuration.

The human DFlow flow remains browser-wallet controlled through
`/api/dflow/order` and the existing wallet integration. No custody, private-key,
or autonomous-signing behavior was added.

## Verification boundary

Local syntax and regression suites cover the Vercel route contracts and Neon
state transitions. A complete cutover acceptance requires a deployed
Railway-unavailable browser run plus live Vercel/Neon wallet authentication;
until that scenario is executed, Railway removal is not approved.
