/**
 * Consciousness Layer Migration Runner
 * 
 * Applies the consciousness layer database schema to Supabase.
 * Run with: node scripts/run-consciousness-migration.js
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
  console.log('🌊 Starting Consciousness Layer Migration...\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '../supabase-consciousness-migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log(`📊 File size: ${(migrationSQL.length / 1024).toFixed(2)} KB\n`);

    // Split into individual statements (rough approach)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`🔄 Executing ${statements.length} SQL statements...\n`);

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip comments and empty lines
      if (statement.trim().startsWith('--') || statement.trim() === ';') {
        continue;
      }

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Try direct query if RPC doesn't exist
          const { error: queryError } = await supabase.from('_').select('*').limit(0);
          if (queryError) {
            console.error(`⚠️  Statement ${i + 1} warning: ${error.message.substring(0, 100)}`);
            errorCount++;
          }
        } else {
          successCount++;
          if ((i + 1) % 10 === 0) {
            console.log(`✓ Processed ${i + 1}/${statements.length} statements`);
          }
        }
      } catch (err) {
        console.error(`❌ Error in statement ${i + 1}:`, err.message.substring(0, 100));
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Migration attempt complete!\n');
    console.log(`📊 Results:`);
    console.log(`   - Statements processed: ${statements.length}`);
    console.log(`   - Successful: ${successCount}`);
    console.log(`   - Warnings/Errors: ${errorCount}\n`);

    // Verify tables were created
    console.log('🔍 Verifying table creation...\n');

    const expectedTables = [
      'user_emotional_states',
      'curator_memories',
      'personal_rituals',
      'product_emotional_scores',
      'transformation_journeys',
      'consciousness_analytics',
      'healing_moments'
    ];

    const verificationResults = {};

    for (const tableName of expectedTables) {
      try {
        const { error } = await supabase.from(tableName).select('*').limit(0);
        verificationResults[tableName] = !error;
        console.log(`${!error ? '✅' : '❌'} ${tableName}`);
      } catch (err) {
        verificationResults[tableName] = false;
        console.log(`❌ ${tableName} - ${err.message}`);
      }
    }

    const successfulTables = Object.values(verificationResults).filter(v => v).length;

    console.log('\n' + '='.repeat(60));
    console.log(`📊 Tables created: ${successfulTables}/${expectedTables.length}\n`);

    if (successfulTables === expectedTables.length) {
      console.log('🎉 SUCCESS! Consciousness Layer is fully active!\n');
      console.log('🌊 Emotional Intelligence Engine: READY');
      console.log('👥 AI Curator System: READY');
      console.log('✨ Transformation Journeys: READY');
      console.log('💫 Healing Moments: READY\n');
      console.log('Next steps:');
      console.log('1. Create API endpoints in app/api/consciousness/');
      console.log('2. Add behavioral tracking to frontend');
      console.log('3. Test emotional detection');
      console.log('4. Match users with curators');
      console.log('5. Monitor consciousness analytics dashboard\n');
    } else {
      console.log('⚠️  Some tables may not have been created.');
      console.log('Try running the migration directly in Supabase SQL Editor.');
      console.log('See CONSCIOUSNESS_MIGRATION_GUIDE.md for details.\n');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check your Supabase credentials in .env.local');
    console.error('2. Ensure you have database creation privileges');
    console.error('3. Try running the SQL directly in Supabase dashboard');
    console.error('4. See CONSCIOUSNESS_MIGRATION_GUIDE.md for manual steps\n');
    process.exit(1);
  }
}

// Run migration
runMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
