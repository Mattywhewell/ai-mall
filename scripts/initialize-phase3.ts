/**
 * Phase 3 Optimization Initialization
 * Starts all advanced optimization systems
 */

import { PerformanceOptimizer } from '../lib/ai/performance-optimizer';
import { AdvancedFineTuningPipeline } from '../lib/ai/advanced-fine-tuning';

async function initializePhase3Optimizations() {
  console.log('🚀 Initializing Phase 3: Advanced AI Optimization Systems');

  try {
    // Start Performance Optimization Engine
    console.log('⚡ Starting Performance Optimizer...');
    const optimizer = PerformanceOptimizer.getInstance();
    await optimizer.start();

    // Start Advanced Fine-tuning Pipeline
    console.log('🎯 Starting Advanced Fine-tuning Pipeline...');
    const fineTuner = AdvancedFineTuningPipeline.getInstance();
    await fineTuner.start();

    console.log('✅ Phase 3 Optimization Systems Initialized Successfully');
    console.log('📊 Real-time monitoring and optimization is now active');

    // Log initial status
    const optStatus = optimizer.getOptimizationStatus();
    const ftStatus = fineTuner.getPipelineStatus();

    console.log('📈 Optimization Status:', {
      performanceOptimizer: optStatus,
      fineTuningPipeline: ftStatus
    });

  } catch (error) {
    console.error('❌ Failed to initialize Phase 3 optimizations:', error);
    process.exit(1);
  }
}

// Initialize if run directly
if (require.main === module) {
  initializePhase3Optimizations();
}

export { initializePhase3Optimizations };