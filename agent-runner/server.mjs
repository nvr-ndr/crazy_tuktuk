import http from 'node:http';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import pg from 'pg';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { DflowQuoteError, agentGuardrails, assertQuoteGuardrails, executeTrade, getDflowCliVersion, quoteConfiguration, requestQuote, tradingConfiguration } from './dflow.mjs';

const require = createRequire(import.meta.url);
const { recordEpochContributionBestEffort } = require('../api/_lib/rewardEpochConfirmation');

const port = Number(process.env.PORT || 8080);
const requiredForDatabase = ['DATABASE_URL'];
const developmentTournamentId = '00000000-0000-4000-8000-000000000042';
let nextDevelopmentRunAt = 0;
const sessionLifetimeMinutes = 30;
const dailyGasAllocation = Number(process.env.DAILY_AGENT_GAS_ALLOCATION || 100);

function dailyShiftWindow(now = new Date()) {
  const shifted = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const key = shifted.toISOString().slice(0, 10);
  const start = new Date(`${key}T00:00:00+07:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { key, start, end };
}

async function ensureDailyShift(now = new Date()) {
  const window = dailyShiftWindow(now);
  const result = await queryDatabase(
    `INSERT INTO daily_shifts (id, shift_key, status, starts_at, ends_at)
     VALUES ($1, $2, CASE WHEN now() >= $3 THEN 'ACTIVE' ELSE 'QUEUED' END, $3, $4)
     ON CONFLICT (shift_key) DO UPDATE SET starts_at = CASE WHEN daily_shifts.status IN ('FINALIZING','COMPLETE') THEN daily_shifts.starts_at ELSE EXCLUDED.starts_at END,
       ends_at = CASE WHEN daily_shifts.status IN ('FINALIZING','COMPLETE') THEN daily_shifts.ends_at ELSE EXCLUDED.ends_at END,
       status = CASE
       WHEN daily_shifts.status IN ('FINALIZING','COMPLETE') THEN daily_shifts.status
       WHEN now() >= daily_shifts.ends_at THEN 'FINALIZING'
       WHEN now() >= daily_shifts.starts_at THEN 'ACTIVE'
       ELSE daily_shifts.status END
     RETURNING id, shift_key, status, starts_at, ends_at`,
    [randomUUID(), window.key, window.start.toISOString(), window.end.toISOString()]
  );
  const shift = result.rows[0];
  if (shift.status === 'FINALIZING') {
    await queryDatabase(
      `INSERT INTO daily_shift_results (id, shift_id, agent_id, final_rank, crazy_score, fares_completed, gas_remaining, bankroll, final_status)
       SELECT md5(shift_id::text || agent_id::text)::uuid, shift_id, agent_id,
              RANK() OVER (ORDER BY crazy_score DESC, fares_completed DESC)::int,
              crazy_score, fares_completed, gas_remaining, bankroll, status
       FROM agent_shift_states WHERE shift_id = $1
       ON CONFLICT (shift_id, agent_id) DO NOTHING`,
      [shift.id]
    );
    const completed = await queryDatabase(
      `UPDATE daily_shifts SET status = 'COMPLETE', finalized_at = COALESCE(finalized_at, now())
       WHERE id = $1 AND status = 'FINALIZING' RETURNING id, shift_key, status, starts_at, ends_at, finalized_at`,
      [shift.id]
    );
    return completed.rows[0] || shift;
  }
  return shift;
}

function allowedOrigin(request) {
  const requested = request.headers.origin;
  const allowed = (process.env.RUNNER_ALLOWED_ORIGINS || 'https://crazy-tuktuk.vercel.app,http://localhost:3000,http://127.0.0.1:3000,http://localhost:8080,http://127.0.0.1:8080')
    .split(',').map((origin) => origin.trim()).filter(Boolean);
  return requested && allowed.includes(requested) ? requested : null;
}

function json(response, status, body, request = null) {
  const origin = request ? allowedOrigin(request) : null;
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    ...(origin ? { 'access-control-allow-origin': origin, vary: 'origin' } : {})
  });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 8_192) throw new Error('request_too_large');
  }
  try {
    return JSON.parse(body || '{}');
  } catch {
    throw new Error('invalid_json');
  }
}

async function queryDatabase(query, values = []) {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    return await client.query(query, values);
  } finally {
    await client.end();
  }
}

async function withDatabaseTransaction(work) {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch { /* preserve original failure */ }
    throw error;
  } finally {
    await client.end();
  }
}

function tokenHash(token) {
  return createHash('sha256').update(token).digest('hex');
}

function validSolanaAddress(address) {
  try { return bs58.decode(address).length === 32; } catch { return false; }
}

async function requireSession(request) {
  const token = request.headers.authorization?.match(/^Bearer ([A-Za-z0-9_-]{32,})$/)?.[1];
  if (!token) return null;
  const result = await queryDatabase(
    `SELECT sessions.agent_id, agents.owner_wallet
     FROM agent_sessions sessions JOIN agents ON agents.id = sessions.agent_id
     WHERE sessions.token_hash = $1 AND sessions.revoked_at IS NULL AND sessions.expires_at > now()`,
    [tokenHash(token)]
  );
  return result.rows[0] || null;
}

async function ownsAgentRun(session, agentRunId) {
  const result = await queryDatabase('SELECT id FROM agent_runs WHERE id = $1 AND agent_id = $2', [agentRunId, session.agent_id]);
  return result.rowCount > 0;
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  if (request.method === 'OPTIONS') {
    const origin = allowedOrigin(request);
    response.writeHead(204, {
      ...(origin ? { 'access-control-allow-origin': origin, vary: 'origin' } : {}),
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': 'content-type, authorization',
      'access-control-max-age': '600'
    });
    return response.end();
  }
  if (request.method === 'POST' && url.pathname === '/v1/auth/challenge') {
    try {
      const body = await readJson(request);
      if (typeof body.wallet !== 'string' || !validSolanaAddress(body.wallet)) return json(response, 400, { error: 'solana_wallet_required' }, request);
      const id = randomUUID();
      const nonce = randomBytes(24).toString('base64url');
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      const message = `Crazy Tuk Agent Runner\nWallet: ${body.wallet}\nNonce: ${nonce}\nExpires: ${expiresAt}`;
      await queryDatabase(
        'INSERT INTO auth_challenges (id, wallet_address, message, expires_at) VALUES ($1, $2, $3, $4)',
        [id, body.wallet, message, expiresAt]
      );
      return json(response, 201, { challengeId: id, message, expiresAt }, request);
    } catch (error) {
      return json(response, error.message === 'invalid_json' ? 400 : 503, { error: error.message === 'invalid_json' ? 'invalid_json' : 'challenge_unavailable' }, request);
    }
  }
  if (request.method === 'POST' && url.pathname === '/v1/auth/verify') {
    try {
      const body = await readJson(request);
      if (typeof body.challengeId !== 'string' || typeof body.signature !== 'string') return json(response, 400, { error: 'challenge_and_signature_required' }, request);
      const challenge = await queryDatabase(
        'SELECT id, wallet_address, message FROM auth_challenges WHERE id = $1 AND consumed_at IS NULL AND expires_at > now()',
        [body.challengeId]
      );
      const row = challenge.rows[0];
      if (!row) return json(response, 401, { error: 'challenge_expired_or_used' }, request);
      const valid = nacl.sign.detached.verify(
        new TextEncoder().encode(row.message),
        Buffer.from(body.signature, 'base64'),
        bs58.decode(row.wallet_address)
      );
      if (!valid) return json(response, 401, { error: 'invalid_wallet_signature' }, request);
      const consumed = await queryDatabase('UPDATE auth_challenges SET consumed_at = now() WHERE id = $1 AND consumed_at IS NULL RETURNING id', [row.id]);
      if (!consumed.rowCount) return json(response, 401, { error: 'challenge_expired_or_used' }, request);
      await queryDatabase(
        `INSERT INTO agents (id, owner_wallet, name, persona, dflow_wallet_name, wallet_public_key)
         VALUES ($1, $2, 'Agent Driver', 'UNCONFIGURED', $3, $2)
         ON CONFLICT (owner_wallet) DO NOTHING`,
        [randomUUID(), row.wallet_address, `auth-${row.wallet_address.slice(0, 28)}`]
      );
      const agent = await queryDatabase('SELECT id FROM agents WHERE owner_wallet = $1', [row.wallet_address]);
      const token = randomBytes(32).toString('base64url');
      const expiresAt = new Date(Date.now() + sessionLifetimeMinutes * 60 * 1000).toISOString();
      await queryDatabase('INSERT INTO agent_sessions (id, agent_id, token_hash, expires_at) VALUES ($1, $2, $3, $4)', [randomUUID(), agent.rows[0].id, tokenHash(token), expiresAt]);
      return json(response, 201, { token, expiresAt }, request);
    } catch {
      return json(response, 503, { error: 'authentication_unavailable' }, request);
    }
  }
  if (request.method === 'POST' && url.pathname === '/v1/dev/agent-runs') {
    try {
      const session = await requireSession(request);
      if (!session) return json(response, 401, { error: 'agent_session_required' }, request);
      const body = await readJson(request);
      if (!/^[a-zA-Z0-9_-]{8,80}$/.test(body.clientId || '')) return json(response, 400, { error: 'invalid_client_id' });
      if (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 40) return json(response, 400, { error: 'invalid_agent_name' });
      if (typeof body.persona !== 'string' || !body.persona.trim() || body.persona.length > 40) return json(response, 400, { error: 'invalid_agent_persona' });
      if (Date.now() < nextDevelopmentRunAt) return json(response, 429, { error: 'development_run_rate_limited' });
      nextDevelopmentRunAt = Date.now() + 1_000;
      const dailyShift = await ensureDailyShift();

      await queryDatabase(
        `INSERT INTO tournaments (id, status, starts_at, ends_at, starting_bankroll, rules_version)
         VALUES ($1, 'LIVE', now(), now() + interval '10 minutes', 20, 'buildathon-dev-v1')
         ON CONFLICT (id) DO UPDATE SET status = 'LIVE', ends_at = EXCLUDED.ends_at`,
        [developmentTournamentId]
      );
      const agent = await queryDatabase(
        `INSERT INTO agents (id, owner_wallet, name, persona, dflow_wallet_name, wallet_public_key)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (owner_wallet) DO UPDATE SET name = EXCLUDED.name, persona = EXCLUDED.persona
         RETURNING id`,
        [randomUUID(), session.owner_wallet, body.name.trim(), body.persona.trim(), `dev-${body.clientId}`, session.owner_wallet]
      );
      const run = await queryDatabase(
        `INSERT INTO agent_runs (id, tournament_id, agent_id, status, bankroll, strategy)
         VALUES ($1, $2, $3, 'IDLE', 20, $4::jsonb)
         ON CONFLICT (tournament_id, agent_id) DO UPDATE SET updated_at = now()
         RETURNING id`,
        [randomUUID(), developmentTournamentId, agent.rows[0].id, JSON.stringify({ mode: 'development-quote-only' })]
      );
      await queryDatabase(
        `INSERT INTO agent_shift_states (id, shift_id, agent_id, status, bankroll)
         VALUES ($1, $2, $3, CASE WHEN $4 = 'ACTIVE' THEN 'ACTIVE' ELSE 'READY_NEXT_SHIFT' END, 20)
         ON CONFLICT (shift_id, agent_id) DO UPDATE SET updated_at = now()`,
        [randomUUID(), dailyShift.id, agent.rows[0].id, dailyShift.status]
      );
      return json(response, 201, { agentRunId: run.rows[0].id, dailyShift, mode: 'development-quote-only' }, request);
    } catch (error) {
      if (error.message === 'invalid_json' || error.message === 'request_too_large') return json(response, 400, { error: error.message }, request);
      return json(response, 503, { error: 'development_run_unavailable' }, request);
    }
  }
  if (request.method === 'GET' && url.pathname === '/v1/daily-shift') {
    try {
      const session = await requireSession(request);
      if (!session) return json(response, 401, { error: 'agent_session_required' }, request);
      const shift = await ensureDailyShift();
      await queryDatabase(
        `UPDATE agent_shift_states
         SET status = 'ACTIVE', gas_allocated = $1, gas_remaining = CASE WHEN gas_allocated = 0 THEN $1 ELSE gas_remaining END, updated_at = now()
         WHERE shift_id = $2 AND agent_id = $3 AND status = 'READY_NEXT_SHIFT' AND $4 = 'ACTIVE'`,
        [dailyGasAllocation, shift.id, session.agent_id, shift.status]
      );
      const state = await queryDatabase(
        `SELECT status, gas_remaining, gas_allocated, crazy_score, fares_completed, bankroll, pit_calls_used, updated_at
         FROM agent_shift_states WHERE shift_id = $1 AND agent_id = $2`,
        [shift.id, session.agent_id]
      );
      return json(response, 200, { shift, state: state.rows[0] || null }, request);
    } catch {
      return json(response, 503, { error: 'daily_shift_unavailable' }, request);
    }
  }
  if (request.method === 'POST' && url.pathname === '/v1/daily-shift/events') {
    try {
      const session = await requireSession(request);
      if (!session) return json(response, 401, { error: 'agent_session_required' }, request);
      const body = await readJson(request);
      const type = String(body.type || '').trim();
      const key = String(body.idempotencyKey || '').trim();
      const fareId = String(body.fareId || '').trim();
      const scoreDelta = Math.max(-1000, Math.min(1000, Number(body.scoreDelta || 0)));
      const gasDelta = Math.max(-100, Math.min(0, Number(body.gasDelta || 0)));
      if (!['FARE_COMPLETED', 'FARE_STALLED', 'AGENT_PARKED', 'FARE_REJECTED', 'IDLE_OBSERVED'].includes(type) || !/^[A-Za-z0-9:_-]{8,120}$/.test(key)) {
        return json(response, 400, { error: 'invalid_daily_shift_event' }, request);
      }
      const shift = await ensureDailyShift();
      const state = await queryDatabase('SELECT status FROM agent_shift_states WHERE shift_id = $1 AND agent_id = $2', [shift.id, session.agent_id]);
      if (!state.rowCount) return json(response, 404, { error: 'daily_shift_state_not_found' }, request);
      if (state.rows[0].status !== 'ACTIVE') return json(response, 409, { error: 'daily_shift_not_active' }, request);
      const event = await queryDatabase(
        `INSERT INTO daily_shift_events (id, shift_id, agent_id, idempotency_key, type, fare_id, score_delta, gas_delta, payload)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
         ON CONFLICT (idempotency_key) DO NOTHING RETURNING id`,
        [randomUUID(), shift.id, session.agent_id, key, type, fareId || null, scoreDelta, gasDelta, JSON.stringify(body.payload || {})]
      );
      if (!event.rowCount) return json(response, 200, { accepted: true, duplicate: true }, request);
      await queryDatabase(
        `UPDATE agent_shift_states
         SET crazy_score = crazy_score + $1,
             fares_completed = fares_completed + CASE WHEN $2 = 'FARE_COMPLETED' THEN 1 ELSE 0 END,
             gas_remaining = GREATEST(0, gas_remaining + $3),
             status = CASE WHEN $2 = 'FARE_STALLED' THEN 'STALLED' WHEN $2 = 'AGENT_PARKED' THEN 'PARKED' ELSE status END,
             last_observed_at = CASE WHEN $2 IN ('FARE_REJECTED', 'IDLE_OBSERVED') THEN now() ELSE last_observed_at END,
             next_decision_at = CASE WHEN $2 IN ('FARE_REJECTED', 'IDLE_OBSERVED') THEN now() + interval '15 seconds' ELSE next_decision_at END,
             updated_at = now()
         WHERE shift_id = $4 AND agent_id = $5`,
        [scoreDelta, type, gasDelta, shift.id, session.agent_id]
      );
      return json(response, 201, { accepted: true, duplicate: false, shiftId: shift.id }, request);
    } catch (error) {
      if (error.message === 'invalid_json' || error.message === 'request_too_large') return json(response, 400, { error: error.message }, request);
      return json(response, 503, { error: 'daily_shift_event_unavailable' }, request);
    }
  }
  if (request.method === 'POST' && url.pathname === '/v1/daily-shift/route-decision') {
    try {
      const session = await requireSession(request);
      if (!session) return json(response, 401, { error: 'agent_session_required' }, request);
      const body = await readJson(request);
      const primary = body.primary || {};
      const alternative = body.alternative || null;
      if (!Number.isFinite(Number(primary.distanceMeters)) || !Number.isFinite(Number(primary.durationSeconds))) {
        return json(response, 400, { error: 'primary_route_metrics_required' }, request);
      }
      const score = (route) => Number(route.distanceMeters) + Number(route.durationSeconds) * 2;
      const primaryScore = score(primary);
      const alternativeScore = alternative && Number.isFinite(Number(alternative.distanceMeters)) && Number.isFinite(Number(alternative.durationSeconds)) ? score(alternative) : Infinity;
      const selected = alternativeScore < primaryScore * 0.97 ? 'alternative' : 'primary';
      return json(response, 200, {
        selectedVariant: selected,
        reason: selected === 'alternative' ? 'alternative_is_at_least_3_percent_lower_cost' : 'primary_is_preferred_or_only_cached_route',
        metrics: { primaryScore, alternativeScore }
      }, request);
    } catch (error) {
      return json(response, error.message === 'invalid_json' ? 400 : 503, { error: error.message === 'invalid_json' ? 'invalid_json' : 'route_decision_unavailable' }, request);
    }
  }
  if (request.method === 'POST' && url.pathname === '/v1/daily-shift/zones/tick') {
    try {
      const session = await requireSession(request);
      if (!session) return json(response, 401, { error: 'agent_session_required' }, request);
      const body = await readJson(request);
      const zoneId = String(body.zoneId || '').trim();
      const agentCount = Math.max(0, Math.min(10000, Number(body.agentCount || 0)));
      const demandScore = Math.max(0, Math.min(100, Number(body.demandScore ?? 50)));
      if (!/^[a-zA-Z0-9_-]{2,60}$/.test(zoneId) || !Number.isFinite(agentCount) || !Number.isFinite(demandScore)) return json(response, 400, { error: 'invalid_zone_observation' }, request);
      const shift = await ensureDailyShift();
      const supplyScore = Math.min(100, agentCount * 12);
      const state = supplyScore >= demandScore + 20 ? 'OVERSUPPLIED' : demandScore >= supplyScore + 25 ? 'SURGE' : 'NORMAL';
      const result = await queryDatabase(
        `INSERT INTO zone_states (id, shift_id, zone_id, agent_count, demand_score, supply_score, state)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (shift_id, zone_id) DO UPDATE SET agent_count = EXCLUDED.agent_count,
           demand_score = EXCLUDED.demand_score, supply_score = EXCLUDED.supply_score, state = EXCLUDED.state, updated_at = now()
         RETURNING zone_id, agent_count, demand_score, supply_score, state, updated_at`,
        [randomUUID(), shift.id, zoneId, agentCount, demandScore, supplyScore, state]
      );
      return json(response, 200, { shiftId: shift.id, zone: result.rows[0] }, request);
    } catch (error) {
      return json(response, error.message === 'invalid_json' ? 400 : 503, { error: error.message === 'invalid_json' ? 'invalid_json' : 'zone_tick_unavailable' }, request);
    }
  }
  if (request.method === 'GET' && url.pathname === '/v1/daily-shift/zones') {
    try {
      const shift = await ensureDailyShift();
      const zones = await queryDatabase('SELECT zone_id, agent_count, demand_score, supply_score, state, updated_at FROM zone_states WHERE shift_id = $1 ORDER BY zone_id', [shift.id]);
      return json(response, 200, { shift, zones: zones.rows }, request);
    } catch {
      return json(response, 503, { error: 'zones_unavailable' }, request);
    }
  }
  if (request.method === 'GET' && url.pathname === '/v1/daily-shift/leaderboard') {
    try {
      const shift = await ensureDailyShift();
      const standings = await queryDatabase(
        `SELECT ROW_NUMBER() OVER (ORDER BY states.crazy_score DESC, states.fares_completed DESC, agents.created_at ASC)::int AS rank,
                agents.id AS agent_id, agents.name, agents.persona, states.status,
                states.crazy_score, states.fares_completed, states.gas_remaining
         FROM agent_shift_states states JOIN agents ON agents.id = states.agent_id
         WHERE states.shift_id = $1 ORDER BY rank LIMIT 100`,
        [shift.id]
      );
      return json(response, 200, { shift, standings: standings.rows }, request);
    } catch {
      return json(response, 503, { error: 'leaderboard_unavailable' }, request);
    }
  }
  if (request.method === 'GET' && url.pathname === '/v1/daily-shift/ghosts') {
    try {
      const shift = await ensureDailyShift();
      const ghosts = await queryDatabase(
        `SELECT agents.id AS agent_id, agents.name, states.crazy_score, states.current_route, states.route_started_at
         FROM agent_shift_states states JOIN agents ON agents.id = states.agent_id
         WHERE states.shift_id = $1 AND states.status = 'ACTIVE' AND states.current_route IS NOT NULL
           AND states.route_started_at > now() - interval '10 minutes'
         ORDER BY states.crazy_score DESC LIMIT 3`,
        [shift.id]
      );
      return json(response, 200, { shift, ghosts: ghosts.rows }, request);
    } catch {
      return json(response, 503, { error: 'ghosts_unavailable' }, request);
    }
  }
  const profileMatch = url.pathname.match(/^\/v1\/agents\/([0-9a-f-]{36})\/profile$/i);
  if (request.method === 'GET' && profileMatch) {
    try {
      const profile = await queryDatabase(
        `SELECT agents.id, agents.name, agents.persona, agents.created_at,
                COUNT(results.id)::int AS shifts_completed,
                COALESCE(SUM(results.fares_completed), 0)::int AS fares_completed,
                COALESCE(MAX(results.crazy_score), 0)::int AS best_score,
                COALESCE(MIN(results.final_rank), 0)::int AS best_rank
         FROM agents LEFT JOIN daily_shift_results results ON results.agent_id = agents.id
         WHERE agents.id = $1 GROUP BY agents.id`,
        [profileMatch[1]]
      );
      if (!profile.rowCount) return json(response, 404, { error: 'agent_not_found' }, request);
      return json(response, 200, { profile: profile.rows[0] }, request);
    } catch {
      return json(response, 503, { error: 'profile_unavailable' }, request);
    }
  }
  if (request.method === 'GET' && url.pathname === '/v1/activity') {
    try {
      const limit = Math.min(40, Math.max(1, Number(url.searchParams.get('limit') || 20)));
      const result = await queryDatabase(
        'SELECT id, actor_id, actor_name, type, title, detail, metadata, created_at FROM public_activity ORDER BY created_at DESC LIMIT $1',
        [limit]
      );
      return json(response, 200, { activity: result.rows }, request);
    } catch {
      return json(response, 503, { error: 'activity_unavailable' }, request);
    }
  }
  if (request.method === 'POST' && url.pathname === '/v1/activity') {
    try {
      const body = await readJson(request);
      const actorId = String(body.actorId || '').trim();
      const actorName = String(body.actorName || '').trim();
      const type = String(body.type || 'RIDE_UPDATE').trim();
      const title = String(body.title || '').trim();
      const detail = String(body.detail || '').trim();
      if (!/^[a-zA-Z0-9:_-]{3,100}$/.test(actorId) || !actorName || actorName.length > 60 || !title || title.length > 100 || !detail || detail.length > 240) {
        return json(response, 400, { error: 'invalid_activity' }, request);
      }
      const result = await queryDatabase(
        `INSERT INTO public_activity (id, actor_id, actor_name, type, title, detail, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
         RETURNING id, actor_id, actor_name, type, title, detail, metadata, created_at`,
        [randomUUID(), actorId, actorName, type.slice(0, 40), title, detail, JSON.stringify(body.metadata || {})]
      );
      return json(response, 201, { activity: result.rows[0] }, request);
    } catch (error) {
      if (error.message === 'invalid_json' || error.message === 'request_too_large') return json(response, 400, { error: error.message }, request);
      return json(response, 503, { error: 'activity_unavailable' }, request);
    }
  }
  const quoteMatch = url.pathname.match(/^\/v1\/agent-runs\/([0-9a-f-]{36})\/quotes$/i);
  if (request.method === 'POST' && quoteMatch) {
    try {
      const session = await requireSession(request);
      if (!session) return json(response, 401, { error: 'agent_session_required' }, request);
      const body = await readJson(request);
      const agentRunId = quoteMatch[1];
      if (!(await ownsAgentRun(session, agentRunId))) return json(response, 404, { error: 'agent_run_not_found' }, request);
      if (typeof body.fareId !== 'string' || !body.fareId.trim() || body.fareId.length > 120) {
        return json(response, 400, { error: 'fareId_is_required' }, request);
      }
      const guardrails = assertQuoteGuardrails(body);
      const result = await requestQuote(body);
      const quote = result.quote;
      const platformFee = quote.platformFee || {};
      const swapId = randomUUID();
      await queryDatabase(
        `INSERT INTO agent_swaps (
          id, agent_run_id, fare_id, status, input_mint, output_mint,
          input_amount, output_amount, notional_usd, platform_fee_bps, platform_fee_mode,
          platform_fee_amount, platform_fee_account
        ) VALUES ($1, $2, $3, 'QUOTED', $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          swapId, agentRunId, body.fareId.trim(), quote.inputMint, quote.outputMint,
          quote.inAmount, quote.outAmount, guardrails.notionalUsd, platformFee.feeBps ?? result.fee.bps,
          platformFee.mode ?? result.fee.mode, platformFee.amount ?? null, result.fee.feeAccount
        ]
      );
      await queryDatabase(
        'INSERT INTO agent_events (id, agent_run_id, type, payload) VALUES ($1, $2, $3, $4::jsonb)',
        [randomUUID(), agentRunId, 'QUOTE_RECEIVED', JSON.stringify({ requestId: quote.requestId, notionalUsd: guardrails.notionalUsd, inputMint: quote.inputMint, outputMint: quote.outputMint, outputAmount: quote.outAmount, feeBps: platformFee.feeBps ?? result.fee.bps, feeAmount: platformFee.amount ?? null })]
      );
      return json(response, 201, {
        id: swapId,
        status: 'QUOTED',
        requestId: quote.requestId,
        inputAmount: quote.inAmount,
        outputAmount: quote.outAmount,
        minOutputAmount: quote.minOutAmount,
        priceImpactPct: quote.priceImpactPct,
        platformFee: {
          amount: platformFee.amount ?? null,
          bps: platformFee.feeBps ?? result.fee.bps,
          mode: platformFee.mode ?? result.fee.mode
        },
        guardrails: { maxTradeUsd: guardrails.maxTradeUsd, maxDailyVolumeUsd: guardrails.maxDailyVolumeUsd, maxWalletValueUsd: guardrails.maxWalletValueUsd }
      }, request);
    } catch (error) {
      if (error instanceof DflowQuoteError) {
        const headers = error.retryAfterMs ? { 'retry-after': String(Math.ceil(error.retryAfterMs / 1000)) } : {};
        const origin = allowedOrigin(request);
        response.writeHead(error.status, { 'content-type': 'application/json; charset=utf-8', ...(origin ? { 'access-control-allow-origin': origin, vary: 'origin' } : {}), ...headers });
        return response.end(JSON.stringify({ error: error.message }));
      }
      if (error.message === 'invalid_json' || error.message === 'request_too_large') {
        return json(response, 400, { error: error.message }, request);
      }
      return json(response, 503, { error: 'quote_unavailable' }, request);
    }
  }
  const tradeMatch = url.pathname.match(/^\/v1\/agent-runs\/([0-9a-f-]{36})\/trades$/i);
  if (request.method === 'POST' && tradeMatch) {
    try {
      const session = await requireSession(request);
      if (!session || !(await ownsAgentRun(session, tradeMatch[1]))) return json(response, 404, { error: 'agent_run_not_found' }, request);
      const body = await readJson(request);
      const inputMint = String(body.inputMint || ''), outputMint = String(body.outputMint || ''), amount = String(body.amount || ''), slippageBps = String(body.slippageBps || '100');
      const guardrails = assertQuoteGuardrails({ inputMint, outputMint, notionalUsd: body.notionalUsd });
      const agent = await queryDatabase('SELECT dflow_wallet_name, owner_wallet FROM agents WHERE id=(SELECT agent_id FROM agent_runs WHERE id=$1)', [tradeMatch[1]]);
      if (!agent.rowCount) return json(response, 404, { error: 'agent_not_found' }, request);
      const trade = await executeTrade({ amount, inputMint, outputMint, slippageBps, walletName: agent.rows[0].dflow_wallet_name });
      const feeAmount = BigInt(String(body.platformFeeAmount || trade.result?.data?.platformFee?.amount || trade.result?.platformFee?.amount || 0));
      const feeMode = body.platformFeeMode === 'inputMint' ? 'inputMint' : 'outputMint';
      const feeMint = feeMode === 'inputMint' ? inputMint : outputMint;
      const contribution = feeMint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' ? feeAmount * BigInt(Math.max(0, Math.min(10000, Number(process.env.REWARD_FEE_SHARE_BPS || 5000)))) / 10000n : 0n;
      const swapId = randomUUID();
      const saved = await withDatabaseTransaction(async client => {
        const inserted = await client.query(`INSERT INTO agent_swaps (id,agent_run_id,fare_id,status,input_mint,output_mint,input_amount,output_amount,notional_usd,platform_fee_bps,platform_fee_mode,platform_fee_amount,platform_fee_account,reward_contribution_atomic,signature) VALUES ($1,$2,$3,'CONFIRMED',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) ON CONFLICT (signature) DO NOTHING RETURNING *`, [swapId, tradeMatch[1], String(body.fareId || 'agent-trade'), inputMint, outputMint, amount, trade.result?.data?.outputAmount || trade.result?.data?.outAmount || null, guardrails.notionalUsd, Number(body.platformFeeBps || process.env.DFLOW_PLATFORM_FEE_BPS || 50), feeMode, feeAmount.toString(), process.env.DFLOW_PLATFORM_FEE_ACCOUNT || null, contribution.toString(), trade.signature]);
        if (inserted.rowCount && contribution > 0n) {
          await recordEpochContributionBestEffort(client, {
            contributionId: randomUUID(), initialEpochId: randomUUID(), nextEpochId: randomUUID(),
            pool: 'AGENT', playerWallet: agent.rows[0].owner_wallet, signature: trade.signature,
            amountAtomic: contribution, confirmedAt: inserted.rows[0].created_at,
            thresholdAtomic: Math.round(Number(process.env.REWARD_SETTLEMENT_THRESHOLD_USDC || 50) * 1000000),
          }, { beforeRecord: database => database.query(`UPDATE reward_pool_balances SET accrued_atomic=accrued_atomic+$1,updated_at=now() WHERE pool='AGENT'`, [contribution.toString()]) });
        }
        return { duplicate: !inserted.rowCount, swap: inserted.rows[0] };
      });
      return json(response, saved.duplicate ? 200 : 201, { id: saved.swap?.id || swapId, status: 'CONFIRMED', signature: trade.signature, rewardContributionAtomic: contribution.toString() }, request);
    } catch (error) { return json(response, error instanceof DflowQuoteError ? error.status : 503, { error: error.message || 'agent_trade_unavailable' }, request); }
  }
  const historyMatch = url.pathname.match(/^\/v1\/agent-runs\/([0-9a-f-]{36})\/history$/i);
  if (request.method === 'GET' && historyMatch) {
    try {
      const session = await requireSession(request);
      if (!session || !(await ownsAgentRun(session, historyMatch[1]))) return json(response, 404, { error: 'agent_run_not_found' }, request);
      const [run, swaps, events] = await Promise.all([
        queryDatabase('SELECT status, bankroll, crazy_score, fares_completed, pit_calls_used, updated_at FROM agent_runs WHERE id = $1', [historyMatch[1]]),
        queryDatabase('SELECT id, fare_id, status, input_mint, output_mint, output_amount, notional_usd, platform_fee_bps, platform_fee_mode, platform_fee_amount, created_at FROM agent_swaps WHERE agent_run_id = $1 ORDER BY created_at DESC LIMIT 20', [historyMatch[1]]),
        queryDatabase('SELECT type, payload, created_at FROM agent_events WHERE agent_run_id = $1 ORDER BY created_at DESC LIMIT 30', [historyMatch[1]])
      ]);
      const guardrails = agentGuardrails();
      return json(response, 200, {
        run: run.rows[0], swaps: swaps.rows, events: events.rows,
        guardrails: {
          allowedTokens: guardrails.allowedSymbols,
          maxTradeUsd: guardrails.maxTradeUsd,
          maxDailyVolumeUsd: guardrails.maxDailyVolumeUsd,
          maxWalletValueUsd: guardrails.maxWalletValueUsd
        }
      }, request);
    } catch {
      return json(response, 503, { error: 'agent_history_unavailable' }, request);
    }
  }
  if (request.method !== 'GET') return json(response, 405, { error: 'method_not_allowed' });
  if (url.pathname === '/health') return json(response, 200, { service: 'crazy-tuk-agent-runner', status: 'ok' });
  if (url.pathname === '/ready') {
    const missing = requiredForDatabase.filter((key) => !process.env[key]);
    if (missing.length) return json(response, 503, {
      service: 'crazy-tuk-agent-runner',
      status: 'configuration_required',
      missing
    });
    try {
      const [database, dflowVersion] = await Promise.all([
        queryDatabase('SELECT 1'),
        getDflowCliVersion()
      ]);
      void database;
      const trading = tradingConfiguration();
      const quote = quoteConfiguration();
      return json(response, 200, {
        service: 'crazy-tuk-agent-runner',
        status: 'ready',
        dflow: { cli: dflowVersion, verifySignatures: process.env.DFLOW_VERIFY_SIGNATURES === '1' },
        trading: trading.enabled && trading.configured ? 'configured' : 'disabled',
        tradingConfigurationRequired: trading.enabled ? trading.missing : [],
        quotes: {
          development: quote.development,
          apiKeyConfigured: quote.apiKeyConfigured
        },
        platformFee: {
          bps: trading.platformFee.bps,
          mode: trading.platformFee.mode,
          recipientConfigured: Boolean(trading.platformFee.feeAccount)
        }
      });
    } catch {
      return json(response, 503, { service: 'crazy-tuk-agent-runner', status: 'database_unavailable' });
    }
  }
  if (url.pathname === '/v1/status') {
    try {
      const [dailyShift, tournaments, runs] = await Promise.all([
        ensureDailyShift(),
        queryDatabase("SELECT id, status, starts_at, ends_at FROM tournaments ORDER BY starts_at DESC LIMIT 1"),
        queryDatabase("SELECT status, count(*)::int AS count FROM agent_runs GROUP BY status")
      ]);
      return json(response, 200, { dailyShift, tournament: tournaments.rows[0] || null, runs: runs.rows });
    } catch {
      return json(response, 503, { error: 'database_unavailable' });
    }
  }
  return json(response, 404, { error: 'not_found' });
});

server.listen(port, '0.0.0.0', () => console.log(`Crazy Tuk Agent Runner listening on ${port}`));
