import { NextRequest, NextResponse } from 'next/server';
import { AutonomousCore } from '@/lib/autonomous/core';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'ai-city-evolution-2026';

    if (!authHeader || !authHeader.includes(cronSecret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🌍 Starting world update cycle...');

    // Initialize autonomous core if not already running
    const core = AutonomousCore.getInstance();
    await core.start();

    // Update world metrics
    const { data: worldMetrics, error: metricsError } = await supabase
      .from('world_metrics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (metricsError) {
      console.error('Error fetching world metrics:', metricsError);
    }

    // Process learning signals
    await core.processLearningSignals();

    // Update district evolution
    const { data: districts, error: districtsError } = await supabase
      .from('microstores')
      .select('*');

    if (!districtsError && districts) {
      for (const district of districts) {
        // Trigger district evolution based on performance
        const evolutionScore = Math.random() * 100; // In real implementation, calculate from analytics

        if (evolutionScore > 70) {
          console.log(`🏛️ Evolving district: ${district.name}`);
          // Update district atmosphere or theme
          await supabase
            .from('microstores')
            .update({
              updated_at: new Date().toISOString()
            })
            .eq('id', district.id);
        }
      }
    }

    // Update world state
    const worldUpdate = {
      last_update: new Date().toISOString(),
      active_districts: districts?.length || 0,
      evolution_cycles: (worldMetrics?.[0]?.evolution_cycles || 0) + 1,
      consciousness_level: Math.min(100, (worldMetrics?.[0]?.consciousness_level || 0) + Math.random() * 5)
    };

    await supabase
      .from('world_metrics')
      .upsert(worldUpdate);

    console.log('✅ World update cycle completed');

    return NextResponse.json({
      success: true,
      message: 'World updated successfully',
      metrics: worldUpdate
    });

  } catch (error) {
    console.error('❌ World update failed:', error);
    return NextResponse.json(
      { error: 'World update failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'World Update Cron Endpoint',
    schedule: 'Every 3 hours',
    description: 'Updates world state, processes learning signals, and evolves districts'
  });
}