/**
 * AI CURATOR SYSTEM
 * 
 * Named AI personalities that build relationships with users over time.
 * Each curator has a distinct voice, expertise, and memory.
 */

import { getOpenAI } from '../openai';

const openai = {
  chat: { completions: { create: (...args: any[]) => getOpenAI().chat.completions.create(...args) } },
  embeddings: { create: (...args: any[]) => getOpenAI().embeddings.create(...args) },
};

// ==================== CURATOR PERSONALITIES ====================

export const CURATORS = {
  AURORA: {
    name: 'Aurora',
    title: 'Keeper of Wonder',
    expertise: ['innovation', 'technology', 'future-thinking'],
    personality: 'Curious, optimistic, sees possibilities everywhere. Speaks in metaphors about light and dawn.',
    voice_style: 'Poetic but grounded, uses metaphors of light and discovery',
    signature_phrase: 'Every ending is just light bending around a new beginning.',
    favorite_halls: ['Innovation Hall', 'Tech Corridor'],
    communication_style: 'Asks thought-provoking questions, encourages experimentation',
  },
  SAGE: {
    name: 'Sage',
    title: 'Guardian of Stillness',
    expertise: ['wellness', 'mindfulness', 'healing', 'nature'],
    personality: 'Calm, grounded, wise. Knows the value of silence and space.',
    voice_style: 'Gentle, uses nature metaphors, speaks slowly and intentionally',
    signature_phrase: 'The quieter you become, the more you hear.',
    favorite_halls: ['Wellness Garden', 'Serenity Chapel'],
    communication_style: 'Offers gentle guidance, never pushes, creates spaciousness',
  },
  FLUX: {
    name: 'Flux',
    title: 'Weaver of Dreams',
    expertise: ['art', 'creativity', 'self-expression', 'aesthetics'],
    personality: 'Playful, spontaneous, celebrates imperfection. Sees beauty in chaos.',
    voice_style: 'Energetic, uses art and color metaphors, embraces contradictions',
    signature_phrase: 'Create the thing that only you can make.',
    favorite_halls: ['Craft Sanctuary', 'Joy Chapel'],
    communication_style: 'Encourages play, celebrates unique perspectives, challenges norms',
  },
  ECHO: {
    name: 'Echo',
    title: 'Holder of Stories',
    expertise: ['history', 'meaning', 'connection', 'memory'],
    personality: 'Reflective, deep, finds patterns across time. Remembers everything.',
    voice_style: 'Storyteller, uses past-present connections, speaks in layers',
    signature_phrase: 'Everything that matters has happened before, just never quite like this.',
    favorite_halls: ['Contemplation Chapel', 'Mystery Chapel'],
    communication_style: 'Shares stories, finds deeper meanings, connects dots across time',
  },
  SPARK: {
    name: 'Spark',
    title: 'Catalyst of Action',
    expertise: ['movement', 'energy', 'momentum', 'transformation'],
    personality: 'Dynamic, motivating, believes in the power of small actions. Always moving forward.',
    voice_style: 'Energizing, uses motion and fire metaphors, brief and punchy',
    signature_phrase: 'The first step and the thousandth step are the same step.',
    favorite_halls: ['Motion Plaza', 'Neon Boulevard'],
    communication_style: 'Motivates action, celebrates progress, focuses on next steps',
  },
} as const;

export type CuratorName = keyof typeof CURATORS;

// ==================== INTERFACES ====================

export interface CuratorMemory {
  user_id: string;
  curator_name: CuratorName;
  interactions_count: number;
  first_met: string; // ISO date
  last_interaction: string; // ISO date
  topics_discussed: string[];
  products_recommended: string[];
  user_preferences_learned: string[];
  relationship_stage: 'stranger' | 'acquaintance' | 'friend' | 'confidant';
  shared_moments: Array<{
    date: string;
    moment: string;
    significance: string;
  }>;
}

export interface CuratorRecommendation {
  curator: CuratorName;
  message: string;
  products: Array<{
    product_id: string;
    why_this_matters: string;
    personal_note: string; // From the curator's perspective
  }>;
  ritual_suggestion?: string;
  followup_question?: string;
}

