#!/usr/bin/env node

/**
 * Update Supabase Keys Script
 * Run this after creating a new Supabase project
 * Usage: node update-supabase-keys.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function updateEnvFile() {
  console.log('🔑 Supabase Keys Update Tool');
  console.log('═'.repeat(40));

  const envPath = path.join(process.cwd(), '.env.local');

  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local file not found!');
    process.exit(1);
  }

  console.log('📝 Current .env.local file found');

  // Read current env file
  let envContent = fs.readFileSync(envPath, 'utf8');

  // Ask for new values
  console.log('\n🔗 Enter your new Supabase project details:');
  const newUrl = await askQuestion('Supabase Project URL: ');
  const newAnonKey = await askQuestion('Supabase Anon/Public Key: ');
  const newServiceKey = await askQuestion('Supabase Service Role Key: ');

  if (!newUrl || !newAnonKey || !newServiceKey) {
    console.log('❌ All fields are required!');
    rl.close();
    process.exit(1);
  }

  // Update the values
  envContent = envContent.replace(
    /NEXT_PUBLIC_SUPABASE_URL=.*/,
    `NEXT_PUBLIC_SUPABASE_URL=${newUrl}`
  );

  envContent = envContent.replace(
    /NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${newAnonKey}`
  );

  envContent = envContent.replace(
    /SUPABASE_SERVICE_ROLE_KEY=.*/,
    `SUPABASE_SERVICE_ROLE_KEY=${newServiceKey}`
  );

  // Write back to file
  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ Environment variables updated successfully!');
  console.log('\n🧪 Testing new configuration...');

  rl.close();

  // Test the connection
  testConnection(newUrl, newServiceKey);
}

async function testConnection(url, serviceKey) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(url, serviceKey);

    const { data, error } = await supabase.from('products').select('id').limit(1);

    if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
      console.log('❌ Database connection failed:', error.message);
      return;
    }

    console.log('✅ Database connection successful!');
    console.log('\n🚀 You can now run: npm run dev');

  } catch (error) {
    console.log('❌ Connection test failed:', error.message);
  }
}

updateEnvFile().catch(console.error);