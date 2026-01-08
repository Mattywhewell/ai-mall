/**
 * API Route: Control Autonomous Systems
 * GET /api/autonomous/status - Get system status
 * POST /api/autonomous/start - Start job runner
 * POST /api/autonomous/stop - Stop job runner
 * POST /api/autonomous/optimize - Run one-time optimization
 */

import { NextResponse } from 'next/server';
import { AutonomousCore } from '@/lib/autonomous/core';
import { AutonomousJobRunner } from '@/lib/autonomous/job-runner';

export async function GET() {
  try {
    const core = AutonomousCore.getInstance();
    const runnerStatus = AutonomousJobRunner.getStatus();

    return NextResponse.json({
      core: {
        isRunning: core['isRunning'],
        learningCycleActive: true,
      },
      runner: runnerStatus,
      insights: [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'start':
        await AutonomousJobRunner.start();
        return NextResponse.json({ message: 'Job runner started' });

      case 'stop':
        AutonomousJobRunner.stop();
        return NextResponse.json({ message: 'Job runner stopped' });

      case 'optimize':
        await AutonomousJobRunner.runOptimization();
        return NextResponse.json({ message: 'Optimization complete' });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
