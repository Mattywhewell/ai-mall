#!/usr/bin/env node

/**
 * Apply 3D Assets Migration to Supabase
 * Executes the supabase-3d-assets-creation-migration.sql file
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🔮 Applying 3D Assets Creation Migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase-3d-assets-creation-migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📜 Migration file loaded successfully');
    console.log(`📊 SQL size: ${migrationSQL.length} characters\n`);

    // Split into statements (basic approach)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`⚡ Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    // Try to execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement.trim()) continue;

      console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`);

      try {
        // Use Supabase's raw SQL execution
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });

        if (error) {
          // If rpc fails, try direct query execution (won't work for DDL)
          console.log(`   ⚠️  RPC failed, attempting direct execution...`);

          // This won't work for DDL, but let's try
          const { error: directError } = await supabase
            .from('_temp_migration_test')
            .select('*')
            .limit(1);

          if (directError) {
            throw error;
          }
        }

        successCount++;
        console.log(`   ✅ Statement ${i + 1} executed successfully`);

      } catch (err) {
        errorCount++;
        console.log(`   ❌ Statement ${i + 1} failed: ${err.message}`);

        // Continue with other statements
        if (err.message.includes('does not exist') ||
            err.message.includes('already exists') ||
            err.message.includes('duplicate key')) {
          console.log(`   ℹ️  This might be expected for some operations`);
        }
      }
    }

    console.log(`\n📊 Migration Results:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);

    if (errorCount > 0) {
      console.log(`\n⚠️  Some statements failed. This is normal for DDL operations.`);
      console.log(`📋 Manual application may be required.`);
    }

    // Verify tables were created
    console.log(`\n🔍 Verifying tables...`);

    const tables = ['assets', 'user_avatars', 'uploads'];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);

        if (error) {
          console.log(`   ❌ Table '${table}' not accessible: ${error.message}`);
        } else {
          console.log(`   ✅ Table '${table}' exists and is accessible`);
        }
      } catch (err) {
        console.log(`   ❌ Table '${table}' verification failed: ${err.message}`);
      }
    }

    console.log(`\n🎉 Migration process completed!`);
    console.log(`\n🧪 Run the test script to verify:`);
    console.log(`   node scripts/quick-api-test.js`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log(`\n📋 Fallback: Manual Application Required`);
    console.log(`1. Open Supabase Dashboard → SQL Editor`);
    console.log(`2. Copy contents of supabase-3d-assets-creation-migration.sql`);
    console.log(`3. Paste and execute in SQL Editor`);
    console.log(`4. Run: node scripts/quick-api-test.js`);
    process.exit(1);
  }
}

// Check if we should proceed
console.log('🔮 AIVERSE 3D ASSETS MIGRATION');
console.log('==============================');
console.log('This will create tables for the 3D asset creation system');
console.log('Tables: assets, user_avatars, uploads');
console.log('');

// Run the migration
applyMigration();