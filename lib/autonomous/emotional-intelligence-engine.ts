/**
 * EMOTIONAL INTELLIGENCE ENGINE
 * 
 * Detects user emotional state and adapts the entire marketplace experience.
 * Goes beyond behavioral tracking to understand *why* users are here.
 */

import { getOpenAI } from '../openai';

// ==================== INTERFACES ====================

export interface EmotionalState {
  user_id: string;
  primary_emotion: 'seeking' | 'stressed' | 'curious' | 'purposeful' | 'playful' | 'melancholic' | 'excited';
  intensity: number; // 0-100
  needs: string[]; // ["comfort", "inspiration", "escape", "growth"]
  recommended_journey: 'contemplative' | 'energetic' | 'exploratory' | 'focused';
  chapel_affinity: string; // Which chapel resonates most
  color_palette: string[]; // Hex colors that match emotional state
  music_tempo: 'slow' | 'medium' | 'fast'; // For future audio integration
  detected_from: string[]; // ["browsing_pattern", "search_terms", "time_spent"]
}

export interface EmotionalProduct {
  product_id: string;
  emotional_resonance_score: number; // 0-100
  why_this_matters: string; // Emotional reasoning
  ritual_suggestion: string; // How to use this product meaningfully
  complementary_emotion: string; // What emotion this could evoke
}

/**
 * Detect user's emotional state from behavioral signals
 */
export async function detectEmotionalState(signals: {
  user_id: string;
  recent_searches: string[];
  browsing_speed: 'slow' | 'medium' | 'fast'; // Time per page
  navigation_pattern: 'linear' | 'scattered' | 'purposeful';
  time_of_day: number; // 0-23
  repeat_visits_today: number;
  cart_abandonment_count: number;
  viewed_chapels: string[];
}): Promise<EmotionalState> {
  try {
    const prompt = `Analyze this user's emotional state from their behavior:

Recent Searches: ${signals.recent_searches.join(', ')}
Browsing Speed: ${signals.browsing_speed}
Navigation: ${signals.navigation_pattern}
Time: ${signals.time_of_day}:00 (${signals.time_of_day < 6 ? 'late night' : signals.time_of_day < 12 ? 'morning' : signals.time_of_day < 18 ? 'afternoon' : 'evening'})
Repeat Visits Today: ${signals.repeat_visits_today}
Cart Abandonments: ${signals.cart_abandonment_count}
Viewed Chapels: ${signals.viewed_chapels.join(', ')}

Detect their emotional state and needs. Return JSON:
{
  "primary_emotion": "seeking" | "stressed" | "curious" | "purposeful" | "playful" | "melancholic" | "excited",
  "intensity": <0-100>,
  "needs": ["need1", "need2", "need3"],
  "recommended_journey": "contemplative" | "energetic" | "exploratory" | "focused",
  "chapel_affinity": "Contemplation" | "Joy" | "Mystery" | "Serenity" | "Wonder",
  "color_palette": ["#hex1", "#hex2", "#hex3"],
  "music_tempo": "slow" | "medium" | "fast",
  "reasoning": "brief insight into their state"
}`;

    const client = getOpenAI();
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 400,
    });

    const content = response.choices[0].message.content || '{}';
    const analysis = JSON.parse(content.replace(/```json\n?|\n?```/g, ''));

    return {
      user_id: signals.user_id,
      primary_emotion: analysis.primary_emotion || 'curious',
      intensity: analysis.intensity || 50,
      needs: analysis.needs || ['discovery'],
      recommended_journey: analysis.recommended_journey || 'exploratory',
      chapel_affinity: analysis.chapel_affinity || 'Wonder',
      color_palette: analysis.color_palette || ['#6366f1', '#8b5cf6', '#d946ef'],
      music_tempo: analysis.music_tempo || 'medium',
      detected_from: ['browsing_pattern', 'search_terms', 'time_of_day', 'navigation'],
    };
  } catch (error) {
    console.error('Emotional detection error:', error);
    return {
      user_id: signals.user_id,
      primary_emotion: 'curious',
      intensity: 50,
      needs: ['discovery'],
      recommended_journey: 'exploratory',
      chapel_affinity: 'Wonder',
      color_palette: ['#6366f1', '#8b5cf6', '#d946ef'],
      music_tempo: 'medium',
      detected_from: ['default'],
    };
  }
}

