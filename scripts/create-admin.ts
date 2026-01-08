/**
 * Create Admin User Script
 * Run: npx tsx scripts/create-admin.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ADMIN_EMAIL = 'mattw321990@gmail.com';

async function createAdmin() {
  console.log('🔐 Setting up admin user...\n');

  // Get user ID using auth admin API
  const { data: { users: authUsers }, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('❌ Error listing users:', listError.message);
    return;
  }

  const adminUser = authUsers?.find((u: any) => u.email === ADMIN_EMAIL);

  if (!adminUser) {
    console.log('❌ User not found!');
    console.log('\n📝 Please sign up first:');
    console.log('   1. Visit: http://localhost:3000');
    console.log('   2. Sign up with: ' + ADMIN_EMAIL);
    console.log('   3. Verify email');
    console.log('   4. Run this script again\n');
    return;
  }

  console.log('✅ User found:', adminUser.email);
  console.log('   User ID:', adminUser.id);

  // Add admin role
  const { error: roleError } = await supabase
    .from('user_roles')
    .insert({
      user_id: adminUser.id,
      role: 'admin',
    })
    .select();

  if (roleError) {
    if (roleError.code === '23505') {
      console.log('✅ User already has admin role');
    } else {
      console.error('❌ Error adding admin role:', roleError.message);
      return;
    }
  } else {
    console.log('✅ Admin role granted successfully!');
  }

  // Verify the role
  const { data: roles, error: verifyError } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', adminUser.id);

  if (verifyError) {
    console.error('❌ Error verifying role:', verifyError.message);
    return;
  }

  console.log('\n✅ Setup complete!');
  console.log('\n👤 Admin Account:');
  console.log('   Email:', ADMIN_EMAIL);
  console.log('   Roles:', roles?.map(r => r.role).join(', '));
  console.log('\n🚀 You can now log in with admin privileges!');
  console.log('   Visit: http://localhost:3000\n');
}

createAdmin().catch(console.error);
