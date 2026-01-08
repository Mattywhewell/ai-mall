/**
 * Test Script: Content Moderation
 * Run: npx tsx scripts/test-moderation.ts
 */

import { ContentModerator } from '../lib/services/content-moderation';

async function testModeration() {
  console.log('🧪 Testing Content Moderation Service\n');
  
  const moderator = new ContentModerator();

  // Test 1: Safe content
  console.log('Test 1: Safe Content');
  const safeResult = await moderator.moderateText('This is a great product for sale.');
  console.log('Result:', safeResult);
  console.log('✅ Expected: Safe\n');

  // Test 2: Inappropriate content
  console.log('Test 2: Inappropriate Content');
  const unsafeResult = await moderator.moderateText('Violent and inappropriate content here');
  console.log('Result:', unsafeResult);
  console.log('⚠️ Expected: Flagged\n');

  // Test 3: Product moderation
  console.log('Test 3: Product Moderation');
  const productResult = await moderator.moderateProduct({
    title: 'iPhone 15 Pro',
    description: 'Brand new iPhone 15 Pro in excellent condition',
    images: [], // Add real image URLs to test
  });
  console.log('Result:', productResult);
  console.log('✅ Expected: Safe\n');

  console.log('✅ Moderation tests complete!');
}

testModeration().catch(console.error);
