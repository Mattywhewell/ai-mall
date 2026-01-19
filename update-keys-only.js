#!/usr/bin/env node

/**
 * Quick Key Update Script
 * Updates only the Supabase keys (keeps same project URL)
 * Usage: node update-keys-only.js
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

async function updateKeysOnly() {
  console.log('🔑 Quick Supabase Keys Update');
  console.log('═'.repeat(35));
  console.log('Project URL: https://wmiqtmtjhlpfsjwjvwgl.supabase.co');

  const envPath = path.join(process.cwd(), '.env.local');

  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local file not found!');
    process.exit(1);
  }

  // Read current env file
  let envContent = fs.readFileSync(envPath, 'utf8');

  console.log('\n🔗 From Supabase Dashboard → Settings → API:');
  const newAnonKey = await askQuestion('anon/public key: ');
  const newServiceKey = await askQuestion('service_role key: ');

  if (!newAnonKey || !newServiceKey) {
    console.log('❌ Both keys are required!');
    rl.close();
    process.exit(1);
  }

  // Update only the keys (keep same URL)
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

  console.log('\n✅ Keys updated successfully!');
  console.log('\n🧪 Testing connection...');

  rl.close();

  // Test the connection
  testConnection(newServiceKey);
}

async function testConnection(serviceKey) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient('https://wmiqtmtjhlpfsjwjvwgl.supabase.co', serviceKey);

    const { error } = await supabase.from('products').select('id').limit(1);

    if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
      console.log('❌ Database connection failed:', error.message);
      return;
    }

    console.log('✅ Database connection successful!');
    console.log('\n🚀 Ready to run: npm run dev');

  } catch (error) {
    console.log('❌ Connection test failed:', error.message);
  }
}

updateKeysOnly().catch(console.error);