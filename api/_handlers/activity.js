const { randomUUID } = require('node:crypto');
const { withDatabase } = require('../_lib/db');

function respond(response, status, body) { return response.status(status).json(body); }
function validMode(value) { return value === 'AGENT' || value === 'STANDARD'; }
function text(value, fallback, max = 160) { return String(value || fallback).trim().slice(0, max) || fallback; }

module.exports = async function handler(request, response) {
  if (!['GET', 'POST'].includes(request.method)) return respond(response, 405, { error: 'method_not_allowed' });
  try {
    if (request.method === 'POST') {
      const body = request.body || {};
      const mode = validMode(body.mode) ? body.mode : 'STANDARD';
      const actorId = text(body.actorId, 'anonymous', 120);
      const actorName = text(body.actorName, 'Anon', 40);
      const type = text(body.type, 'UPDATE', 40).toUpperCase();
      const detail = text(body.detail, 'Driver activity observed.', 240);
      const zoneId = body.zoneId ? text(body.zoneId, null, 80) : null;
      const metadata = body.metadata && typeof body.metadata === 'object' ? body.metadata : {};
      const row = await withDatabase(async client => (await client.query(
        `INSERT INTO game_activity (id,mode,actor_id,actor_name,zone_id,type,detail,metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
         RETURNING id,mode,actor_name,zone_id,type,detail,created_at`,
        [randomUUID(), mode, actorId, actorName, zoneId, type, detail, JSON.stringify(metadata)]
      )).rows[0]);
      return respond(response, 201, { activity: row });
    }
    const mode = validMode(request.query?.mode) ? request.query.mode : null;
    const limit = Math.min(50, Math.max(1, Number(request.query?.limit || 30)));
    const result = await withDatabase(async client => client.query(
      `SELECT actor_name,zone_id,type,detail,created_at FROM game_activity
       WHERE expires_at > now() ${mode ? 'AND mode=$2' : ''}
       ORDER BY created_at DESC LIMIT $1`, mode ? [limit, mode] : [limit]
    ));
    const zones = await withDatabase(async client => client.query(
      `SELECT zone_id, COUNT(DISTINCT actor_id)::int AS active_players,
              CASE WHEN COUNT(DISTINCT actor_id) <= 2 THEN 'SURGE'
                   WHEN COUNT(DISTINCT actor_id) <= 5 THEN 'BUSY'
                   ELSE 'NORMAL' END AS state
       FROM game_activity WHERE mode=$1 AND type='PRESENCE' AND expires_at > now()
       GROUP BY zone_id ORDER BY active_players DESC`, [mode || 'STANDARD']));
    return respond(response, 200, { activity: result.rows, zones: zones.rows });
  } catch (error) {
    if (error.code === 'DATABASE_URL_MISSING') return respond(response, 503, { error: 'database_unconfigured' });
    console.error('game activity unavailable', error);
    return respond(response, 503, { error: 'game_activity_unavailable' });
  }
};
