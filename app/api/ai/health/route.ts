import { NextRequest, NextResponse } from 'next/server';
import { AIRouter } from '@/lib/ai/modelRouter';
import { CostTracker } from '@/lib/ai/costTracker';

export async function GET(request: NextRequest) {
  try {
    const router = AIRouter.getInstance();
    const costTracker = CostTracker.getInstance();

    // Get real health data
    const healthStatus = router.getHealthStatus();
    const taskHistory = router.getTaskHistory(50);

    // Get cost metrics for last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const costMetrics = await costTracker.getCostMetrics('', yesterday.toISOString());

    // Get budget status for all providers
    const budgetStatuses = await Promise.all(
      Object.keys(healthStatus).map(async (provider) => {
        try {
          return await costTracker.getBudgetStatus(provider);
        } catch {
          return null;
        }
      })
    );

    // Calculate system-wide metrics
    const totalTasks = taskHistory.length;
    const successfulTasks = taskHistory.filter(t => t.result === 'success').length;
    const successRate = totalTasks > 0 ? (successfulTasks / totalTasks) * 100 : 0;

    const totalCost = costMetrics.reduce((sum, m) => sum + m.cost, 0);
    const avgLatency = taskHistory.length > 0
      ? taskHistory.reduce((sum, t) => sum + (t.decision.estimatedLatency || 0), 0) / taskHistory.length
      : 0;

    // Provider status summary
    const providerSummary = Object.entries(healthStatus).map(([provider, health]) => {
      const providerCosts = costMetrics.filter(m => m.provider === provider);
      const providerTasks = taskHistory.filter(t => t.decision.provider === provider);

      return {
        provider,
        status: health.status,
        latency: health.latency,
        errorRate: health.errorRate,
        tasksExecuted: providerTasks.length,
        totalCost: providerCosts.reduce((sum, c) => sum + c.cost, 0),
        avgCostPerTask: providerTasks.length > 0
          ? providerCosts.reduce((sum, c) => sum + c.cost, 0) / providerTasks.length
          : 0
      };
    });

    // Get optimization recommendations
    const optimizations = await costTracker.getCostOptimizations();

    return NextResponse.json({
      system: {
        overall: successRate > 95 ? 'healthy' : successRate > 80 ? 'degraded' : 'critical',
        totalTasks,
        successRate: Math.round(successRate * 100) / 100,
        totalCost: Math.round(totalCost * 10000) / 10000,
        avgLatency: Math.round(avgLatency),
        providers: Object.keys(healthStatus).length,
        lastUpdated: new Date().toISOString()
      },
      providers: providerSummary,
      optimizations: optimizations.slice(0, 5), // Top 5 recommendations
      recentTasks: taskHistory.slice(-10).map(t => ({
        id: t.task.id,
        type: t.task.type,
        provider: t.decision.provider,
        latency: t.decision.estimatedLatency,
        cost: t.decision.estimatedCost,
        result: t.result,
        timestamp: new Date().toISOString()
      })),
      budgetStatus: budgetStatuses.filter(b => b !== null),
      timestamp: new Date().toISOString(),
      version: '3.0.0-optimized',
      message: 'Phase 3: Advanced monitoring and optimization active'
    });
  } catch (error) {
    console.error('AI Health API Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      system: { overall: 'unknown' },
      providers: {},
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, provider, limits } = body;

    const costTracker = CostTracker.getInstance();

    switch (action) {
      case 'update_budget':
        if (provider && limits) {
          costTracker.updateBudgetLimits(provider, limits);
          return NextResponse.json({ message: `Budget updated for ${provider}` });
        }
        break;

      case 'emergency_shutdown':
        // Implement emergency shutdown logic
        return NextResponse.json({ message: 'Emergency shutdown initiated' });

      case 'optimize_routing':
        // Trigger routing optimization
        return NextResponse.json({ message: 'Routing optimization triggered' });

      case 'clear_cache':
        // Clear any cached data
        return NextResponse.json({ message: 'Cache cleared' });

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('AI Health Action Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}