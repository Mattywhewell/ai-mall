#!/usr/bin/env node
// Verify seeded E2E users & roles exist
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });
const { createClient } = require('@supabase/supabase-js');

async function fail(msg) {
  console.error('\nERROR: ' + msg + '\n');
  process.exit(1);
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    await fail('Missing Supabase secrets. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in CI secrets.');
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  console.log('\nVerifying seeded test users & roles');

  const REQUIRED_TEST_USERS = [
    { email: 'e2e-admin+ci@example.com', role: 'admin' },
    { email: 'e2e-supplier+ci@example.com', role: 'supplier' },
    { email: 'e2e-standard+ci@example.com', role: 'standard' },
  ];

  try {
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
        await fail('Verification failed: unable to query user_roles table for seeded users.');
      }
      if (!roles || roles.length === 0) {
        await fail(`Seeded test user ${tu.email} has no entry in user_roles â€” run scripts/e2e-setup.js to create test roles.`);
      }

      console.log(`Verified seeded user ${tu.email}`);
    }

    console.log('\nSeed verification passed.');
    process.exit(0);
  } catch (err) {
    await fail('Error verifying seeded test users: ' + (err && (err.message || err)));
  }
}

main().catch(err => {
  console.error('Unexpected verification failure:', err);
  process.exit(1);
});
