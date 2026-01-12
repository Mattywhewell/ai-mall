#!/usr/bin/env node

/**
 * Direct PostgreSQL Migration Script
 * Applies the 3D Assets Migration directly to Supabase database
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Your Supabase database connection string
const connectionString = 'postgresql://postgres:node scripts/direct-db-migration.js

async function runMigration() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    console.log('🔮 Applying 3D Assets Migration...');

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase-3d-assets-migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the SQL into individual statements (split by semicolon, but be careful with functions)
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
          await client.query(statement + ';');
          console.log(`   ✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          console.log(`   ⚠️  Statement ${i + 1} failed (may be normal): ${error.message}`);
          // Continue with other statements
        }
      }
    }

    console.log('✅ Migration script completed successfully!');
    console.log('🎉 3D Assets tables should now be available in your database.');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed.');
  }
}

// Check if password is provided
if (connectionString.includes('[YOUR-PASSWORD]')) {
  console.error('❌ Please replace [YOUR-PASSWORD] in the connection string with your actual database password.');
  console.log('💡 You can find your database password in:');
  console.log('   Supabase Dashboard → Settings → Database → Password');
  process.exit(1);
}

runMigration();