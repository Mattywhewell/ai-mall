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
import { livingCityEngine } from '@/lib/ai-city/living-city-engine';
import { log as ndLog, timeAsync } from '@/lib/server-ndjson';

export async function POST(request: NextRequest) {
  const start = Date.now();
  try {
    const body = await request.json();
    const { job } = body;

    ndLog('info','api_request_start',{route:'world.evolution', job});

    let result;

    switch (job) {
      case 'street-popularity':
        ndLog('info','evolution_job_start',{job});
        result = await timeAsync('updateStreetPopularity', async () => updateStreetPopularity(), { job });
        break;

      case 'evolve-spirits':
        ndLog('info','evolution_job_start',{job});
        result = await timeAsync('evolveAISpirits', async () => evolveAISpirits(), { job });
        break;

      case 'atmospheric-content':
        ndLog('info','evolution_job_start',{job});
        result = await timeAsync('regenerateAtmosphericContent', async () => regenerateAtmosphericContent(), { job });
        break;

      case 'living-city':
        ndLog('info','evolution_job_start',{job});
        await timeAsync('livingCityEngine.start', async () => livingCityEngine.start(), { job });
        result = { status: 'started', message: 'Living City Engine activated' };
        break;

      case 'all':
        ndLog('info','evolution_job_start',{job});
        const results = await Promise.allSettled([
          timeAsync('updateStreetPopularity', async () => updateStreetPopularity(), { job }),
          timeAsync('evolveAISpirits', async () => evolveAISpirits(), { job }),
          timeAsync('regenerateAtmosphericContent', async () => regenerateAtmosphericContent(), { job }),
          timeAsync('aggregateWorldAnalytics', async () => aggregateWorldAnalytics(), { job })
        ]);

        result = {
          streetPopularity: results[0].status === 'fulfilled' ? 'success' : 'failed',
          spiritEvolution: results[1].status === 'fulfilled' ? 'success' : 'failed',
          atmosphericContent: results[2].status === 'fulfilled' ? 'success' : 'failed',
          analytics: results[3].status === 'fulfilled' ? 'success' : 'failed'
        };
        break;

      default:
        ndLog('warn','evolution_invalid_job',{job});
        return NextResponse.json(
          { error: 'Invalid job type. Use: street-popularity, evolve-spirits, atmospheric-content, analytics, or all' },
          { status: 400 }
        );
    }

    ndLog('info','api_request_end',{route:'world.evolution', job, duration_ms: Date.now()-start, status: 200});

    return NextResponse.json({
      success: true,
      job,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    ndLog('error','api_request_failed',{route:'world.evolution', error: String(error)});
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
        'living-city',
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