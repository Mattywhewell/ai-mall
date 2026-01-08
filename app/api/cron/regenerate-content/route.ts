/**
 * Cron Job: Regenerate Atmospheric Content (Daily)
 * Refreshes AI-generated atmospheric descriptions
 */

import { NextRequest, NextResponse } from 'next/server';
import { regenerateAtmosphericContent } from '@/lib/ai-city/world-evolution-jobs';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron] Starting daily content regeneration...');
    
    await regenerateAtmosphericContent();

    return NextResponse.json({
      success: true,
      message: 'Atmospheric content regenerated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Cron] Error regenerating content:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate content', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
