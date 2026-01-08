/**
 * Test Script: Email Verification Flow
 * Run: npx tsx scripts/test-email-verification.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testEmailVerification() {
  console.log('🧪 Testing Email Verification Flow\n');

  const testEmail = `test+${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  console.log('Step 1: Sign up with new email');
  console.log('Email:', testEmail);
  
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email`,
    },
  });

  if (signUpError) {
    console.error('❌ Sign up failed:', signUpError.message);
    return;
  }

  console.log('✅ Sign up successful');
  console.log('User ID:', signUpData.user?.id);
  console.log('Email confirmed:', signUpData.user?.email_confirmed_at ? 'Yes' : 'No');

  if (!signUpData.user?.email_confirmed_at) {
    console.log('\n📧 Verification email sent!');
    console.log('Check your email and click the verification link.');
    console.log('The link should redirect to: /auth/verify-email');
  }

  console.log('\n✅ Email verification flow test complete!');
  console.log('\n📝 Manual steps:');
  console.log('1. Check email inbox for verification email');
  console.log('2. Click verification link');
  console.log('3. Verify redirect to /auth/verify-email');
  console.log('4. Confirm success message appears');
}

testEmailVerification().catch(console.error);
