/**
 * Test script to verify hybrid AI routing integration
 */

import { AIRouter } from '../lib/ai/modelRouter';

async function testRouting() {
  console.log('🧪 Testing Hybrid AI Routing Integration...');

  const router = AIRouter.getInstance();

  try {
    // Test 1: Basic routing
    console.log('Test 1: Basic text generation...');
    const result1 = await router.executeTask({
      id: 'test-basic-1',
      type: 'text_generation',
      content: 'Hello, how are you?',
      temperature: 0.7,
      priority: 'medium'
    });
    console.log('✅ Basic routing works:', result1.substring(0, 50) + '...');

    // Test 2: Analysis task
    console.log('Test 2: Analysis task...');
    const result2 = await router.executeTask({
      id: 'test-analysis-1',
      type: 'analysis',
      content: 'Analyze this product: A red coffee mug that keeps drinks hot.',
      systemPrompt: 'You are a product analyst. Provide a brief analysis.',
      temperature: 0.6,
      priority: 'medium'
    });
    console.log('✅ Analysis routing works:', result2.substring(0, 50) + '...');

    // Test 3: Creative task
    console.log('Test 3: Creative task...');
    const result3 = await router.executeTask({
      id: 'test-creative-1',
      type: 'creative',
      content: 'Write a short product description for a wireless mouse.',
      temperature: 0.8,
      priority: 'medium'
    });
    console.log('✅ Creative routing works:', result3.substring(0, 50) + '...');

    console.log('🎉 All routing tests passed! Hybrid AI integration successful.');

  } catch (error) {
    console.error('❌ Routing test failed:', error);
    process.exit(1);
  }
}

testRouting();