/**
 * Cron Job: Aggregate Analytics (Daily)
 * Processes and summarizes world analytics data
 */

import { NextRequest, NextResponse } from 'next/server';
import { aggregateWorldAnalytics } from '@/lib/ai-city/world-evolution-jobs';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron] Starting daily analytics aggregation...');
    
    await aggregateWorldAnalytics();

    return NextResponse.json({
      success: true,
      message: 'Analytics aggregated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Cron] Error aggregating analytics:', error);
    return NextResponse.json(
      { error: 'Failed to aggregate analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
