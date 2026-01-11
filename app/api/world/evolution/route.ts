/**
 * World Evolution API Endpoint
 * Manually triggers background jobs that make the city feel alive
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  updateStreetPopularity,
  evolveAISpirits,
  regenerateAtmosphericContent,
  aggregateWorldAnalytics
} from '@/lib/ai-city/world-evolution-jobs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { job } = body;

    let result;

    switch (job) {
      case 'street-popularity':
        console.log('[Evolution API] Running street popularity update...');
        result = await updateStreetPopularity();
        break;

      case 'evolve-spirits':
        console.log('[Evolution API] Evolving AI spirits...');
        result = await evolveAISpirits();
        break;

      case 'atmospheric-content':
        console.log('[Evolution API] Regenerating atmospheric content...');
        result = await regenerateAtmosphericContent();
        break;

      case 'analytics':
        console.log('[Evolution API] Aggregating world analytics...');
        result = await aggregateWorldAnalytics();
        break;

      case 'all':
        console.log('[Evolution API] Running all evolution jobs...');
        const results = await Promise.allSettled([
          updateStreetPopularity(),
          evolveAISpirits(),
          regenerateAtmosphericContent(),
          aggregateWorldAnalytics()
        ]);

        result = {
          streetPopularity: results[0].status === 'fulfilled' ? 'success' : 'failed',
          spiritEvolution: results[1].status === 'fulfilled' ? 'success' : 'failed',
          atmosphericContent: results[2].status === 'fulfilled' ? 'success' : 'failed',
          analytics: results[3].status === 'fulfilled' ? 'success' : 'failed'
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid job type. Use: street-popularity, evolve-spirits, atmospheric-content, analytics, or all' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      job,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Evolution API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return status of last evolution runs
    const { searchParams } = new URL(request.url);
    const job = searchParams.get('job');

    if (job) {
      // TODO: Implement job status tracking
      return NextResponse.json({
        job,
        status: 'unknown',
        lastRun: null,
        message: 'Job status tracking not yet implemented'
      });
    }

    // Return general evolution status
    return NextResponse.json({
      status: 'evolution_system_active',
      availableJobs: [
        'street-popularity',
        'evolve-spirits',
        'atmospheric-content',
        'analytics',
        'all'
      ],
      message: 'World evolution system is ready. Use POST to trigger jobs.'
    });

  } catch (error) {
    console.error('Evolution status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}