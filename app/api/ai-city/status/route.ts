/**
 * AI City System Status
 * Check if AI features are enabled and working
 */

import { NextResponse } from 'next/server';
import { getAIStatus, getAIMode } from '@/lib/ai-city/activation-helper';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const aiStatus = getAIStatus();
    const mode = getAIMode();

    // Check database connectivity
    const { data: hallsCount } = await supabase
      .from('halls')
      .select('id', { count: 'exact', head: true });

    const { data: spiritsCount } = await supabase
      .from('ai_spirits')
      .select('id', { count: 'exact', head: true });

    // Check recent analytics
    const { data: recentAnalytics } = await supabase
      .from('world_analytics')
      .select('id')
      .gte('recorded_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1);

    return NextResponse.json({
      status: 'operational',
      mode: mode,
      systems: {
        openAI: {
          enabled: aiStatus.openAI,
          status: aiStatus.openAI ? 'active' : 'static fallback',
          features: aiStatus.openAI ? [
            'Dynamic spirit generation',
            'Atmospheric descriptions',
            'Personalized content',
            'Spirit evolution'
          ] : [
            'Static spirits',
            'Predefined descriptions'
          ]
        },
        backgroundJobs: {
          enabled: aiStatus.cronJobs,
          status: aiStatus.cronJobs ? 'configured' : 'not configured',
          jobs: [
            { name: 'update-world', schedule: 'hourly', path: '/api/cron/update-world' },
            { name: 'evolve-spirits', schedule: 'daily 2am', path: '/api/cron/evolve-spirits' },
            { name: 'regenerate-content', schedule: 'daily 3am', path: '/api/cron/regenerate-content' },
            { name: 'aggregate-analytics', schedule: 'daily 4am', path: '/api/cron/aggregate-analytics' }
          ]
        },
        database: {
          enabled: aiStatus.supabase,
          status: 'connected',
          tables: {
            halls: true,
            streets: true,
            chapels: true,
            ai_spirits: true
          }
        },
        analytics: {
          enabled: true,
          recentActivity: !!recentAnalytics && recentAnalytics.length > 0
        }
      },
      instructions: aiStatus.openAI ? null : {
        toEnableAI: [
          'Get API key from https://platform.openai.com/api-keys',
          'Add to .env.local: OPENAI_API_KEY=your_key_here',
          'Restart development server',
          'AI spirits will generate dynamically'
        ]
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
