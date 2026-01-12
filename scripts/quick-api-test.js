#!/usr/bin/env node

/**
 * Quick API Test for 3D Assets System
 * Tests endpoints on deployed Vercel instance
 */

async function testEndpoints() {
  const baseUrl = 'https://ai-mall.vercel.app';

  console.log('🧪 Testing 3D Assets API Endpoints on Vercel...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    if (healthResponse.ok) {
      console.log('   ✅ Health endpoint working');
    } else {
      console.log(`   ❌ Health endpoint failed: ${healthResponse.status} ${healthResponse.statusText}`);
      return;
    }

    // Test 2: Admin assets
    console.log('2. Testing admin assets endpoint...');
    const assetsResponse = await fetch(`${baseUrl}/api/admin/assets`);
    if (assetsResponse.ok) {
      const data = await assetsResponse.json();
      console.log('   ✅ Admin assets endpoint working');
      console.log(`   📊 Found ${data.assets?.length || 0} assets`);
    } else {
      console.log(`   ❌ Admin assets endpoint failed: ${assetsResponse.status} ${assetsResponse.statusText}`);
    }

    // Test 3: User avatar
    console.log('3. Testing user avatar endpoint...');
    const avatarResponse = await fetch(`${baseUrl}/api/user/avatar`);
    if (avatarResponse.ok) {
      console.log('   ✅ User avatar endpoint working');
    } else {
      console.log(`   ❌ User avatar endpoint failed: ${avatarResponse.status} ${avatarResponse.statusText}`);
    }

    // Test 4: Admin upload image (without file)
    console.log('4. Testing admin upload validation...');
    const uploadResponse = await fetch(`${baseUrl}/api/admin/upload-image`, {
      method: 'POST',
      body: new FormData()
    });
    if (!uploadResponse.ok) {
      console.log('   ✅ Upload validation working (expected error for empty request)');
    } else {
      console.log('   ⚠️  Upload validation not working as expected');
    }

    console.log('\n🎉 API endpoints are responding on Vercel!');
    console.log('\n📋 Next: Test the UI workflow on the deployed site');
    console.log('1. Visit: https://ai-mall.vercel.app/admin/assets');
    console.log('2. Visit: https://ai-mall.vercel.app/profile/avatar');
    console.log('3. Upload images to test the full workflow');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the Vercel deployment is active');
  }
}

testEndpoints();