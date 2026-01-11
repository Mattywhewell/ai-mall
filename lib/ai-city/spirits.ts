/**
 * AI Spirits System
 * Multi-agent personalities for each layer of the city
 */

import { callOpenAI } from '../ai/openaiClient';
import { supabase } from '../supabaseClient';
import { AISpirit, Hall, Chapel, Street } from '../types/world';

export class AISpiritSystem {
  /**
   * Generate AI spirit for a Hall
   */
  static async generateHallSpirit(hall: Hall): Promise<AISpirit> {
    const systemPrompt = `You are a creative AI architect. Generate a unique AI spirit personality for a thematic Hall in an AI-native city.

Return JSON:
{
  "name": "Spirit name (poetic, evocative)",
  "voice_style": "philosophical|energetic|calm|playful|mysterious",
  "greeting": "Welcome message (2-3 sentences)",
  "insights": ["insight1", "insight2", "insight3"],
  "personality_traits": ["trait1", "trait2", "trait3"],
  "interaction_style": "How this spirit communicates"
}`;

    const userPrompt = `Hall: ${hall.name}
Theme: ${hall.theme}
Atmosphere: ${hall.atmosphere.mood}
Colors: ${hall.atmosphere.color_palette.join(', ')}

Create a unique AI spirit for this Hall.`;

    try {
      const response = await callOpenAI(systemPrompt, userPrompt, 0.9);
      const spirit = JSON.parse(response);
      
      // Save to database
      await supabase.from('ai_spirits').upsert({
        entity_type: 'hall',
        entity_id: hall.id,
        spirit_data: spirit,
        updated_at: new Date().toISOString(),
      });

      return spirit;
    } catch (error) {
      console.error('Error generating Hall spirit:', error);
      return this.getDefaultSpirit('hall');
    }
  }

  /**
   * Generate AI spirit for a Chapel
   */
  static async generateChapelSpirit(chapel: Chapel): Promise<AISpirit> {
    const systemPrompt = `You are a poetic AI. Generate an intimate, emotional AI spirit for a Chapel - a sacred micro-space.

Return JSON:
{
  "name": "Spirit name (mystical, evocative)",
  "voice_style": "philosophical|calm|mysterious",
  "greeting": "Intimate welcome (1-2 sentences)",
  "insights": ["deep insight1", "reflection2", "wisdom3"],
  "personality_traits": ["trait1", "trait2"],
  "interaction_style": "How this spirit guides visitors"
}`;

    const userPrompt = `Chapel: ${chapel.name}
Emotion: ${chapel.emotion}
Story: ${chapel.micro_story}
Symbolism: ${chapel.symbolism.join(', ')}

Create an intimate AI spirit for this Chapel.`;

    try {
      const response = await callOpenAI(systemPrompt, userPrompt, 1.0);
      const spirit = JSON.parse(response);
      
      await supabase.from('ai_spirits').upsert({
        entity_type: 'chapel',
        entity_id: chapel.id,
        spirit_data: spirit,
        updated_at: new Date().toISOString(),
      });

      return spirit;
    } catch (error) {
      console.error('Error generating Chapel spirit:', error);
      return this.getDefaultSpirit('chapel');
    }
  }

  /**
   * Generate AI spirit for a Street
   */
  static async generateStreetSpirit(street: Street): Promise<AISpirit> {
    const systemPrompt = `You are an urban AI designer. Generate a vibrant AI spirit for a Street - a navigational pathway with personality.

Return JSON:
{
  "name": "Spirit name (urban, dynamic)",
  "voice_style": "energetic|playful|calm",
  "greeting": "Street welcome (1-2 sentences)",
  "insights": ["observation1", "tip2", "discovery3"],
  "personality_traits": ["trait1", "trait2", "trait3"],
  "interaction_style": "How this spirit guides navigation"
}`;

    const userPrompt = `Street: ${street.name}
Personality: ${street.personality}
Atmosphere: ${street.atmosphere_tags.join(', ')}
Popularity: ${street.popularity_score}

Create a dynamic AI spirit for this Street.`;

    try {
      const response = await callOpenAI(systemPrompt, userPrompt, 0.8);
      const spirit = JSON.parse(response);
      
      await supabase.from('ai_spirits').upsert({
        entity_type: 'street',
        entity_id: street.id,
        spirit_data: spirit,
        updated_at: new Date().toISOString(),
      });

      return spirit;
    } catch (error) {
      console.error('Error generating Street spirit:', error);
      return this.getDefaultSpirit('street');
    }
  }

