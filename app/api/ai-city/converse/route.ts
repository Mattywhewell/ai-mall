/**
 * AI City Conversation API
 * Talk to AI Spirits naturally
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateSpiritResponse, detectUserIntent, type ConversationContext } from '@/lib/ai-city/conversation-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId, location, spiritId } = body;
    
    if (!message || !userId || !location) {
      return NextResponse.json(
        { error: 'Missing required fields: message, userId, location' },
        { status: 400 }
      );
    }
    
    // Build conversation context (in production, fetch from DB)
    const context: ConversationContext = {
      userId,
      currentLocation: location,
      conversationHistory: [],
      userProfile: {
        interests: ['wellness', 'craft', 'innovation'],
        visitedPlaces: [],
        purchaseHistory: [],
        mood: 'curious',
      },
    };
    
    // Detect intent
    const intent = detectUserIntent(message);
    
    // Get spirit personality (in production, fetch from DB)
    const spiritPersonality = {
      name: location.name,
      personality: 'Wise, warm, poetic',
      atmosphere: 'Mystical and welcoming',
    };
    
    // Generate response
    const response = await generateSpiritResponse(message, context, spiritPersonality);
    
    return NextResponse.json({
      success: true,
      response,
      intent,
      spiritId,
      context: {
        location: location.name,
        detectedMood: context.userProfile.mood,
      },
    });
    
  } catch (error: any) {
    console.error('Conversation API error:', error);
    return NextResponse.json(
      { error: 'Failed to process conversation', details: error.message },
      { status: 500 }
    );
  }
}
