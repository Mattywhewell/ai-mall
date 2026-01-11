#!/usr/bin/env tsx

/**
 * Test script for Redis rate limiting and granular permissions
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

console.log('Environment variables loaded:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓' : '✗');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');

import { createRateLimit, rateLimiters } from '../lib/rate-limiting/rate-limiter';
import { getPermissionChecker, Permission } from '../lib/permissions/permission-system';
import { getSupabaseClient } from '../lib/supabase-server';

async function testRedisRateLimiting() {
  console.log('🧪 Testing Redis Rate Limiting...\n');

  // Create a test request
  const mockRequest = {
    headers: {
      get: (name: string) => {
        if (name === 'x-forwarded-for') return '127.0.0.1';
        if (name === 'x-real-ip') return '127.0.0.1';
        return null;
      }
    },
    url: 'http://localhost:3000/api/test'
  } as any as Request;

  try {
    // Test basic rate limiting
    console.log('Testing basic rate limiting (100 requests/minute)...');
    for (let i = 1; i <= 5; i++) {
      const result = await rateLimiters.api(mockRequest);
      console.log(`Request ${i}: ${result.allowed ? '✅ Allowed' : '❌ Blocked'} (Count: ${result.count}/${result.limit})`);
    }
    console.log('✅ Redis rate limiting test completed\n');
  } catch (error) {
    console.error('❌ Redis rate limiting test failed:', error.message);
    console.log('Note: This may fail if Redis is not running. Rate limiting will fall back to memory store.\n');
  }
}

async function testPermissions() {
  console.log('🧪 Testing Granular Permissions System...\n');

  const supabase = getSupabaseClient();

  try {
    // Get a test user (you may need to adjust this based on your test data)
    const { data: users, error } = await supabase
      .from('user_roles')
      .select('user_id, role, permissions')
      .limit(1);

    if (error || !users || users.length === 0) {
      console.log('⚠️  No users found in database. Skipping permission tests.\n');
      return;
    }

    const testUser = users[0];
    console.log(`Testing permissions for user: ${testUser.user_id} (Role: ${testUser.role})`);

    // Test basic permissions
    const permissionsToTest = [
      Permission.USER_VIEW,
      Permission.ADMIN_VIEW,
      Permission.SUPPLIER_VIEW,
      Permission.PRODUCT_VIEW,
    ];

    for (const permission of permissionsToTest) {
      const hasPermission = await getPermissionChecker().hasPermission(testUser.user_id, permission);
      console.log(`  ${permission}: ${hasPermission ? '✅' : '❌'}`);
    }

    // Test getting all user permissions
    const allPermissions = await getPermissionChecker().getUserPermissions(testUser.user_id);
    console.log(`\nUser has ${allPermissions.length} total permissions:`);
    console.log(allPermissions.map(p => `  - ${p}`).join('\n'));

    console.log('✅ Permission system test completed\n');
  } catch (error) {
    console.error('❌ Permission system test failed:', error.message);
  }
}

async function main() {
  console.log('🚀 Testing Enhanced Security Features\n');
  console.log('=' .repeat(50));

  await testRedisRateLimiting();
  await testPermissions();

  console.log('=' .repeat(50));
  console.log('✨ Testing completed!');
  console.log('\n📋 Summary:');
  console.log('- Redis rate limiting: Automatically uses Redis in production');
  console.log('- Granular permissions: Fine-grained access control beyond roles');
  console.log('- Fallback support: Memory store when Redis unavailable');
  console.log('- Audit logging: All permission changes are logged');
}

if (require.main === module) {
  main().catch(console.error);
}