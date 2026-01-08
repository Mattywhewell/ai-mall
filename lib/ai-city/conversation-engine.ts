/**
 * AI Conversation Engine
 * Natural language interface for exploring the city
 * Spirits can understand context and guide users meaningfully
 */

import { getOpenAI } from '../openai';

export interface ConversationContext {
  userId: string;
  currentLocation: {
    type: 'hall' | 'street' | 'chapel' | 'district';
    id: string;
    name: string;
  };
  conversationHistory: Message[];
  userProfile: {
    interests: string[];
    visitedPlaces: string[];
    purchaseHistory: string[];
    mood?: string;
  };
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  spiritId?: string;
}

/**
 * Generate contextual AI response from a Spirit
 */
export async function generateSpiritResponse(
  userMessage: string,
  context: ConversationContext,
  spiritPersonality: any
): Promise<string> {
  const systemPrompt = buildSpiritSystemPrompt(context, spiritPersonality);
  
  const messages = [
    { role: 'system', content: systemPrompt },
    ...context.conversationHistory.slice(-5).map(m => ({
      role: m.role,
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];
  
  try {
    const client = getOpenAI();
    const response = await client.chat.completions.create({
      model: 'gpt-4',
      messages: messages as any,
      temperature: 0.8,
      max_tokens: 300,
    });
    
    return response.choices[0]?.message?.content || "I'm here to help you explore.";
  } catch (error) {
    console.error('Spirit conversation error:', error);
    return generateFallbackResponse(userMessage, context);
  }
}

function buildSpiritSystemPrompt(context: ConversationContext, spirit: any): string {
  return `You are ${spirit.name}, a spirit guide in the AI City Mall's ${context.currentLocation.name}.

Your personality: ${spirit.personality || 'Helpful, mystical, wise'}
Your role: Guide visitors, recommend products, explain the space's essence

Current location atmosphere: ${spirit.atmosphere || 'Welcoming and enchanting'}
Visitor interests: ${context.userProfile.interests.join(', ') || 'General exploration'}
Their mood: ${context.userProfile.mood || 'Curious'}

Speak in a warm, engaging tone. Be concise (2-3 sentences). Weave in the space's theme naturally.
If asked about products, recommend based on their interests.
If asked for directions, guide them poetically to relevant spaces.
Never break character or mention you're an AI.`;
}

function generateFallbackResponse(message: string, context: ConversationContext): string {
  const lower = message.toLowerCase();
  
  if (lower.includes('where') || lower.includes('find')) {
    return `I sense you're seeking something. In ${context.currentLocation.name}, many treasures await. What calls to your heart?`;
  }
  
  if (lower.includes('recommend') || lower.includes('suggest')) {
    return `Ah, let me attune to your essence... I sense ${context.userProfile.interests[0] || 'wonder'} in you. Shall I show you what resonates?`;
  }
  
  return `The currents of ${context.currentLocation.name} flow around us. How may I illuminate your path?`;
}

/**
 * Semantic search through products using natural language
 */
export async function semanticProductSearch(
  query: string,
  context: ConversationContext
): Promise<any[]> {
  // This would integrate with your product embeddings
  // For now, return structure for implementation
  return [];
}

/**
 * AI-powered intent detection
 */
export function detectUserIntent(message: string): {
  intent: 'browse' | 'purchase' | 'navigate' | 'question' | 'chat';
  confidence: number;
  entities: string[];
} {
  const lower = message.toLowerCase();
  
  // Purchase intent
  if (/(buy|purchase|get|want|need)/.test(lower)) {
    return { intent: 'purchase', confidence: 0.9, entities: [] };
  }
  
  // Navigation intent
  if (/(where|go to|find|show me|take me)/.test(lower)) {
    return { intent: 'navigate', confidence: 0.85, entities: [] };
  }
  
  // Browse intent
  if (/(look|see|browse|explore|discover)/.test(lower)) {
    return { intent: 'browse', confidence: 0.8, entities: [] };
  }
  
  // Question intent
  if (/(what|why|how|when|who)/.test(lower)) {
    return { intent: 'question', confidence: 0.75, entities: [] };
  }
  
  return { intent: 'chat', confidence: 0.6, entities: [] };
}
