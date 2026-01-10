/**
 * Emotional Intelligence API
 * Track and adapt to user emotions
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  detectEmotionFromBehavior, 
  adaptAtmosphereToEmotion,
  recommendChapelForEmotion,
  generateEmotionalMessage,
  type EmotionalState 
} from '@/lib/ai-city/emotional-intelligence';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, behaviorData, currentLocation } = body;
    
    // Detect emotion from behavior
    const emotionalState = detectEmotionFromBehavior(
      behaviorData.timeOnPage || 60,
      behaviorData.clickRate || 0.5,
      behaviorData.scrollSpeed || 50,
      behaviorData.bounceRate || 0.4,
      behaviorData.recentPurchases || []
    );
    
    // Adapt atmosphere
    const baseAtmosphere = currentLocation?.atmosphere || {};
    const adaptedAtmosphere = adaptAtmosphereToEmotion(baseAtmosphere, emotionalState);
    
    // Get recommendations
    const recommendedChapels = recommendChapelForEmotion(emotionalState);
    const emotionalMessage = generateEmotionalMessage(emotionalState);
    
    return NextResponse.json({
      success: true,
      emotionalState,
      adaptedAtmosphere,
      recommendations: {
        chapels: recommendedChapels,
        message: emotionalMessage,
      },
    });
    
  } catch (error: any) {
    console.error('Emotional state API error:', error);
    return NextResponse.json(
      { error: 'Failed to process emotional state', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const emotion = searchParams.get('emotion') as any;
    
    if (!emotion) {
      return NextResponse.json(
        { error: 'Missing emotion parameter' },
        { status: 400 }
      );
    }
    
    const recommendedChapels = recommendChapelForEmotion({
      primary: emotion,
      intensity: 0.7,
      detected_from: 'explicit',
      timestamp: new Date(),
    });
    
    return NextResponse.json({
      success: true,
      emotion,
      recommendedChapels,
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to get recommendations', details: error.message },
      { status: 500 }
    );
  }
}
