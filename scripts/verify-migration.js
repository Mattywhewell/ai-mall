#!/usr/bin/env node

/**
 * Database Verification Script
 * Tests if the 3D Assets tables were created successfully
 */

const { createClient } = require('@supabase/supabase-js');

// Use the production Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wmiqtmtjhlpfsjwjvwgl.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyTables() {
  console.log('🔍 Verifying 3D Assets Database Tables...\n');

  const tables = [
    'admin_assets',
    'user_3d_avatars',
    'asset_generation_jobs'
  ];

  for (const table of tables) {
    try {
      console.log(`📋 Checking table: ${table}`);
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`   ❌ Error accessing ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table} table exists and is accessible`);
        console.log(`   📊 Current records: ${data ? data.length : 0}`);
      }
    } catch (error) {
      console.log(`   ❌ Error accessing ${table}: ${error.message}`);
    }
    console.log('');
  }

  // Test user avatar column
  try {
    console.log('👤 Checking users table avatar_model_url column...');
    const { data, error } = await supabase
      .from('users')
      .select('id, avatar_model_url')
      .limit(1);

    if (error) {
      console.log(`   ❌ Error accessing users table: ${error.message}`);
    } else {
      console.log(`   ✅ users table has avatar_model_url column`);
    }
  } catch (error) {
    console.log(`   ❌ Error accessing users table: ${error.message}`);
  }

  console.log('\n🎉 Database verification complete!');
}

verifyTables().catch(console.error);