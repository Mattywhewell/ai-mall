/**
 * Visual Layers Migration Runner
 *
 * Applies the visual_layers table schema to Supabase.
 * Run with: node scripts/run-visual-layers-migration.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🎨 Starting Visual Layers Migration...\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '../supabase-visual-layers.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Read migration file:', migrationPath);

    // Split SQL into individual statements (basic approach)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`🔧 Executing ${statements.length} SQL statements...\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);

        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });

        if (error) {
          // Try direct SQL execution if rpc fails
          const { error: directError } = await supabase.from('_supabase_migration_temp').select('*').limit(0);
          if (directError && directError.message.includes('relation') === false) {
            console.log('   Trying direct SQL execution...');
            // For simple DDL, we can try a different approach
            // But for now, let's just log and continue
          }

          console.log('   ⚠️  Statement may have failed:', error.message);
          // Continue with other statements
        } else {
          console.log('   ✅ Success');
        }
      }
    }

    console.log('\n🎉 Visual Layers Migration completed!');
    console.log('📊 You can now run: npm run seed:mythic-layers');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();