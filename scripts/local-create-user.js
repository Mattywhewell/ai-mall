#!/usr/bin/env node

// Local diagnostic: create and immediately delete a test user via admin API
// Usage: node scripts/local-create-user.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

(async () => {
  const email = `diag+ci-${Date.now()}@example.com`;
  const password = 'TestPass123!';
  console.log('Attempting to create user', email);
  try {
    const res = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
    console.log('createUser result:', JSON.stringify(res, null, 2));

    if (res.data && res.data.user) {
      const userId = res.data.user.id;
      console.log('Created user id', userId, '- now deleting');
      const del = await supabase.auth.admin.deleteUser(userId);
      console.log('delete result:', JSON.stringify(del, null, 2));
    }
  } catch (err) {
    console.error('Exception calling createUser:', err);
    process.exit(1);
  }
})();
