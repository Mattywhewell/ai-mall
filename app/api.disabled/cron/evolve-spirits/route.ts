/**
 * Cron Job: Evolve AI Spirits (Daily)
 * AI personalities adapt based on user interactions
 */

import { NextRequest, NextResponse } from 'next/server';
import { evolveAISpirits } from '@/lib/ai-city/world-evolution-jobs';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron] Starting daily spirit evolution...');
    
    await evolveAISpirits();

    return NextResponse.json({
      success: true,
      message: 'AI spirits evolved',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Cron] Error evolving spirits:', error);
    return NextResponse.json(
      { error: 'Failed to evolve spirits', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
