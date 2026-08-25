import http from 'node:http';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import pg from 'pg';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { DflowQuoteError, agentGuardrails, assertQuoteGuardrails, getDflowCliVersion, quoteConfiguration, requestQuote, tradingConfiguration } from './dflow.mjs';

const port = Number(process.env.PORT || 8080);
const requiredForDatabase = ['DATABASE_URL'];
const developmentTournamentId = '00000000-0000-4000-8000-000000000042';
let nextDevelopmentRunAt = 0;
const sessionLifetimeMinutes = 30;

function allowedOrigin(request) {
  const requested = request.headers.origin;
  const allowed = (process.env.RUNNER_ALLOWED_ORIGINS || 'https://crazy-tuktuk.vercel.app,http://localhost:3000,http://127.0.0.1:3000')
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
      return json(response, 201, { agentRunId: run.rows[0].id, mode: 'development-quote-only' }, request);
    } catch (error) {
      if (error.message === 'invalid_json' || error.message === 'request_too_large') return json(response, 400, { error: error.message }, request);
      return json(response, 503, { error: 'development_run_unavailable' }, request);
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
      const [tournaments, runs] = await Promise.all([
        queryDatabase("SELECT id, status, starts_at, ends_at FROM tournaments ORDER BY starts_at DESC LIMIT 1"),
        queryDatabase("SELECT status, count(*)::int AS count FROM agent_runs GROUP BY status")
      ]);
      return json(response, 200, { tournament: tournaments.rows[0] || null, runs: runs.rows });
    } catch {
      return json(response, 503, { error: 'database_unavailable' });
    }
  }
  return json(response, 404, { error: 'not_found' });
});

server.listen(port, '0.0.0.0', () => console.log(`Crazy Tuk Agent Runner listening on ${port}`));
