#!/usr/bin/env node

/**
 * Database Setup Script
 * Run this after updating Supabase keys to set up all tables
 * Usage: node setup-database.js
 */

const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  console.log('🗄️  Setting up AI Mall Database');
  console.log('═'.repeat(40));

  // Load environment variables
  require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.log('❌ Supabase credentials not found in .env.local');
    console.log('   Please run: node update-supabase-keys.js first');
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

  // List of SQL files to run in order
  const sqlFiles = [
    'supabase-complete-schema.sql',
    'supabase-complete-migration.sql',
    'supabase-v5.1-schema-fixed.sql',
    'world-architecture-schema.sql',
    'supabase-exec-sql.sql',
    'supabase-auth-fixes.sql',
    'supabase-rbac-fix-functions.sql',
    '3d-generation-schema.sql'
  ];

  console.log('\n📄 Running database migrations...');

  // Prepare optional direct PG client fallback if a DATABASE URL is provided
  const pgUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
  let pgClient = null;
  if (pgUrl) {
    pgClient = new Client({ connectionString: pgUrl });
    try {
      await pgClient.connect();
      console.log('🔒 Connected to DB via SUPABASE_DATABASE_URL fallback');
    } catch (err) {
      console.log('⚠️  Could not connect using SUPABASE_DATABASE_URL:', err.message);
      pgClient = null;
    }
  }

  for (const sqlFile of sqlFiles) {
    const sqlPath = path.join(process.cwd(), sqlFile);

    if (!fs.existsSync(sqlPath)) {
      console.log(`⚠️  Skipping ${sqlFile} (file not found)`);
      continue;
    }

    console.log(`\n📋 Running ${sqlFile}...`);

    try {
      const sql = fs.readFileSync(sqlPath, 'utf8');

      // Split SQL into individual statements
      const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

      for (const statement of statements) {
        if (!statement.trim()) continue;

        // Try to run via exec_sql RPC
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

        if (error) {
          console.log(`⚠️  Statement failed via RPC: ${error.message}`);

          // If exec_sql is not available in the schema cache, try direct PG fallback
          if (error.message && error.message.includes('Could not find the function public.exec_sql')) {
            if (pgClient) {
              try {
                await pgClient.query(statement + ';');
                console.log('✅ Statement executed via direct PG fallback');
              } catch (pgErr) {
                console.log('❌ Direct PG execution failed:', pgErr.message);
              }
            } else {
              console.log('⚠️  exec_sql is missing and no SUPABASE_DATABASE_URL is configured.');
              console.log('    To enable bootstrap execution, set SUPABASE_DATABASE_URL in this environment to a Postgres connection string (trusted secret).');
            }
          } else {
            // Other RPC error; log and continue
            console.log('    (non-bootstrap error, continuing)');
          }
        }
      }

      console.log(`✅ ${sqlFile} completed`);

    } catch (error) {
      console.log(`❌ Error running ${sqlFile}:`, error.message);
    }
  }

  if (pgClient) {
    try {
      await pgClient.end();
    } catch (err) {
      // ignore
    }
  }

  // Verify setup
  console.log('\n🔍 Verifying database setup...');

  const tablesToCheck = [
    'products', 'microstores', 'users', 'shopping_agents',
    'halls', 'streets', 'chapels', 'ai_spirits',
    'user_world_views', 'world_analytics'
  ];

  for (const table of tablesToCheck) {
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

  console.log('\n🎉 Database setup complete!');
  console.log('\n🚀 You can now run: npm run dev');
}

setupDatabase().catch(console.error);