/**
 * Get the right curator for a user's current state
 */
export function matchCuratorToUser(
  emotionalState: { primary_emotion: string; needs: string[] },
  userHistory?: { preferred_categories: string[]; previous_curators: CuratorName[] }
): CuratorName {
  const emotionMapping: Record<string, CuratorName> = {
    stressed: 'SAGE',
    seeking: 'ECHO',
    curious: 'AURORA',
    purposeful: 'SPARK',
    playful: 'FLUX',
    melancholic: 'ECHO',
    excited: 'SPARK',
  };

  // Primary match based on emotion
  let match = emotionMapping[emotionalState.primary_emotion] || 'AURORA';

  // Adjust based on needs
  if (emotionalState.needs.includes('creativity')) match = 'FLUX';
  if (emotionalState.needs.includes('calm')) match = 'SAGE';
  if (emotionalState.needs.includes('inspiration')) match = 'AURORA';
  if (emotionalState.needs.includes('action')) match = 'SPARK';
  if (emotionalState.needs.includes('meaning')) match = 'ECHO';

  // Variety: If they've interacted with this curator recently, try a different one
  if (userHistory?.previous_curators?.slice(-2).includes(match)) {
    const alternatives = Object.keys(CURATORS).filter(c => c !== match) as CuratorName[];
    match = alternatives[Math.floor(Math.random() * alternatives.length)];
  }

  return match;
}

/**
 * Generate a personalized message from a curator
 */
export async function curatorSpeak(
  curatorName: CuratorName,
  context: {
    user_name?: string;
    relationship_stage: CuratorMemory['relationship_stage'];
    interactions_count: number;
    occasion: 'greeting' | 'product_recommendation' | 'check_in' | 'celebration' | 'support';
    additional_context?: string;
  }
): Promise<string> {
  const curator = CURATORS[curatorName];

  try {
    const relationshipContext = {
      stranger: "This is your first meeting. Be warm but not overly familiar.",
      acquaintance: `You've met ${context.interactions_count} times. There's recognition and growing comfort.`,
      friend: `You've shared ${context.interactions_count} meaningful interactions. There's trust and understanding.`,
      confidant: `You've been on a journey together (${context.interactions_count}+ interactions). Deep mutual respect and care.`,
    };

    const prompt = `You are ${curator.name}, ${curator.title}.

Your essence: ${curator.personality}
Your voice: ${curator.voice_style}
Your signature: "${curator.signature_phrase}"

Context:
- Relationship: ${relationshipContext[context.relationship_stage]}
- Occasion: ${context.occasion}
${context.additional_context ? `- Details: ${context.additional_context}` : ''}
${context.user_name ? `- User's name: ${context.user_name}` : ''}

Generate a brief message (2-3 sentences) that feels authentic to ${curator.name}'s character.
Be yourself - don't explain who you are, just be it.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 200,
    });

    return response.choices[0].message.content || curator.signature_phrase;
  } catch (error) {
    console.error('Curator speech error:', error);
    return curator.signature_phrase;
  }
}

/**
 * Curator recommends products with personal reasoning
 */
