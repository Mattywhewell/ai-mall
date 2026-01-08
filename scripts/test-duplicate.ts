/**
 * Test Script: Duplicate Detection
 * Run: npx tsx scripts/test-duplicate.ts
 */

import { DuplicateDetector } from '../lib/services/duplicate-detection';

async function testDuplicateDetection() {
  console.log('🧪 Testing Duplicate Detection Service\n');
  
  const detector = new DuplicateDetector();

  // Test product data
  const testProduct = {
    title: 'Apple iPhone 15 Pro Max',
    description: 'Latest flagship smartphone with A17 Pro chip, 256GB storage, Titanium Blue',
    price: 1199.99,
    category: 'Electronics',
    supplier_id: '00000000-0000-0000-0000-000000000000', // Replace with real UUID
  };

  console.log('Test Product:', testProduct);
  console.log('\nChecking for duplicates...\n');

  const result = await detector.checkDuplicate(testProduct);

  console.log('Result:', {
    is_duplicate: result.is_duplicate,
    similarity_score: result.similarity_score,
    duplicate_product_id: result.duplicate_product_id,
    reason: result.reason,
  });

  if (result.is_duplicate) {
    console.log('\n⚠️ Duplicate detected!');
    console.log(`Similar to: ${result.duplicate_product_title}`);
    console.log(`Similarity: ${(result.similarity_score * 100).toFixed(2)}%`);
  } else {
    console.log('\n✅ No duplicates found - product is unique');
  }

  console.log('\n✅ Duplicate detection test complete!');
}

testDuplicateDetection().catch(console.error);
