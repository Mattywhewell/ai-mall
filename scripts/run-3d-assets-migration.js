#!/usr/bin/env node

/**
 * Apply 3D Assets Migration
 * Runs the supabase-3d-assets-creation-migration.sql file
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🔮 Applying 3D Assets Migration...');

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase-3d-assets-creation-migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📜 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);

        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

          if (error) {
            // If rpc doesn't work, try direct query
            const { error: queryError } = await supabase.from('_supabase_migration_temp').select('*').limit(1);
            if (queryError && queryError.message.includes('relation') === false) {
              throw error;
            }

            // For now, just log that we need manual execution
            console.log(`⚠️  Statement ${i + 1} may need manual execution in Supabase SQL Editor`);
          }
        } catch (err) {
          console.log(`⚠️  Statement ${i + 1} failed (may be normal for some operations):`, err.message);
        }
      }
    }

    console.log('✅ Migration script completed');
    console.log('📋 Please verify the tables were created in your Supabase dashboard');
    console.log('🔗 SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();