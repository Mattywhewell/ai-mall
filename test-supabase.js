// Test Supabase connection
// Run with: node test-supabase.js

// Load .env.local manually
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.join(__dirname, '.env.local');
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
} catch (err) {
  // .env.local not found or can't be read
}

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Supabase connection...\n');
console.log('URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
console.log('Key:', supabaseAnonKey ? '✓ Set' : '✗ Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('\n❌ Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('\nTesting database connection...');
    
    // Try to fetch microstores
    const { data, error } = await supabase
      .from('microstores')
      .select('*')
      .limit(1);

    if (error) {
      console.error('\n❌ Database Error:');
      console.error('Message:', error.message);
      console.error('Details:', error.details);
      console.error('Hint:', error.hint);
      console.error('Code:', error.code);
      
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        console.log('\n💡 Solution: Run the SQL from supabase-seed.sql in your Supabase SQL Editor');
      } else if (error.code === 'PGRST301') {
        console.log('\n💡 Solution: Enable Row Level Security policies (see SETUP.md)');
      }
      
      process.exit(1);
    }

    console.log('\n✅ Connection successful!');
    console.log('Found', data?.length || 0, 'microstore(s)');
    
    if (data && data.length > 0) {
      console.log('\nFirst microstore:', JSON.stringify(data[0], null, 2));
    } else {
      console.log('\n⚠️  No data found. Run supabase-seed.sql to add sample data.');
    }
    
  } catch (err) {
    console.error('\n❌ Unexpected Error:');
    console.error(err);
    process.exit(1);
  }
}

testConnection();
