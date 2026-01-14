/**
 * AI Scaling Dashboard API
 * Real-time scaling metrics and recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { AIScalingManager } from '@/lib/ai/scaling-manager';

export async function GET(request: NextRequest) {
  try {
    const scalingManager = AIScalingManager.getInstance();
    const dashboard = await scalingManager.getScalingDashboard();

    return NextResponse.json({
      success: true,
      data: dashboard,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Scaling dashboard error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scaling data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, target } = await request.json();

    if (!action || !target) {
      return NextResponse.json(
        { success: false, error: 'Missing action or target' },
        { status: 400 }
      );
    }

    const scalingManager = AIScalingManager.getInstance();
    const recommendations = await scalingManager.evaluateScalingNeeds();

    // Find matching recommendation
    const recommendation = recommendations.find(r =>
      r.action === action && r.target === target
    );

    if (!recommendation) {
      return NextResponse.json(
        { success: false, error: 'No matching scaling recommendation found' },
        { status: 404 }
      );
    }

    // Execute the scaling action
    const success = await scalingManager.executeScalingAction(recommendation);

    return NextResponse.json({
      success,
      action: recommendation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Scaling action error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to execute scaling action' },
      { status: 500 }
    );
  }
}