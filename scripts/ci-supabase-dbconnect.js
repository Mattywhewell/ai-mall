#!/usr/bin/env node
// Simple SSL-enabled Postgres connection test for CI
const { Client } = require('pg');
const url = process.env.SUPABASE_DATABASE_URL;
if (!url) {
  console.error('SUPABASE_DATABASE_URL not set');
  process.exit(2);
}
console.log('Attempting to connect using SUPABASE_DATABASE_URL...');
(async () => {
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false }, statement_timeout: 5000 });
  try {
    await client.connect();
    console.log('CONNECTED to Postgres');
    const res = await client.query('SELECT version() AS v, current_setting($1) AS ssl', ['ssl']);
    console.log('Query result:', res.rows[0]);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('PG_CONNECT_ERROR:', err.message);
    console.error(err);
    try { await client.end(); } catch (e) {}
    process.exit(3);
  }
})();