/**
 * Score products based on emotional resonance
 */
export async function scoreEmotionalResonance(
  product: {
    title: string;
    description: string;
    category: string;
    aesthetic: string;
  },
  emotionalState: EmotionalState
): Promise<EmotionalProduct> {
  try {
    const prompt = `Does this product resonate with someone feeling ${emotionalState.primary_emotion}?

Product: ${product.title}
Description: ${product.description}
Category: ${product.category}
Aesthetic: ${product.aesthetic}

User's Emotional State:
- Primary Emotion: ${emotionalState.primary_emotion} (${emotionalState.intensity}% intensity)
- Needs: ${emotionalState.needs.join(', ')}
- Journey: ${emotionalState.recommended_journey}
- Chapel Affinity: ${emotionalState.chapel_affinity}

Return JSON:
{
  "emotional_resonance_score": <0-100>,
  "why_this_matters": "brief emotional reasoning",
  "ritual_suggestion": "meaningful way to use this",
  "complementary_emotion": "emotion this could evoke"
}`;

    const client = getOpenAI();
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: 300,
    });

    const content = response.choices[0].message.content || '{}';
    const analysis = JSON.parse(content.replace(/```json\n?|\n?```/g, ''));

    return {
      product_id: '',
      emotional_resonance_score: analysis.emotional_resonance_score || 50,
      why_this_matters: analysis.why_this_matters || 'This product aligns with your current journey.',
      ritual_suggestion: analysis.ritual_suggestion || 'Incorporate this into your daily practice.',
      complementary_emotion: analysis.complementary_emotion || emotionalState.primary_emotion,
    };
  } catch (error) {
    console.error('Emotional resonance scoring error:', error);
    return {
      product_id: '',
      emotional_resonance_score: 50,
      why_this_matters: 'This product may support your journey.',
      ritual_suggestion: 'Use mindfully and with intention.',
      complementary_emotion: emotionalState.primary_emotion,
    };
  }
}

/**
 * Generate personalized AI Spirit message based on emotional state
 */
export async function generateEmpatheticGreeting(
  entityName: string,
  entityType: 'hall' | 'street' | 'chapel' | 'district',
  emotionalState: EmotionalState
): Promise<string> {
  try {
    const prompt = `You are the AI Spirit of ${entityName}, a mystical ${entityType} in AI City.

A visitor has arrived feeling ${emotionalState.primary_emotion} (intensity: ${emotionalState.intensity}%).
Their needs: ${emotionalState.needs.join(', ')}
They're drawn to the ${emotionalState.chapel_affinity} chapel.

Create a brief, empathetic greeting (2-3 sentences) that:
1. Acknowledges their emotional state without being obvious
2. Welcomes them warmly
3. Hints at what they might discover here

Tone: Mystical, wise, comforting. Not cheesy or overly spiritual.`;

    const client = getOpenAI();
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 150,
    });

    return response.choices[0].message.content || `Welcome to ${entityName}, traveler. The universe brought you here for a reason.`;
  } catch (error) {
    console.error('Empathetic greeting error:', error);
    return `Welcome to ${entityName}. May you find what your soul seeks.`;
  }
}

/**
 * Suggest a personalized journey through AI City based on emotional state
 */
