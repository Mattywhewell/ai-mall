/**
 * Temporal Magic API
 * Get current time-based state and recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getCurrentTemporalState,
  adaptAtmosphereToTime,
  getTimeSensitiveRecommendations,
  getSeasonalProducts 
} from '@/lib/ai-city/temporal-magic';

export async function GET(request: NextRequest) {
  try {
    const temporal = getCurrentTemporalState();
    const recommendations = getTimeSensitiveRecommendations(temporal);
    const seasonalProducts = getSeasonalProducts(temporal.season);
    
    return NextResponse.json({
      success: true,
      temporal,
      recommendations,
      seasonalProducts,
      message: `The city breathes in ${temporal.timeOfDay}, under ${temporal.moonPhase} moon`,
    });
    
  } catch (error: any) {
    console.error('Temporal API error:', error);
    return NextResponse.json(
      { error: 'Failed to get temporal state', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { baseAtmosphere } = body;
    
    const temporal = getCurrentTemporalState();
    const adaptedAtmosphere = adaptAtmosphereToTime(baseAtmosphere, temporal);
    
    return NextResponse.json({
      success: true,
      temporal,
      adaptedAtmosphere,
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to adapt atmosphere', details: error.message },
      { status: 500 }
    );
  }
}
