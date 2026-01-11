/**
 * Cron Job: Update World (Hourly)
 * Updates street popularity scores based on recent analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateStreetPopularity } from '@/lib/ai-city/world-evolution-jobs';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron] Starting hourly world update...');
    
    await updateStreetPopularity();

    return NextResponse.json({
      success: true,
      message: 'Street popularity updated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Cron] Error updating world:', error);
    return NextResponse.json(
      { error: 'Failed to update world', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
