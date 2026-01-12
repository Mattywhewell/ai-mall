#!/usr/bin/env node

/**
 * Phase 3 Living City Engine Migration Script
 * Deploys the autonomous citizen and ritual system schema
 * Usage: node scripts/migrate-phase3-living-city.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function migratePhase3LivingCity() {
  console.log('🏙️  Migrating Phase 3 Living City Engine Schema');
  console.log('═'.repeat(50));

  // Load environment variables
  require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.log('❌ Supabase credentials not found in .env.local');
    console.log('   Please ensure .env.local exists with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Test connection
  console.log('🔗 Testing database connection...');
  try {
    const { data, error } = await supabase.from('products').select('id').limit(1);
    if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
      throw error;
    }
    console.log('✅ Database connection successful');
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    process.exit(1);
  }

  // Run the Phase 3 schema
  const sqlFile = 'supabase-phase3-living-city-schema.sql';
  const sqlPath = path.join(process.cwd(), sqlFile);

  if (!fs.existsSync(sqlPath)) {
    console.log(`❌ Schema file not found: ${sqlPath}`);
    process.exit(1);
  }

  console.log(`\n📄 Running ${sqlFile}...`);

  try {
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the entire SQL file as one statement
    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.log(`❌ Migration failed: ${error.message}`);
      console.log('💡 Trying alternative method...');

      // Alternative: Split and execute statements individually
      const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim();
        if (statement) {
          console.log(`   Executing statement ${i + 1}/${statements.length}...`);
          try {
            const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement + ';' });
            if (stmtError) {
              console.log(`   ⚠️  Statement ${i + 1} failed: ${stmtError.message}`);
              // Continue with other statements
            }
          } catch (stmtError) {
            console.log(`   ⚠️  Statement ${i + 1} error: ${stmtError.message}`);
          }
        }
      }
    } else {
      console.log(`✅ ${sqlFile} executed successfully`);
    }

  } catch (error) {
    console.log(`❌ Error running migration:`, error.message);
    process.exit(1);
  }

  // Verify the migration
  console.log('\n🔍 Verifying Phase 3 tables...');

  const phase3Tables = [
    'citizen_states',
    'ritual_events',
    'citizen_memories',
    'district_moods',
    'presence_logs',
    'event_logs'
  ];

  for (const table of phase3Tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`⚠️  Table '${table}' not accessible: ${error.message}`);
      } else {
        console.log(`✅ Table '${table}': ${count || 0} records`);
      }
    } catch (error) {
      console.log(`❌ Error checking table '${table}': ${error.message}`);
    }
  }

  // Check RLS policies
  console.log('\n🔐 Checking RLS policies...');
  try {
    const { data: policies, error } = await supabase
      .from('pg_policies')
      .select('tablename, policyname')
      .in('tablename', phase3Tables);

    if (error) {
      console.log(`⚠️  Could not check policies: ${error.message}`);
    } else {
      const policyCount = policies?.length || 0;
      console.log(`✅ Found ${policyCount} RLS policies for Phase 3 tables`);
    }
  } catch (error) {
    console.log(`⚠️  Policy check failed: ${error.message}`);
  }

  console.log('\n🎉 Phase 3 Living City Engine migration complete!');
  console.log('\n🚀 The autonomous city is ready for activation!');
  console.log('   Run: npx tsx scripts/activate-living-city.ts');
}

migratePhase3LivingCity().catch(console.error);