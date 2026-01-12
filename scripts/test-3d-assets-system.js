#!/usr/bin/env node

/**
 * Test 3D Assets System
 * Verifies that the 3D asset creation system is working end-to-end
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabaseTables() {
  console.log('🔍 Checking database tables...');

  try {
    // Test assets table
    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .select('id')
      .limit(1);

    if (assetsError) {
      console.log('❌ Assets table not found. Please run the migration in Supabase SQL Editor.');
      console.log('📄 Migration file: supabase-3d-assets-creation-migration.sql');
      return false;
    }
    console.log('✅ Assets table exists');

    // Test user_avatars table
    const { data: avatars, error: avatarsError } = await supabase
      .from('user_avatars')
      .select('id')
      .limit(1);

    if (avatarsError) {
      console.log('❌ User avatars table not found. Please run the migration in Supabase SQL Editor.');
      return false;
    }
    console.log('✅ User avatars table exists');

    // Test uploads table
    const { data: uploads, error: uploadsError } = await supabase
      .from('uploads')
      .select('id')
      .limit(1);

    if (uploadsError) {
      console.log('❌ Uploads table not found. Please run the migration in Supabase SQL Editor.');
      return false;
    }
    console.log('✅ Uploads table exists');

    return true;

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    return false;
  }
}

async function testAPIEndpoints() {
  console.log('\n🌐 Testing API endpoints...');

  const baseUrl = 'http://localhost:3000';

  try {
    // Test health endpoint
    console.log('🏥 Testing health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    if (!healthResponse.ok) {
      console.log('❌ Health endpoint failed');
      return false;
    }
    console.log('✅ Health endpoint working');

    // Test admin assets endpoint
    console.log('🎨 Testing admin assets endpoint...');
    const assetsResponse = await fetch(`${baseUrl}/api/admin/assets`);
    if (!assetsResponse.ok) {
      console.log('❌ Admin assets endpoint failed');
      return false;
    }
    console.log('✅ Admin assets endpoint working');

    // Test user avatar endpoint
    console.log('👤 Testing user avatar endpoint...');
    const avatarResponse = await fetch(`${baseUrl}/api/user/avatar`);
    if (!avatarResponse.ok) {
      console.log('❌ User avatar endpoint failed');
      return false;
    }
    console.log('✅ User avatar endpoint working');

    return true;

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing 3D Assets Creation System\n');

  const dbReady = await testDatabaseTables();
  if (!dbReady) {
    console.log('\n📋 To apply the migration:');
    console.log('1. Open your Supabase project dashboard');
    console.log('2. Go to SQL Editor');
    console.log('3. Copy and paste the contents of supabase-3d-assets-creation-migration.sql');
    console.log('4. Run the SQL');
    console.log('5. Re-run this test script');
    return;
  }

  const apiReady = await testAPIEndpoints();
  if (!apiReady) {
    console.log('\n❌ API endpoints are not responding. Make sure the dev server is running:');
    console.log('npm run dev');
    return;
  }

  console.log('\n🎉 All tests passed! The 3D Assets System is ready.');
  console.log('\n📖 Next steps:');
  console.log('1. Visit http://localhost:3000/admin/assets to test the Mythic Forge');
  console.log('2. Visit http://localhost:3000/profile/avatar to test avatar generation');
  console.log('3. Upload an image in the admin forge to generate a 3D model');
  console.log('4. Upload a selfie in the avatar page to generate your avatar');
}

runTests().catch(console.error);