
#!/usr/bin/env node
// E2E pre-check: validate Supabase credentials and required tables
// Usage: node scripts/e2e-precheck.js

const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });
const { createClient } = require('@supabase/supabase-js');

async function fail(msg) {
  console.error('\nâŒ ' + msg + '\n');
  process.exit(1);
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('\nðŸ”Ž E2E Supabase pre-check starting');

  if (!supabaseUrl || !anonKey || !serviceKey) {
    await fail('Missing Supabase secrets. Ensure NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY are set in CI secrets.');
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Check connectivity and required tables
  const requiredTables = ['microstores', 'products', 'user_roles'];
  for (const table of requiredTables) {
    try {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error) {
        console.error(`Table check failed for '${table}':`, error.message || error);
        await fail(`Supabase schema check failed: table '${table}' not accessible. Run migrations/setup-database.js in your environment.`);
      } else {
        console.log(`âœ… Table '${table}' accessible`);
      }
    } catch (err) {
      console.error(`Error checking table '${table}':`, err && (err.message || err));
      await fail('Unable to query Supabase. Verify NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correct and the DB is reachable from runners.');
    }
  }

  // NOTE: Seeded users & roles verification has been moved to a post-seed verification step.
  // Pre-check purpose: verify Supabase connectivity and required tables are present so seeding can run.

  console.log('\nâ„¹ï¸ Seeded test users & roles will be created in the next CI step if missing');

  console.log('\nâœ… Supabase pre-check passed.');
  process.exit(0);
}

main().catch(err => {
  console.error('âŒ Unexpected pre-check failure:', err);
  process.exit(1);
});
#!/usr/bin/env node
// E2E pre-check: validate Supabase credentials and required tables
// Usage: node scripts/e2e-precheck.js

const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });
const { createClient } = require('@supabase/supabase-js');

async function fail(msg) {
  console.error('\n❌ ' + msg + '\n');
  process.exit(1);
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('\n🔎 E2E Supabase pre-check starting');

  if (!supabaseUrl || !anonKey || !serviceKey) {
    await fail('Missing Supabase secrets. Ensure NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY are set in CI secrets.');
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Check connectivity and required tables
  const requiredTables = ['microstores', 'products', 'user_roles'];
  for (const table of requiredTables) {
    try {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error) {
        console.error(`Table check failed for '${table}':`, error.message || error);
        await fail(`Supabase schema check failed: table '${table}' not accessible. Run migrations/setup-database.js in your environment.`);
      } else {
        console.log(`✅ Table '${table}' accessible`);
      }
    } catch (err) {
      console.error(`Error checking table '${table}':`, err && (err.message || err));
      await fail('Unable to query Supabase. Verify NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correct and the DB is reachable from runners.');
    }
  }

  // NOTE: Seeded users & roles verification has been moved to a post-seed verification step.
  // Pre-check purpose: verify Supabase connectivity and required tables are present so seeding can run.

  console.log('\nℹ️ Seeded test users & roles will be created in the next CI step if missing');

  console.log('\n✅ Supabase pre-check passed.');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Unexpected pre-check failure:', err);
  process.exit(1);
});
