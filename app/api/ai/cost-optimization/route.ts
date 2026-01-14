/**
 * AI Cost Optimization API
 * Real-time cost management and optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import { CostOptimizationEngine } from '@/lib/ai/cost-optimization-engine';

export async function GET(request: NextRequest) {
  try {
    const costEngine = CostOptimizationEngine.getInstance();
    const dashboard = await costEngine.getCostDashboard();

    return NextResponse.json({
      success: true,
      data: dashboard,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cost optimization dashboard error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cost data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, optimizationId, budgetLimits } = await request.json();

    const costEngine = CostOptimizationEngine.getInstance();

    if (action === 'execute' && optimizationId) {
      const success = await costEngine.executeOptimization(optimizationId);
      return NextResponse.json({
        success,
        action: 'execute_optimization',
        optimizationId,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'set_budget' && budgetLimits) {
      costEngine.setBudgetLimits(budgetLimits.daily, budgetLimits.monthly);
      return NextResponse.json({
        success: true,
        action: 'set_budget_limits',
        budgetLimits,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action or parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Cost optimization action error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to execute cost action' },
      { status: 500 }
    );
  }
}