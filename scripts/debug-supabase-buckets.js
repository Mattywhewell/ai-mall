// scripts/debug-supabase-buckets.js
// Non-destructive debug helper to list Supabase storage buckets via REST and print detailed response
require('dotenv').config({ path: '.env.local' });

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '') + '/storage/v1/bucket';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

(async () => {
  try {
    console.log('Requesting', url);
    const res = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${key}`, apikey: key } });
    console.log('HTTP status:', res.status, res.statusText);
    const body = await res.text();
    console.log('Body:', body);
    if (!res.ok) process.exit(2);
  } catch (err) {
    console.error('Fetch failed:', err && err.message ? err.message : err);
    process.exit(3);
  }
})();