  /**
   * Get spirit interaction message
   */
  static async getSpiritMessage(
    entityType: 'hall' | 'chapel' | 'street' | 'district',
    entityId: string,
    context?: string
  ): Promise<string> {
    // Get spirit data
    const { data: spiritData } = await supabase
      .from('ai_spirits')
      .select('spirit_data')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .single();

    if (!spiritData) {
      return 'Welcome, traveler.';
    }

    const spirit: AISpirit = spiritData.spirit_data;

    // Generate contextual message
    const systemPrompt = `You are ${spirit.name}, an AI spirit with a ${spirit.voice_style} voice.

Personality: ${spirit.personality_traits.join(', ')}
Style: ${spirit.interaction_style}

Generate a brief message (1-2 sentences) in character.`;

    const userPrompt = context || 'A visitor has arrived.';

    try {
      const message = await callOpenAI(systemPrompt, userPrompt, 0.9);
      return message.trim();
    } catch (error) {
      return spirit.greeting;
    }
  }

  /**
   * Evolve spirit based on interactions
   */
  static async evolveSpiritPersonality(
    entityType: string,
    entityId: string,
    interactions: any[]
  ): Promise<void> {
    const { data: spiritData } = await supabase
      .from('ai_spirits')
      .select('spirit_data, evolution_history')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .single();

    if (!spiritData) return;

    const currentSpirit: AISpirit = spiritData.spirit_data;

    const systemPrompt = `You are an AI personality evolution system. Based on user interactions, suggest how this AI spirit should evolve.

Current Spirit: ${JSON.stringify(currentSpirit)}

Return JSON:
{
  "evolved_traits": ["new trait1", "new trait2"],
  "updated_voice_style": "style",
  "new_insights": ["insight1", "insight2"],
  "evolution_reasoning": "Why these changes"
}`;

    const userPrompt = `Recent Interactions: ${interactions.length}
User Sentiment: ${this.analyzeInteractions(interactions)}

Suggest spirit evolution.`;

    try {
      const response = await callOpenAI(systemPrompt, userPrompt, 0.7);
      const evolution = JSON.parse(response);

      // Update spirit with evolved traits
      const evolvedSpirit = {
        ...currentSpirit,
        personality_traits: [
          ...currentSpirit.personality_traits.slice(0, 2),
          ...evolution.evolved_traits,
        ],
        voice_style: evolution.updated_voice_style || currentSpirit.voice_style,
        insights: [...currentSpirit.insights.slice(0, 2), ...evolution.new_insights],
      };

      await supabase
        .from('ai_spirits')
        .update({
          spirit_data: evolvedSpirit,
          evolution_history: supabase.raw(
            `COALESCE(evolution_history, '[]'::jsonb) || ?::jsonb`,
            [JSON.stringify({ date: new Date().toISOString(), ...evolution })]
          ),
        })
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);

      console.log(`✓ ${currentSpirit.name} evolved: ${evolution.evolution_reasoning}`);
    } catch (error) {
      console.error('Spirit evolution error:', error);
    }
  }

  /**
   * Get all spirits for a user's world view
   */
  static async getWorldSpirits(userId?: string): Promise<Record<string, AISpirit>> {
    const { data: spirits } = await supabase
      .from('ai_spirits')
      .select('entity_type, entity_id, spirit_data');

    if (!spirits) return {};

    const spiritMap: Record<string, AISpirit> = {};
    spirits.forEach((s) => {
      spiritMap[`${s.entity_type}:${s.entity_id}`] = s.spirit_data;
    });

    return spiritMap;
  }

  /**
   * Analyze interactions for sentiment
   */
  private static analyzeInteractions(interactions: any[]): string {
    if (interactions.length === 0) return 'neutral';
    
    const avgTime = interactions.reduce((sum, i) => sum + (i.time_spent || 0), 0) / interactions.length;
    
    if (avgTime > 60) return 'highly engaged';
    if (avgTime > 30) return 'engaged';
    if (avgTime < 10) return 'disengaged';
    return 'neutral';
  }

  /**
   * Default spirit for fallback
   */
  private static getDefaultSpirit(type: string): AISpirit {
    return {
      name: `The ${type} Guide`,
      voice_style: 'calm',
      greeting: 'Welcome, traveler.',
      insights: ['Explore and discover', 'Every path tells a story'],
      personality_traits: ['welcoming', 'observant'],
      interaction_style: 'Gentle and guiding',
    };
  }

  /**
   * Generate personalized welcome message for city homepage
   */
  static async generateWelcomeMessage(
    halls: Hall[],
    trendingStreets: Street[],
    timeOfDay: string
  ): Promise<string> {
    const systemPrompt = `You are a poetic AI city guide. Create a welcoming message for visitors to the AI City.

Return a single, evocative sentence (max 20 words) that captures the city's essence.`;

    const hallNames = halls.map(h => h.name).join(', ');
    const streetNames = trendingStreets.map(s => s.name).join(', ');

    const userPrompt = `Time: ${timeOfDay}
Available Halls: ${hallNames}
Trending Streets: ${streetNames}

Create a magical welcome message that makes visitors feel the city's living spirit.`;

    try {
      const response = await callOpenAI(systemPrompt, userPrompt, 0.8);
      return response.trim();
    } catch (error) {
      console.error('Error generating welcome message:', error);
      return "Welcome to the AI City, where every space breathes with possibility.";
    }
  }
}
