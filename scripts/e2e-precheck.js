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

  // Verify deterministic E2E users & roles exist (to avoid RBAC flakes)
  try {
    const REQUIRED_TEST_USERS = [
      { email: 'e2e-admin+ci@example.com', role: 'admin' },
      { email: 'e2e-supplier+ci@example.com', role: 'supplier' },
      { email: 'e2e-standard+ci@example.com', role: 'standard' },
    ];

    // list auth users
    const listRes = await supabase.auth.admin.listUsers();
    const authUsers = (listRes && listRes.data && listRes.data.users) || listRes.users || listRes.data || [];

    for (const tu of REQUIRED_TEST_USERS) {
      const found = authUsers.find(u => u && u.email && u.email.toLowerCase() === tu.email.toLowerCase());
      if (!found) {
        await fail(`Seeded test user missing: ${tu.email}. Run scripts/e2e-setup.js in CI or ensure seeded users exist.`);
      }

      const { data: roles, error: roleErr } = await supabase.from('user_roles').select('role').eq('user_id', found.id).limit(1);
      if (roleErr) {
        console.error('Error querying user_roles for', tu.email, roleErr.message || roleErr);
        await fail('Supabase pre-check failed: unable to query user_roles table for seeded users.');
      }
      if (!roles || roles.length === 0) {
        await fail(`Seeded test user ${tu.email} has no entry in user_roles — run scripts/e2e-setup.js to create test roles.`);
      }
      // Optionally validate role value matches expectation (skip strict check for flexibility)
    }

    console.log('\n✅ Seeded test users & roles present');
  } catch (err) {
    await fail('Error verifying seeded test users: ' + (err && (err.message || err)));
  }

  console.log('\n✅ Supabase pre-check passed.');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Unexpected pre-check failure:', err);
  process.exit(1);
});
