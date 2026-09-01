const { Client } = require('pg');
(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const result = await client.query(`SELECT
    (SELECT count(*) FROM standard_players) AS players,
    (SELECT count(*) FROM standard_transactions WHERE backfilled) AS backfilled,
    (SELECT count(*) FROM standard_game_results) AS results,
    (SELECT count(*) FROM standard_daily_reward_awards) AS awards`);
  console.log(JSON.stringify(result.rows[0]));
  await client.end();
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
