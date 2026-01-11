// Setup auto-listing tables and test supplier
// Run with: node setup-auto-listing.js

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

async function setupAutoListing() {
  try {
    console.log('Setting up auto-listing database schema...');

    // Check if suppliers table exists
    console.log('Checking suppliers table...');
    const { data: suppliersData, error: suppliersCheckError } = await supabase
      .from('suppliers')
      .select('id')
      .limit(1);

    if (suppliersCheckError && suppliersCheckError.code === 'PGRST116') {
      console.log('Suppliers table does not exist, creating...');
      // Since we can't use exec_sql, let's try direct insert to test
      console.log('Please run the SQL migrations manually in Supabase dashboard');
    } else {
      console.log('✅ Suppliers table exists');
    }

    // Check if pending_products table exists
    console.log('Checking pending_products table...');
    const { data: pendingData, error: pendingCheckError } = await supabase
      .from('pending_products')
      .select('id')
      .limit(1);

    if (pendingCheckError && pendingCheckError.code === 'PGRST116') {
      console.log('Pending_products table does not exist, creating...');
      console.log('Please run the SQL migrations manually in Supabase dashboard');
    } else {
      console.log('✅ Pending_products table exists');
    }

    // Try to create test supplier
    console.log('Creating or checking test supplier...');
    const { data: existingSupplier, error: supplierCheckError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('email', 'test@cj-dropshipping.com')
      .single();

    let supplierId;
    if (supplierCheckError && supplierCheckError.code === 'PGRST116') {
      // Supplier doesn't exist, create it
      const { data: supplier, error: insertError } = await supabase
        .from('suppliers')
        .insert({
          business_name: 'CJ Dropshipping Test Supplier',
          contact_name: 'Test User',
          email: 'test@cj-dropshipping.com',
          category: 'Electronics',
          status: 'active'
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating test supplier:', insertError);
        return;
      }
      supplierId = supplier.id;
      console.log('✅ Test supplier created with ID:', supplierId);
    } else {
      supplierId = existingSupplier.id;
      console.log('✅ Test supplier already exists with ID:', supplierId);
      console.log('Supplier details:', existingSupplier);
    }

    console.log('Use this supplier_id in your API calls:', supplierId);

  } catch (error) {
    console.error('Setup failed:', error);
  }
}

setupAutoListing();