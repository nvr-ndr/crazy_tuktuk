const { randomUUID } = require('node:crypto');
const { withDatabase, withDatabaseTransaction } = require('../_lib/db');
const { bangkokDateKey } = require('../_lib/dailyPeriod');
const { calculateStandardFareScore } = require('../_lib/standardScoring');
const { getStandardEventPoints } = require('../_lib/standardEventScores');

const RPC = process.env.SOLANA_RPC_URL || 'https://solana-rpc.publicnode.com';
function respond(response, status, body) { return response.status(status).json(body); }
function env(value) { return value === 'PRODUCTION_TEST' ? value : 'NORMAL'; }
function validWallet(value) { return typeof value === 'string' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value); }
function validSignature(value) { return typeof value === 'string' && /^[1-9A-HJ-NP-Za-km-z]{80,100}$/.test(value); }
async function rpc(method, params) { const response = await fetch(RPC, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }); if (!response.ok) throw new Error('solana_rpc_unavailable'); const body = await response.json(); if (body.error) throw new Error('solana_rpc_error'); return body.result; }
async function confirmedByWallet(signature, wallet) { const status = (await rpc('getSignatureStatuses', [[signature], { searchTransactionHistory: true }]))?.value?.[0]; if (!status || status.err || !['confirmed', 'finalized'].includes(status.confirmationStatus)) return false; const transaction = await rpc('getTransaction', [signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }]); return (transaction?.transaction?.message?.accountKeys || []).some(key => key.signer === true && key.pubkey === wallet); }
async function transaction(request, response) {
  const body = request.body || {}, wallet = body.playerWallet, signature = body.transactionSignature;
  if (!validWallet(wallet) || !validSignature(signature) || body.mode !== 'STANDARD' || body.environment === 'DEMO') return respond(response, 400, { error: 'invalid_standard_transaction' });
  if (!(await confirmedByWallet(signature, wallet))) return respond(response, 409, { error: 'standard_transaction_not_confirmed_or_wallet_mismatch' });
  const displayName = typeof body.displayName === 'string' && body.displayName.trim() ? body.displayName.trim().slice(0, 32) : null;
  const saved = await withDatabaseTransaction(async client => { await client.query(`INSERT INTO standard_players (wallet_address,display_name) VALUES ($1,$2) ON CONFLICT (wallet_address) DO UPDATE SET display_name=COALESCE(EXCLUDED.display_name,standard_players.display_name), last_seen_at=now()`, [wallet, displayName]); const inserted = await client.query(`INSERT INTO standard_transactions (id,player_wallet,environment,input_mint,output_mint,input_amount_raw,output_amount_raw,transaction_signature,platform_fee_bps,platform_fee_mode,platform_fee_account,status,submitted_at,confirmed_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'CONFIRMED',$12,$12) ON CONFLICT (transaction_signature) DO NOTHING RETURNING *`, [randomUUID(), wallet, env(body.environment), String(body.inputMint || ''), String(body.outputMint || ''), String(body.inputAmountRaw || 0), body.outputAmountRaw == null ? null : String(body.outputAmountRaw), signature, Number(body.platformFeeBps ?? process.env.DFLOW_PLATFORM_FEE_BPS ?? 80), body.platformFeeMode || process.env.DFLOW_PLATFORM_FEE_MODE || 'outputMint', body.platformFeeAccount || process.env.DFLOW_PLATFORM_FEE_ACCOUNT || null, new Date()]); return { duplicate: !inserted.rowCount, transaction: inserted.rows[0] || (await client.query('SELECT * FROM standard_transactions WHERE transaction_signature=$1', [signature])).rows[0] }; });
  return respond(response, saved.duplicate ? 200 : 201, saved);
}
async function result(request, response) {
  const body = request.body || {}, wallet = body.playerWallet, signature = body.transactionSignature;
  if (!validWallet(wallet) || typeof body.fareSessionId !== 'string' || !body.fareSessionId || !validSignature(signature) || body.environment === 'DEMO') return respond(response, 400, { error: 'invalid_standard_game_result' });
  if (body.fareCompleted === false) return respond(response, 400, { error: 'standard_result_must_be_completed' });
  const snapshot = body.fareSnapshot || {};
  if (!['ANY_SWAP', 'MIN_USD', 'SOL_PAIR', 'STABLE_TO_STABLE', 'STABLE_TO_VOLATILE', 'VOLATILE_TO_STABLE'].includes(snapshot.condition)) return respond(response, 400, { error: 'invalid_standard_fare_condition' });
  const eventPoints = getStandardEventPoints(snapshot.eventId, snapshot.eventOutcomeId);
  if (eventPoints === null) return respond(response, 400, { error: 'invalid_standard_event_outcome' });
  let score;
  try {
    const zoneId = typeof snapshot.zoneId === 'string' ? snapshot.zoneId.slice(0, 80) : null;
    const stalled = snapshot.stalled === true || Number(snapshot.stallCount || 0) > 0;
    let zoneMultiplier = 1;
    if (zoneId && !stalled) {
      const activity = await withDatabase(async client => client.query(`SELECT COUNT(DISTINCT actor_id)::int AS active_players FROM game_activity WHERE mode='STANDARD' AND type='PRESENCE' AND zone_id=$1 AND expires_at > now()`, [zoneId]));
      const activePlayers = Number(activity.rows[0]?.active_players || 0);
      zoneMultiplier = activePlayers > 0 && activePlayers <= 2 ? 1.25 : activePlayers <= 5 ? 1.1 : 1;
    }
    score = calculateStandardFareScore({ distanceKm: snapshot.distanceKm, totalFuel: snapshot.totalFuel, condition: snapshot.condition, finalStars: body.finalStars, eventPoints, zoneMultiplier });
    score.stalled = stalled;
  } catch (error) { return respond(response, 400, { error: error.message }); }
  const displayName = typeof body.displayName === 'string' && body.displayName.trim() ? body.displayName.trim().slice(0, 32) : null;
  const saved = await withDatabaseTransaction(async client => { const transactionRow = (await client.query(`SELECT transaction_signature FROM standard_transactions WHERE transaction_signature=$1 AND player_wallet=$2 AND status='CONFIRMED'`, [signature, wallet])).rows[0]; if (!transactionRow) return { missingTransaction: true }; const period = bangkokDateKey(), competitionEnvironment = env(body.environment); await client.query(`INSERT INTO standard_players (wallet_address,display_name) VALUES ($1,$2) ON CONFLICT (wallet_address) DO UPDATE SET display_name=COALESCE(EXCLUDED.display_name,standard_players.display_name), last_seen_at=now()`, [wallet, displayName]); const current = (await client.query(`SELECT COALESCE(SUM(score_delta),0)::int AS score FROM standard_game_results WHERE player_wallet=$1 AND competition_period=$2 AND environment=$3`, [wallet, period, competitionEnvironment])).rows[0]; const inserted = await client.query(`INSERT INTO standard_game_results (id,player_wallet,fare_session_id,competition_period,environment,score_delta,resulting_period_score,fare_completed,transaction_signature,final_stars,event_id,event_outcome_id,score_version,fare_snapshot) VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8,$9,$10,$11,'standard-v2',$12) ON CONFLICT DO NOTHING RETURNING *`, [randomUUID(), wallet, body.fareSessionId, period, competitionEnvironment, score.finalScore, Number(current.score) + score.finalScore, signature, Number(body.finalStars), snapshot.eventId || null, snapshot.eventOutcomeId || null, JSON.stringify({ distanceKm: snapshot.distanceKm, totalFuel: snapshot.totalFuel, condition: snapshot.condition })]); return { duplicate: !inserted.rowCount, score, result: inserted.rows[0] || (await client.query('SELECT * FROM standard_game_results WHERE player_wallet=$1 AND fare_session_id=$2', [wallet, body.fareSessionId])).rows[0] }; });
  if (saved.missingTransaction) return respond(response, 409, { error: 'confirmed_standard_transaction_required' }); return respond(response, saved.duplicate ? 200 : 201, saved);
}
async function profile(request, response) {
  const body = request.body || {}, wallet = body.playerWallet;
  if (!validWallet(wallet)) return respond(response, 400, { error: 'invalid_standard_profile' });
  const displayName = typeof body.displayName === 'string' && body.displayName.trim() ? body.displayName.trim().slice(0, 32) : null;
  await withDatabase(async client => client.query(`INSERT INTO standard_players (wallet_address,display_name) VALUES ($1,$2) ON CONFLICT (wallet_address) DO UPDATE SET display_name=$2,last_seen_at=now()`, [wallet, displayName]));
  return respond(response, 200, { playerWallet: wallet, displayName: displayName || 'Anon' });
}
async function leaderboard(request, response) { const competitionEnvironment = request.query?.environment === 'PRODUCTION_TEST' ? 'PRODUCTION_TEST' : 'NORMAL'; const period = request.query?.period && /^\d{4}-\d{2}-\d{2}$/.test(request.query.period) ? request.query.period : bangkokDateKey(); const result = await withDatabase(async client => client.query(`SELECT r.player_wallet AS wallet, p.display_name, r.competition_period AS period, r.environment, SUM(r.score_delta)::int AS score, COUNT(*) FILTER (WHERE r.fare_completed)::int AS completed_fares FROM standard_game_results r JOIN standard_players p ON p.wallet_address=r.player_wallet WHERE r.competition_period=$1 AND r.environment=$2 GROUP BY r.player_wallet,p.display_name,r.competition_period,r.environment ORDER BY score DESC,completed_fares DESC,r.player_wallet ASC LIMIT 100`, [period, competitionEnvironment])); return respond(response, 200, { period, environment: competitionEnvironment, leaderboard: result.rows.map((row, index) => ({ rank: index + 1, playerWallet: row.wallet, displayName: row.display_name || 'Anon', score: Number(row.score), completedFares: Number(row.completed_fares), period: row.period, environment: row.environment })) }); }
module.exports = async function handler(request, response) { try { if (request.method === 'GET') return leaderboard(request, response); if (request.method !== 'POST') return respond(response, 405, { error: 'method_not_allowed' }); if (request.query?.action === 'profile' || request.body?.action === 'profile') return profile(request, response); return request.query?.action === 'result' || request.body?.action === 'result' ? result(request, response) : transaction(request, response); } catch (error) { console.error('standard ledger failed', error); return respond(response, 503, { error: 'standard_ledger_unavailable' }); } };
