import { NextRequest, NextResponse } from 'next/server';
import {
  updateStreetPopularity,
  evolveAISpirits,
  regenerateAtmosphericContent,
  aggregateWorldAnalytics,
  runWorldEvolutionJobs
} from '@/lib/ai-city/world-evolution-jobs';

export async function POST(request: NextRequest) {
  try {
    const { job } = await request.json();

    console.log(`[World Evolution API] Running job: ${job || 'all'}`);

    switch (job) {
      case 'street-popularity':
        await updateStreetPopularity();
        return NextResponse.json({ 
          success: true, 
          message: 'Street popularity updated' 
        });

      case 'evolve-spirits':
        await evolveAISpirits();
        return NextResponse.json({ 
          success: true, 
          message: 'AI spirits evolved' 
        });

      case 'atmospheric-content':
        await regenerateAtmosphericContent();
        return NextResponse.json({ 
          success: true, 
          message: 'Atmospheric content regenerated' 
        });

      case 'analytics':
        await aggregateWorldAnalytics();
        return NextResponse.json({ 
          success: true, 
          message: 'Analytics aggregated' 
        });

      case 'all':
      default:
        await runWorldEvolutionJobs();
        return NextResponse.json({ 
          success: true, 
          message: 'All world evolution jobs completed' 
        });
    }
  } catch (error) {
    console.error('[World Evolution API] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    availableJobs: [
      { name: 'all', description: 'Run all world evolution jobs' },
      { name: 'street-popularity', description: 'Update street popularity scores' },
      { name: 'evolve-spirits', description: 'Evolve AI spirit personalities' },
      { name: 'atmospheric-content', description: 'Regenerate atmospheric content' },
      { name: 'analytics', description: 'Aggregate world analytics' }
    ],
    usage: 'POST with { "job": "job-name" }'
  });
}
