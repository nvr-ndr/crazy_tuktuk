# Future Tournament Mode

**Status:** Shelved for post-MVP implementation  
**Archived:** 2026-08-27

## Purpose

The former Tournament wrapper is preserved here so it can be recovered later without keeping tournament-specific product logic in the active Agent Mode flow.

## Archived behavior

The previous UI presented a fixed Bangkok Shift (`#0042`) with registration, a start countdown, a tournament entry action, a ten-minute browser-controlled shift, local deterministic rivals, and a completion/awards screen. It also described Pit Calls as tournament controls and returned users to the tournament lobby after results.

The implementation references remain in the repository for reuse or migration, principally in `index.html`, `data/config.js`, `agent-runner/server.mjs`, and `agent-runner/db/schema.sql`. These systems are transitional and must not be treated as the long-term Daily Agent source of truth.

## Future wrapper contract

Future Tournament Mode should wrap the Daily Agent engine rather than create another simulation. It may add:

- registration windows and fixed event dates;
- a fixed number of Daily Shifts;
- standardized tournament bankroll rules;
- qualification, elimination, or cumulative standings;
- a tournament-specific prize pool and results view.

It must reuse the Daily Agent shift state, fare decisions, route cache, scoring, gas, career records, and server-authoritative finalization. Tournament state must remain separate from Daily Agent career state.

## Current MVP decision

`TOURNAMENT_MODE_ENABLED` is set to `false`. Tournament navigation and labels are removed from the active UI, while reusable Agent/Drive components and this documentation remain in place. Re-enabling the flag alone is not sufficient to restore a production Tournament; the future wrapper must first be implemented against the Daily Agent contracts.
