/**
 * Phase 3 Status Dashboard
 * Comprehensive view of all optimization systems
 */

import { NextRequest, NextResponse } from 'next/server';
import { PerformanceOptimizer } from '@/lib/ai/performance-optimizer';
import { AdvancedFineTuningPipeline } from '@/lib/ai/advanced-fine-tuning';
import { AIRouter } from '@/lib/ai/modelRouter';
import { CostTracker } from '@/lib/ai/costTracker';

export async function GET(request: NextRequest) {
  try {
    const optimizer = PerformanceOptimizer.getInstance();
    const fineTuner = AdvancedFineTuningPipeline.getInstance();
    const router = AIRouter.getInstance();
    const costTracker = CostTracker.getInstance();

    // Get all system statuses
    const optStatus = optimizer.getOptimizationStatus();
    const ftStatus = fineTuner.getPipelineStatus();
    const healthStatus = router.getHealthStatus();
    const taskHistory = router.getTaskHistory(100);

    // Get cost optimizations
    const costOptimizations = await costTracker.getCostOptimizations();

    // Calculate Phase 3 metrics
    const phase3Metrics = {
      optimizationUptime: optStatus.isRunning ? 'Active' : 'Inactive',
      fineTuningUptime: ftStatus.isRunning ? 'Active' : 'Inactive',
      activeOptimizations: optStatus.activeRules,
      totalOptimizations: optStatus.totalRules,
      fineTuningJobs: ftStatus.totalJobs,
      completedJobs: ftStatus.completedJobs,
      providersOptimized: Object.keys(healthStatus).length,
      costSavings: costOptimizations.reduce((sum, opt) => sum + (opt.efficiency * 0.01), 0), // Estimated
      avgImprovement: costOptimizations.length > 0
        ? costOptimizations.reduce((sum, opt) => sum + opt.successRate, 0) / costOptimizations.length
        : 0
    };

    // Get recent optimization activities
    const recentActivities = [
      ...taskHistory.slice(0, 10).map(t => ({
        type: 'task_execution',
        description: `${t.task.type} task via ${t.decision.provider}`,
        timestamp: new Date().toISOString(),
        status: t.result
      })),
      ...Array.from(fineTuner.getJobHistory(5)).map(job => ({
        type: 'fine_tuning',
        description: `Fine-tuning job ${job.id} for ${job.taskType}`,
        timestamp: job.createdAt,
        status: job.status
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      phase: 'Phase 3: Advanced Optimization',
      status: 'active',
      timestamp: new Date().toISOString(),
      metrics: phase3Metrics,
      systems: {
        performanceOptimizer: optStatus,
        fineTuningPipeline: ftStatus,
        aiRouter: {
          providers: Object.keys(healthStatus).length,
          totalTasks: taskHistory.length,
          healthyProviders: Object.values(healthStatus).filter(h => h.status === 'healthy').length
        },
        costTracker: {
          optimizations: costOptimizations.length,
          totalSavings: phase3Metrics.costSavings
        }
      },
      recentActivities: recentActivities.slice(0, 20),
      recommendations: generatePhase3Recommendations(phase3Metrics, costOptimizations),
      version: '3.0.0-optimization-complete'
    });
  } catch (error) {
    console.error('Phase 3 Status API Error:', error);
    return NextResponse.json({
      phase: 'Phase 3: Advanced Optimization',
      status: 'error',
      error: 'Failed to load optimization status',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

function generatePhase3Recommendations(metrics: any, optimizations: any[]): string[] {
  const recommendations: string[] = [];

  if (metrics.optimizationUptime !== 'Active') {
    recommendations.push('Start the Performance Optimizer to enable real-time routing optimization');
  }

  if (metrics.fineTuningUptime !== 'Active') {
    recommendations.push('Initialize the Fine-tuning Pipeline for automatic model improvement');
  }

  if (metrics.activeOptimizations < metrics.totalOptimizations * 0.5) {
    recommendations.push('Review optimization rules - many rules are not triggering');
  }

  if (metrics.completedJobs === 0) {
    recommendations.push('Monitor fine-tuning pipeline - no jobs have completed yet');
  }

  if (optimizations.length > 0) {
    const avgEfficiency = optimizations.reduce((sum, opt) => sum + opt.efficiency, 0) / optimizations.length;
    if (avgEfficiency < 0.5) {
      recommendations.push('Consider switching to more cost-effective providers');
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('All Phase 3 systems are operating optimally');
  }

  return recommendations;
}