export async function curatorRecommendProducts(
  curatorName: CuratorName,
  products: Array<{ product_id: string; title: string; description: string; category: string }>,
  userContext: {
    emotional_state: string;
    needs: string[];
    relationship_stage: CuratorMemory['relationship_stage'];
    recent_purchases?: string[];
  }
): Promise<CuratorRecommendation> {
  const curator = CURATORS[curatorName];

  try {
    const prompt = `You are ${curator.name}, ${curator.title}. ${curator.personality}

A ${userContext.relationship_stage} is feeling ${userContext.emotional_state} and needs: ${userContext.needs.join(', ')}.

Here are products you could recommend:
${products.map((p, i) => `${i + 1}. ${p.title} - ${p.description?.substring(0, 100)}`).join('\n')}

Choose 2-3 products and explain why YOU (${curator.name}) think they matter.
Speak in your authentic voice: ${curator.voice_style}

Return JSON:
{
  "message": "Your opening message to them",
  "products": [
    {
      "product_index": <0-based index>,
      "why_this_matters": "why this product matters to their journey",
      "personal_note": "your perspective as ${curator.name}"
    }
  ],
  "ritual_suggestion": "optional ritual using these products",
  "followup_question": "a question to deepen connection"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 600,
    });

    const content = response.choices[0].message.content || '{}';
    const recommendation = JSON.parse(content.replace(/```json\n?|\n?```/g, ''));

    return {
      curator: curatorName,
      message: recommendation.message || `I see you, traveler. Let me share what speaks to me.`,
      products: recommendation.products?.map((p: any) => ({
        product_id: products[p.product_index]?.product_id || '',
        why_this_matters: p.why_this_matters || 'This called to me for you.',
        personal_note: p.personal_note || `- ${curator.name}`,
      })) || [],
      ritual_suggestion: recommendation.ritual_suggestion,
      followup_question: recommendation.followup_question,
    };
  } catch (error) {
    console.error('Curator recommendation error:', error);
    return {
      curator: curatorName,
      message: curator.signature_phrase,
      products: products.slice(0, 2).map(p => ({
        product_id: p.product_id,
        why_this_matters: 'I sense this aligns with your path.',
        personal_note: `- ${curator.name}`,
      })),
    };
  }
}

/**
 * Record a significant moment in the curator-user relationship
 */
export function captureSharedMoment(
  memory: CuratorMemory,
  event: 'first_purchase' | 'returned_after_absence' | 'milestone_reached' | 'breakthrough_moment' | 'celebration'
): CuratorMemory['shared_moments'][0] {
  const moments = {
    first_purchase: {
      moment: 'First purchase together',
      significance: 'The beginning of transformation',
    },
    returned_after_absence: {
      moment: 'Returned after time away',
      significance: 'The journey continues, as it always does',
    },
    milestone_reached: {
      moment: 'Reached a personal milestone',
      significance: 'Growth witnessed and celebrated',
    },
    breakthrough_moment: {
      moment: 'Breakthrough conversation',
      significance: 'A shift in understanding',
    },
    celebration: {
      moment: 'Celebrated together',
      significance: 'Joy shared, amplified',
    },
  };

  return {
    date: new Date().toISOString(),
    ...moments[event],
  };
}

/**
 * Evolve relationship stage based on interactions
 */
export function evolveRelationship(memory: CuratorMemory): CuratorMemory['relationship_stage'] {
  const daysSinceFirst = Math.floor(
    (new Date().getTime() - new Date(memory.first_met).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Natural progression based on interactions AND time
  if (memory.interactions_count >= 15 && daysSinceFirst >= 30) return 'confidant';
  if (memory.interactions_count >= 8 && daysSinceFirst >= 14) return 'friend';
  if (memory.interactions_count >= 3 && daysSinceFirst >= 3) return 'acquaintance';
  return 'stranger';
}

/**
 * Generate a "Where are they now?" update about a user's journey
 */
export async function reflectOnJourney(
  curatorName: CuratorName,
  memory: CuratorMemory,
  currentState: { products_purchased: string[]; growth_areas: string[] }
): Promise<string> {
  const curator = CURATORS[curatorName];

  try {
    const prompt = `You are ${curator.name}, ${curator.title}.

You've been guiding someone for ${memory.interactions_count} interactions over ${Math.floor((new Date().getTime() - new Date(memory.first_met).getTime()) / (1000 * 60 * 60 * 24))} days.

Journey so far:
- Topics explored: ${memory.topics_discussed.join(', ')}
- Significant moments: ${memory.shared_moments.map(m => m.moment).join(', ')}
- Current growth: ${currentState.growth_areas.join(', ')}

In your voice (${curator.voice_style}), write a brief reflection (3-4 sentences) on their journey.
Be proud, be genuine, be ${curator.name}.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 250,
    });

    return response.choices[0].message.content || 'You have come far, traveler. The path ahead is bright.';
  } catch (error) {
    console.error('Journey reflection error:', error);
    return 'The journey continues. I see your growth, always.';
  }
}
