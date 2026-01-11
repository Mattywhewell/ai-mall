// Check pending products
// Run with: node check-pending.js

const fs = require('fs');
const path = require('path');

// Load .env.local manually
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
  console.error('Could not load .env.local');
}

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkPending() {
  try {
    console.log('Checking pending products...');

    const { data: pendingProducts, error } = await supabase
      .from('pending_products')
      .select('*')
      .eq('supplier_id', '49065e12-57d0-449f-a6d3-54862b859cf2')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching pending products:', error);
    } else {
      console.log(`Found ${pendingProducts.length} pending products:`);
      pendingProducts.forEach((product, index) => {
        console.log(`${index + 1}. ID: ${product.id}`);
        console.log(`   Status: ${product.status}`);
        console.log(`   Source URL: ${product.source_url}`);
        console.log(`   Created: ${product.created_at}`);
        console.log(`   Extracted data:`, JSON.stringify(product.extracted_data, null, 2));
        console.log('---');
      });
    }

  } catch (error) {
    console.error('Check failed:', error);
  }
}

checkPending();