async function withTransaction(client, work) {
  await client.query('BEGIN');
  try {
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch { /* preserve original failure */ }
    throw error;
  }
}

module.exports = { withTransaction };
const { Client } = require('pg');

function requireDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    const error = new Error('DATABASE_URL is required for the server database layer');
    error.code = 'DATABASE_URL_MISSING';
    throw error;
  }
  return process.env.DATABASE_URL;
}

function createClient() {
  return new Client({ connectionString: requireDatabaseUrl(), keepAlive: true });
}

async function withDatabase(work) {
  const client = createClient();
  await client.connect();
  try {
    return await work(client);
  } finally {
    await client.end();
  }
}

async function trustedNow(client) {
  const result = await client.query('SELECT now() AS now');
  return result.rows[0].now;
}

async function withTransaction(client, work) {
  await client.query('BEGIN');
  try {
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch { /* preserve original failure */ }
    throw error;
  }
}

async function withDatabaseTransaction(work) {
  return withDatabase((client) => withTransaction(client, work));
}

module.exports = {
  requireDatabaseUrl,
  createClient,
  withDatabase,
  trustedNow,
  withTransaction,
  withDatabaseTransaction,
};
