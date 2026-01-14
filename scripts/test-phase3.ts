/**
 * Test Phase 3 Optimization Systems
 */

import { PerformanceOptimizer } from '../lib/ai/performance-optimizer';
import { AdvancedFineTuningPipeline } from '../lib/ai/advanced-fine-tuning';

async function testPhase3Systems() {
  console.log('🧪 Testing Phase 3 Optimization Systems...');

  try {
    // Test Performance Optimizer
    console.log('Testing Performance Optimizer...');
    const optimizer = PerformanceOptimizer.getInstance();
    const optStatus = optimizer.getOptimizationStatus();
    console.log('✅ Performance Optimizer Status:', optStatus);

    // Test Fine-tuning Pipeline
    console.log('Testing Fine-tuning Pipeline...');
    const fineTuner = AdvancedFineTuningPipeline.getInstance();
    const ftStatus = fineTuner.getPipelineStatus();
    console.log('✅ Fine-tuning Pipeline Status:', ftStatus);

    // Test starting systems
    console.log('Testing system startup...');
    await optimizer.start();
    await fineTuner.start();
    console.log('✅ Systems started successfully');

    console.log('🎉 Phase 3 Optimization Systems Test Complete');

  } catch (error) {
    console.error('❌ Phase 3 test failed:', error);
    process.exit(1);
  }
}

testPhase3Systems();