export function craftEmotionalJourney(emotionalState: EmotionalState): {
  recommended_path: string[];
  reasoning: string;
  estimated_duration: string;
  transformation: string;
} {
  const journeys: Record<EmotionalState['primary_emotion'], any> = {
    stressed: {
      recommended_path: ['Serenity Chapel', 'Wellness Garden', 'Artisan Row', 'Contemplation Chapel'],
      reasoning: 'A calming path from chaos to peace, focusing on grounding and restoration.',
      estimated_duration: '15-20 minutes',
      transformation: 'Stress → Calm → Grounded',
    },
    seeking: {
      recommended_path: ['Mystery Chapel', 'Innovation Hall', 'Tech Corridor', 'Wonder Chapel'],
      reasoning: 'A path of discovery and possibility, for those searching for answers.',
      estimated_duration: '20-30 minutes',
      transformation: 'Seeking → Discovering → Inspired',
    },
    melancholic: {
      recommended_path: ['Contemplation Chapel', 'Craft Sanctuary', 'Joy Chapel', 'Wonder Chapel'],
      reasoning: 'A gentle journey from introspection to lightness, honoring the melancholy.',
      estimated_duration: '20-25 minutes',
      transformation: 'Melancholy → Acceptance → Hope',
    },
    curious: {
      recommended_path: ['Wonder Chapel', 'Neon Boulevard', 'Innovation Hall', 'Mystery Chapel'],
      reasoning: 'An exploratory path for the endlessly curious mind.',
      estimated_duration: '25-35 minutes',
      transformation: 'Curiosity → Exploration → Wonder',
    },
    purposeful: {
      recommended_path: ['Innovation Hall', 'Tech Corridor', 'Motion Plaza', 'Contemplation Chapel'],
      reasoning: 'A focused path for those with clear intent, ending in reflection.',
      estimated_duration: '15-20 minutes',
      transformation: 'Intent → Action → Integration',
    },
    playful: {
      recommended_path: ['Joy Chapel', 'Neon Boulevard', 'Craft Sanctuary', 'Wonder Chapel'],
      reasoning: 'A delightful path celebrating creativity and spontaneity.',
      estimated_duration: '20-30 minutes',
      transformation: 'Playfulness → Creativity → Joy',
    },
    excited: {
      recommended_path: ['Motion Plaza', 'Tech Corridor', 'Innovation Hall', 'Joy Chapel'],
      reasoning: 'An energetic path channeling excitement into discovery.',
      estimated_duration: '15-25 minutes',
      transformation: 'Excitement → Energy → Fulfillment',
    },
  };

  return journeys[emotionalState.primary_emotion] || journeys.curious;
}

/**
 * Generate a personal ritual based on purchased products and emotional state
 */
export async function createPersonalRitual(
  products: Array<{ title: string; category: string }>,
  emotionalState: EmotionalState
): Promise<{
  ritual_name: string;
  steps: string[];
  best_time: string;
  duration: string;
  intention: string;
}> {
  try {
    const prompt = `Create a personal ritual using these products:

${products.map(p => `- ${p.title} (${p.category})`).join('\n')}

For someone feeling ${emotionalState.primary_emotion} who needs: ${emotionalState.needs.join(', ')}

Return JSON:
{
  "ritual_name": "beautiful name",
  "steps": ["step 1", "step 2", "step 3"],
  "best_time": "when to do this",
  "duration": "how long",
  "intention": "what this ritual achieves"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 400,
    });

    const content = response.choices[0].message.content || '{}';
    const ritual = JSON.parse(content.replace(/```json\n?|\n?```/g, ''));

    return {
      ritual_name: ritual.ritual_name || 'Your Personal Practice',
      steps: ritual.steps || ['Use your products mindfully', 'Set an intention', 'Reflect on the experience'],
      best_time: ritual.best_time || 'Morning or evening',
      duration: ritual.duration || '10-15 minutes',
      intention: ritual.intention || 'To support your journey',
    };
  } catch (error) {
    console.error('Ritual creation error:', error);
    return {
      ritual_name: 'Your Personal Practice',
      steps: ['Create a calm space', 'Use your products with intention', 'Reflect on how you feel'],
      best_time: 'When you need it most',
      duration: '10-15 minutes',
      intention: 'To support your wellbeing',
    };
  }
}
