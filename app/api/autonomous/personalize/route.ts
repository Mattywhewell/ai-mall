/**
 * API Route: Personalization Engine
 * GET /api/autonomous/personalize?userId=xxx
 */

import { NextResponse } from 'next/server';
import { PersonalizationEngine } from '@/lib/autonomous/personalization-engine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      );
    }

    const profile = await PersonalizationEngine.buildUserProfile(userId);
    const layout = await PersonalizationEngine.personalizeHomepage(userId);
    const suggestedDistricts = await PersonalizationEngine.suggestDistricts(userId);
    const intent = await PersonalizationEngine.predictIntent(userId);

    return NextResponse.json({
      profile: {
        interests: profile.predicted_interests,
        engagement_score: profile.engagement_score,
        next_likely_action: profile.next_likely_action,
      },
      layout,
      suggested_districts: suggestedDistricts,
      predicted_intent: intent,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
