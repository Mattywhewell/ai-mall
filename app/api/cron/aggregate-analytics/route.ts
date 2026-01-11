import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'ai-city-evolution-2026';

    if (!authHeader || !authHeader.includes(cronSecret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('📊 Starting analytics aggregation cycle...');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Aggregate daily analytics
    const { data: dailyEvents, error: eventsError } = await supabase
      .from('analytics')
      .select('*')
      .gte('created_at', `${yesterdayStr}T00:00:00.000Z`)
      .lt('created_at', `${yesterdayStr}T23:59:59.999Z`);

    if (eventsError) {
      console.error('Error fetching analytics:', eventsError);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    // Calculate aggregated metrics
    const totalEvents = dailyEvents?.length || 0;
    const eventTypes = dailyEvents?.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const topProducts = dailyEvents?.reduce((acc, event) => {
      if (event.product_id) {
        acc[event.product_id] = (acc[event.product_id] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>) || {};

    const topDistricts = dailyEvents?.reduce((acc, event) => {
      if (event.microstore_id) {
        acc[event.microstore_id] = (acc[event.microstore_id] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>) || {};

    // Create aggregated analytics record
    const aggregatedData = {
      date: yesterdayStr,
      total_events: totalEvents,
      event_breakdown: eventTypes,
      top_products: Object.entries(topProducts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([product_id, count]) => ({ product_id, count })),
      top_districts: Object.entries(topDistricts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([district_id, count]) => ({ district_id, count })),
      conversion_rate: totalEvents > 0 ?
        ((eventTypes.purchase || 0) / totalEvents) * 100 : 0,
      engagement_rate: totalEvents > 0 ?
        ((eventTypes.view || 0) + (eventTypes.click || 0)) / totalEvents : 0,
      created_at: new Date().toISOString()
    };

    // Upsert aggregated analytics
    const { error: upsertError } = await supabase
      .from('daily_analytics')
      .upsert(aggregatedData, { onConflict: 'date' });

    if (upsertError) {
      console.error('Error upserting analytics:', upsertError);
      return NextResponse.json({ error: 'Failed to save analytics' }, { status: 500 });
    }

    // Update consciousness metrics if they exist
    const consciousnessMetrics = {
      date: yesterdayStr,
      emotional_resonance: aggregatedData.conversion_rate * 0.8 + aggregatedData.engagement_rate * 0.2,
      community_engagement: Object.keys(topDistricts).length,
      ai_interaction_quality: Math.min(100, totalEvents / 10), // Scale based on activity
      transformation_indicators: (eventTypes.purchase || 0) / Math.max(totalEvents * 0.1, 1),
      created_at: new Date().toISOString()
    };

    await supabase
      .from('consciousness_metrics')
      .upsert(consciousnessMetrics, { onConflict: 'date' });

    console.log(`✅ Analytics aggregation completed for ${yesterdayStr}. Processed ${totalEvents} events.`);

    return NextResponse.json({
      success: true,
      message: 'Analytics aggregation completed',
      date: yesterdayStr,
      total_events: totalEvents,
      metrics: aggregatedData
    });

  } catch (error) {
    console.error('❌ Analytics aggregation failed:', error);
    return NextResponse.json(
      { error: 'Analytics aggregation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Analytics Aggregation Cron Endpoint',
    schedule: 'Every 2 hours',
    description: 'Aggregates daily analytics data and calculates consciousness metrics'
  });
}