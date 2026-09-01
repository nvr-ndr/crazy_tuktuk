const { randomUUID } = require('node:crypto');
const { Client } = require('pg');

const wallet = '35acCvwWQpqhHNBmrZ1TcvgrzAHBx9rPzH86GFaZ8hpf';
const rows = [
  ['3W9SWNJw3FLgth3MN6GbKcxDSqacfSwWaEbxgaUcHuvNozN8SZqM1iZeszxxkiWvLpneqnH9Vc5JjETBQ7LDnWhv', '264628'],
  ['2euxVBnW3hQrQFBgki7ji2yNm76nMrzoDAxC7iBTyRwjwdWokWLgHFFUKWB3ivbejPDa34cj4PFoLy6Ve5LcCCrT', '264675'],
];

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query('INSERT INTO standard_players (wallet_address) VALUES ($1) ON CONFLICT (wallet_address) DO UPDATE SET last_seen_at=now()', [wallet]);
    for (const [signature, outputAmountRaw] of rows) {
      await client.query(`INSERT INTO standard_transactions
        (id, player_wallet, environment, input_mint, output_mint, input_amount_raw,
         output_amount_raw, transaction_signature, platform_fee_bps, platform_fee_mode,
         platform_fee_account, status, submitted_at, confirmed_at, backfilled)
        VALUES ($1, $2, 'PRODUCTION_TEST', $3, $4, $5, $6, $7, 80, 'outputMint', NULL,
                'CONFIRMED', now(), now(), true)
        ON CONFLICT (transaction_signature) DO NOTHING`, [
        randomUUID(), wallet,
        'So11111111111111111111111111111111111111112',
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        '2500000', outputAmountRaw, signature,
      ]);
    }
    await client.query('COMMIT');
    console.log(`Backfilled ${rows.length} confirmed Standard swaps; no game results created.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
