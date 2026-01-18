#!/usr/bin/env node

/**
 * CI Supabase Diagnostic
 * Usage: node scripts/ci-supabase-diagnostic.js
 * Exits with non-zero status if table access or admin API calls fail.
 */

const { createClient } = require('@supabase/supabase-js');

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('🔎 Running Supabase diagnostic...');

  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Check table access
  try {
    console.log('\n• Checking table access (microstores)');
    const { data, error } = await supabase.from('microstores').select('id').limit(1);

    if (error) {
      console.error('\n❌ Table check failed for "microstores":', error.message || error);
      console.error('\n💡 HINT: This can indicate a wrong project URL/key or missing schema (run migrations/setup-database.js)');
      process.exit(1);
    }

    console.log('✅ Table access OK (microstores) — found', Array.isArray(data) ? data.length : 'unknown', 'rows');
  } catch (err) {
    console.error('\n❌ Unexpected error checking tables:', err.message || err);
    process.exit(1);
  }

  // Check admin auth API
  try {
    console.log('\n• Checking Auth admin API (listUsers)');
    const { data, error } = await supabase.auth.admin.listUsers({ per_page: 1 });

    if (error) {
      console.error('\n❌ Auth admin.listUsers failed:', error.message || error);
      console.error('\n💡 HINT: Ensure the SUPABASE_SERVICE_ROLE_KEY is valid and has access to Auth admin APIs');
      process.exit(1);
    }

    const userCountStr = data?.users ? `${data.users.length} user(s) returned` : 'no users returned';
    console.log('✅ Auth admin API OK —', userCountStr);
  } catch (err) {
    console.error('\n❌ Unexpected error calling auth admin API:', err.message || err);
    process.exit(1);
  }

  console.log('\n🎉 Supabase diagnostic passed!');
  process.exit(0);
}

run();
