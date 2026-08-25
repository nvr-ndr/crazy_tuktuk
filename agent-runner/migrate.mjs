import { readFile } from 'node:fs/promises';
import pg from 'pg';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for migrations.');

const schema = await readFile(new URL('./db/schema.sql', import.meta.url), 'utf8');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(schema);
  console.log('Crazy Tuk Agent Runner schema applied.');
} finally {
  await client.end();
}
