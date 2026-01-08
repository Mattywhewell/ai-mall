/**
 * API Route: AI Analytics with NLG
 * GET /api/autonomous/analytics?microstoreId=xxx&period=week
 */

import { NextResponse } from 'next/server';
import { AIAnalytics } from '@/lib/autonomous/ai-analytics';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const microstoreId = searchParams.get('microstoreId');
    const period = (searchParams.get('period') as 'day' | 'week' | 'month') || 'week';

    if (!microstoreId) {
      return NextResponse.json(
        { error: 'microstoreId required' },
        { status: 400 }
      );
    }

    const narrative = await AIAnalytics.generateNarrative(microstoreId, period);
    const anomalies = await AIAnalytics.detectAnomalies(microstoreId);
    const actions = await AIAnalytics.suggestActions(microstoreId);

    return NextResponse.json({
      narrative,
      anomalies,
      suggested_actions: actions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
