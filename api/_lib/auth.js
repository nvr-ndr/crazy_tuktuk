const crypto = require('node:crypto');
const { withDatabase } = require('./db');

function tokenHash(token) { return crypto.createHash('sha256').update(token).digest('hex'); }

async function requireSession(request) {
  const token = request.headers.authorization?.match(/^Bearer ([A-Za-z0-9_-]{32,})$/)?.[1];
  if (!token) return null;
  return withDatabase(async (client) => {
    const result = await client.query(
      `SELECT sessions.agent_id, agents.owner_wallet
       FROM agent_sessions sessions JOIN agents ON agents.id = sessions.agent_id
       WHERE sessions.token_hash = $1 AND sessions.revoked_at IS NULL AND sessions.expires_at > now()`,
      [tokenHash(token)]
    );
    return result.rows[0] || null;
  });
}

module.exports = { requireSession };
