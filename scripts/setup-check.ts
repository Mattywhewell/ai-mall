/**
 * Setup Check Script
 * Verifies all required environment variables and services
 * Run: npm run setup:check
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import * as path from 'path';

// Load .env.local
config({ path: path.join(process.cwd(), '.env.local') });

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
];

const OPTIONAL_ENV_VARS = [
  'NEXT_PUBLIC_SENTRY_DSN',
  'SENTRY_AUTH_TOKEN',
  'STRIPE_CONNECT_CLIENT_ID',
  'UPSTASH_REDIS_REST_URL',
];

async function checkSetup() {
  console.log('🔍 Checking AI Commerce Platform Setup\n');
  console.log('═'.repeat(50));

  let allGood = true;

  // Check required environment variables
  console.log('\n📋 REQUIRED ENVIRONMENT VARIABLES:');
  console.log('─'.repeat(50));
  
  for (const envVar of REQUIRED_ENV_VARS) {
    const value = process.env[envVar];
    const placeholders = ['your_', 'your-', 'REPLACE'];
    const isPlaceholder = placeholders.some(p => value?.includes(p));
    
    if (value && !isPlaceholder && value.length > 10) {
      console.log(`✅ ${envVar}: Set`);
    } else {
      console.log(`❌ ${envVar}: Missing or placeholder`);
      allGood = false;
    }
  }

  // Check optional environment variables
  console.log('\n📋 OPTIONAL ENVIRONMENT VARIABLES:');
  console.log('─'.repeat(50));
  
  for (const envVar of OPTIONAL_ENV_VARS) {
    const value = process.env[envVar];
    const placeholders = ['your_', 'your-', 'REPLACE'];
    const isPlaceholder = placeholders.some(p => value?.includes(p));
    
    if (value && !isPlaceholder && value.length > 10) {
      console.log(`✅ ${envVar}: Set`);
    } else {
      console.log(`⚠️  ${envVar}: Not set (optional)`);
    }
  }

  // Check Supabase connection
  console.log('\n🗄️  DATABASE CONNECTION:');
  console.log('─'.repeat(50));
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase.from('products').select('id').limit(1);
    
    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('⚠️  Database connected, but tables may need migration');
      } else {
        console.log(`❌ Database error: ${error.message}`);
        allGood = false;
      }
    } else {
      console.log('✅ Database connection successful');
    }
  } catch (error) {
    console.log('❌ Failed to connect to database');
    allGood = false;
  }

  // Check for required tables
  console.log('\n📊 REQUIRED TABLES:');
  console.log('─'.repeat(50));
  
  const requiredTables = [
    'products',
    'user_roles',
    'ai_prompt_templates',
    'ai_prompt_versions',
    'audit_logs',
  ];

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    for (const table of requiredTables) {
      const { error } = await supabase.from(table).select('*').limit(1);
      
      if (error) {
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
          console.log(`❌ ${table}: Not found (run migrations)`);
          allGood = false;
        } else {
          console.log(`⚠️  ${table}: Access error (check RLS policies)`);
        }
      } else {
        console.log(`✅ ${table}: Exists`);
      }
    }
  } catch (error) {
    console.log('❌ Failed to check tables');
  }

  // Check OpenAI connection
  console.log('\n🤖 AI SERVICES:');
  console.log('─'.repeat(50));
  
  if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('your_')) {
    console.log('✅ OpenAI API key configured');
    // Note: We don't test the actual connection to avoid unnecessary API calls
  } else {
    console.log('❌ OpenAI API key missing');
    allGood = false;
  }

  // Check Stripe
  console.log('\n💳 PAYMENT SERVICES:');
  console.log('─'.repeat(50));
  
  if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('your_')) {
    console.log('✅ Stripe secret key configured');
  } else {
    console.log('❌ Stripe secret key missing');
    allGood = false;
  }

  if (process.env.STRIPE_WEBHOOK_SECRET && !process.env.STRIPE_WEBHOOK_SECRET.includes('your_')) {
    console.log('✅ Stripe webhook secret configured');
  } else {
    console.log('❌ Stripe webhook secret missing');
    allGood = false;
  }

  // Final summary
  console.log('\n' + '═'.repeat(50));
  console.log('\n📊 SETUP STATUS:\n');
  
  if (allGood) {
    console.log('🎉 ALL REQUIRED CHECKS PASSED!');
    console.log('✅ Your platform is ready for testing!\n');
    console.log('Next steps:');
    console.log('  1. Run: npm run test:email');
    console.log('  2. Run: npm run test:moderation');
    console.log('  3. Visit: http://localhost:3000/admin/system-health\n');
  } else {
    console.log('⚠️  SETUP INCOMPLETE');
    console.log('❌ Please fix the issues above before proceeding.\n');
    console.log('Quick fixes:');
    console.log('  1. Check .env.local for missing values');
    console.log('  2. Run database migrations (COMPLETE_MIGRATION.sql)');
    console.log('  3. Verify Supabase service role key is set\n');
    console.log('See QUICK_START_NOW.md for detailed instructions.\n');
  }

  console.log('═'.repeat(50));
}

checkSetup().catch(console.error);
