/**
 * API Route: Self-Healing System
 * GET /api/autonomous/health - Run health check
 */

import { NextResponse } from 'next/server';
import { SelfHealingSystem } from '@/lib/autonomous/self-healing';

export async function GET() {
  try {
    const issues = await SelfHealingSystem.runHealthCheck();

    const critical = issues.filter(i => i.severity === 'critical');
    const autoFixed = issues.filter(i => i.auto_fixed);
    const remaining = issues.filter(i => !i.auto_fixed);

    return NextResponse.json({
      total_issues: issues.length,
      critical_issues: critical.length,
      auto_fixed: autoFixed.length,
      remaining: remaining.length,
      issues: issues.map(i => ({
        id: i.id,
        type: i.type,
        severity: i.severity,
        description: i.description,
        auto_fixed: i.auto_fixed,
        fix_applied: i.fix_applied,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
