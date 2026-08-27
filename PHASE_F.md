# Phase F implementation note

The wake boundary is `api/cron/agent-wake.js`, backed by `api/_lib/wake.js`.
It uses PostgreSQL `now()`, `FOR UPDATE SKIP LOCKED`, a 60-second lease, and a
conservative five-Agent batch. The same `processWake()` function is available
for manual/dev invocation.

`vercel.json` schedules the endpoint every five minutes. Vercel's current
documentation says Hobby permits only once-daily Cron jobs, while Pro and
Enterprise permit once-per-minute schedules; the repository does not identify
the account plan, so five-minute support is currently **UNVERIFIED**. See
[Vercel Cron usage and pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing).
On a supported five-minute schedule, expected polling delay is approximately
2.5 minutes average and under 5 minutes worst case, before platform jitter.
Vercel's Cron request should be protected with `CRON_SECRET`; manual calls may use
`AGENT_WAKE_SECRET` or `CRON_SECRET` as `Authorization: Bearer ...` (or
`x-agent-wake-secret`). `DATABASE_URL` is required by Neon.

The endpoint currently advances one active trip or one fare-observation/
acceptance transition per claimed Agent. Railway remains present as fallback.
Live Neon concurrency, crash-recovery, retry, backlog, cutoff, and unattended
integration tests are still required before calling Phase F PASS.

## Final acceptance (2026-08-27)

Phase F PASS. The live group covers due discovery, bounded batching, concurrent
claims, expired-lease recovery, stale-token protection, unattended Crazy Events,
dynamic rescheduling, trip/fare completion, later current-world fare selection,
normal snapshot reconstruction, and cutoff parking. It passed 6/6 in three
sequential runs. The serialized regression passed: local 20/20, Phase D/E live
10/10, Phase F live 6/6, syntax checks, and `git diff --check`.

The test-only multi-wake fixture uses an eligibility scope and temporary batch
override of 50 to avoid unrelated stale shared-Neon fixtures; production wake
behavior remains global with batch size 5. Railway, wallet custody, and DFlow
signing were not changed.
