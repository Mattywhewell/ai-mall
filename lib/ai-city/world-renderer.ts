/**
 * World Rendering System
 * Adapts the city based on user preferences and behavior
 */

import { supabase } from '../supabaseClient';
import { UserWorldView, WorldLayer, Hall, Street, Chapel } from '../types/world';
import { callOpenAI } from '../ai/openaiClient';
import { log as ndLog, timeAsync } from '@/lib/server-ndjson';

export class WorldRenderer {
  /**
   * Build personalized world view for user
   */
  static async renderPersonalizedWorld(userId: string): Promise<WorldLayer> {
    const start = Date.now();
    ndLog('info','renderer_render_start',{userId});

    // Get user's world preferences
    const userView = await timeAsync('WorldRenderer.getUserWorldView', async () => this.getUserWorldView(userId), { userId });

    // Fetch all layers
    const halls = await timeAsync('supabase.halls', async () => (await supabase.from('halls').select('*').order('created_at', { ascending: true })).data || [], { userId });
    const streets = await timeAsync('supabase.streets', async () => (await supabase.from('streets').select('*').order('popularity_score', { ascending: false })).data || [], { userId });
    const chapels = await timeAsync('supabase.chapels', async () => (await supabase.from('chapels').select('*').order('created_at', { ascending: true })).data || [], { userId });
    const districts = await timeAsync('supabase.microstores', async () => (await supabase.from('microstores').select('*').order('created_at', { ascending: true })).data || [], { userId });

    // Personalize order and atmosphere
    const personalizedHalls = this.personalizeHalls(halls || [], userView);
    const personalizedStreets = this.personalizeStreets(streets || [], userView);
    const personalizedChapels = this.personalizeChapels(chapels || [], userView);
    const personalizedDistricts = this.personalizeDistricts(districts || [], userView);

    ndLog('info','renderer_render_end',{userId, duration_ms: Date.now()-start});

    return {
      halls: personalizedHalls,
      streets: personalizedStreets,
      chapels: personalizedChapels,
      districts: personalizedDistricts,
    };
  }

  /**
   * Get or create user world view
   */
  static async getUserWorldView(userId: string): Promise<UserWorldView> {
    const { data: existing } = await supabase
      .from('user_world_views')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existing) {
      return existing.view_data;
    }

    // Create default view
    const defaultView: UserWorldView = {
      user_id: userId,
      preferred_halls: [],
      visited_chapels: [],
      street_affinity: {},
      district_preferences: {},
      personalized_order: {
        halls: [],
        streets: [],
        districts: [],
      },
      atmosphere_preference: 'vibrant',
      last_updated: new Date().toISOString(),
    };

    await supabase.from('user_world_views').insert({
      user_id: userId,
      view_data: defaultView,
    });

    return defaultView;
  }

  /**
   * Update user world view based on behavior
   */
  static async updateWorldView(
    userId: string,
    interaction: {
      type: 'hall_visit' | 'chapel_visit' | 'street_navigation' | 'district_view';
      entity_id: string;
      time_spent: number;
      engaged: boolean;
    }
  ): Promise<void> {
    const view = await this.getUserWorldView(userId);

    // Update based on interaction type
    switch (interaction.type) {
      case 'hall_visit':
        if (!view.preferred_halls.includes(interaction.entity_id)) {
          view.preferred_halls.push(interaction.entity_id);
        }
        break;

      case 'chapel_visit':
        if (!view.visited_chapels.includes(interaction.entity_id)) {
          view.visited_chapels.push(interaction.entity_id);
        }
        break;

      case 'street_navigation':
        view.street_affinity[interaction.entity_id] =
          (view.street_affinity[interaction.entity_id] || 0) + interaction.time_spent;
        break;

      case 'district_view':
        view.district_preferences[interaction.entity_id] =
          (view.district_preferences[interaction.entity_id] || 0) + (interaction.engaged ? 2 : 1);
        break;
    }

    view.last_updated = new Date().toISOString();

    await supabase
      .from('user_world_views')
      .update({ view_data: view })
      .eq('user_id', userId);
  }

  /**
   * Personalize Hall order and atmosphere
   */
  private static personalizeHalls(halls: Hall[], userView: UserWorldView): Hall[] {
    // Sort by user preference
    const sortedHalls = [...halls].sort((a, b) => {
      const aScore = userView.preferred_halls.includes(a.id) ? 1000 : 0;
      const bScore = userView.preferred_halls.includes(b.id) ? 1000 : 0;
      return bScore - aScore;
    });

    // Adapt atmosphere based on user preference
    return sortedHalls.map((hall) => {
      const adaptedAtmosphere = { ...hall.atmosphere };

      if (userView.atmosphere_preference === 'bright') {
        adaptedAtmosphere.lighting_style = 'bright';
      } else if (userView.atmosphere_preference === 'cozy') {
        adaptedAtmosphere.lighting_style = 'warm';
      } else if (userView.atmosphere_preference === 'minimal') {
        adaptedAtmosphere.lighting_style = 'cool';
      }

      return { ...hall, atmosphere: adaptedAtmosphere };
    });
  }

  /**
   * Personalize Street order
   */
  private static personalizeStreets(streets: Street[], userView: UserWorldView): Street[] {
    return [...streets].sort((a, b) => {
      const aAffinity = userView.street_affinity[a.id] || 0;
      const bAffinity = userView.street_affinity[b.id] || 0;

      // Combine affinity with popularity
      const aScore = aAffinity * 0.6 + a.popularity_score * 0.4;
      const bScore = bAffinity * 0.6 + b.popularity_score * 0.4;

      return bScore - aScore;
    });
  }

  /**
   * Personalize Chapel tone
   */
  private static personalizeChapels(chapels: Chapel[], userView: UserWorldView): Chapel[] {
    // Show visited chapels first, then new ones
    const visited = chapels.filter((c) => userView.visited_chapels.includes(c.id));
    const unvisited = chapels.filter((c) => !userView.visited_chapels.includes(c.id));

    return [...visited, ...unvisited];
  }

  /**
   * Personalize District order
   */
  private static personalizeDistricts(districts: any[], userView: UserWorldView): any[] {
    return [...districts].sort((a, b) => {
      const aScore = userView.district_preferences[a.id] || 0;
      const bScore = userView.district_preferences[b.id] || 0;
      return bScore - aScore;
    });
  }

  /**
   * Generate atmospheric description for current state
   */
  static async generateAtmosphericDescription(
    layer: 'hall' | 'chapel' | 'street',
    entity: any,
    userContext?: string
  ): Promise<string> {
    const systemPrompt = `You are an atmospheric AI writer. Generate a vivid, poetic description (2-3 sentences) for this ${layer}.

Be evocative, sensory, and immersive.`;

    const userPrompt = `${layer === 'hall' ? 'Hall' : layer === 'chapel' ? 'Chapel' : 'Street'}: ${entity.name}
${layer === 'hall' ? `Theme: ${entity.theme}, Mood: ${entity.atmosphere.mood}` : ''}
${layer === 'chapel' ? `Emotion: ${entity.emotion}, Story: ${entity.micro_story}` : ''}
${layer === 'street' ? `Personality: ${entity.personality}, Tags: ${entity.atmosphere_tags?.join(', ')}` : ''}
${userContext ? `User Context: ${userContext}` : ''}

Generate atmospheric description.`;

    try {
      const description = await timeAsync('WorldRenderer.generateAtmosphericDescription.ai', async () => callOpenAI(systemPrompt, userPrompt, 1.0), { layer, entityId: entity.id });
      ndLog('info','renderer_atmospheric_generated',{layer, entityId: entity.id});
      return (description as string).trim();
    } catch (error) {
      ndLog('warn','renderer_atmospheric_failed',{layer, entityId: entity.id, error: String(error)});
      return `Welcome to ${entity.name}.`;
    }
  }

  /**
   * Adapt world brightness based on time and user preference
   */
  static async adaptWorldBrightness(userId: string): Promise<string> {
    const view = await this.getUserWorldView(userId);
    const hour = new Date().getHours();

    // Time-based defaults
    let brightness = 'vibrant';
    if (hour >= 20 || hour < 6) {
      brightness = 'cozy'; // Evening/night
    } else if (hour >= 6 && hour < 10) {
      brightness = 'bright'; // Morning
    }

    // Override with user preference if set
    return view.atmosphere_preference || brightness;
  }

  /**
   * Generate world navigation suggestions
   */
  static async generateNavigationSuggestions(
    userId: string,
    currentLocation: { type: string; id: string }
  ): Promise<string[]> {
    const view = await this.getUserWorldView(userId);

    const systemPrompt = `You are a city guide AI. Based on user preferences and current location, suggest 3 places to explore next.

Return JSON array of strings: ["suggestion1", "suggestion2", "suggestion3"]

Each suggestion should be specific and compelling.`;

    const userPrompt = `Current Location: ${currentLocation.type} (${currentLocation.id})
User Preferences: ${JSON.stringify({
      preferred_halls: view.preferred_halls.slice(0, 3),
      visited_chapels_count: view.visited_chapels.length,
      top_streets: Object.keys(view.street_affinity).slice(0, 3),
    })}

Suggest 3 places to explore.`;

    try {
      ndLog('info','renderer_navigation_start',{userId, location: currentLocation});
      const response = await timeAsync('WorldRenderer.generateNavigationSuggestions.ai', async () => callOpenAI(systemPrompt, userPrompt, 0.8), { userId, location: currentLocation });
      const suggestions = JSON.parse(response as string);
      ndLog('info','renderer_navigation_end',{userId, location: currentLocation});
      return suggestions;
    } catch (error) {
      ndLog('warn','renderer_navigation_failed',{userId, location: currentLocation, error: String(error)});
      return [
        'Explore a nearby Hall',
        'Discover a hidden Chapel',
        'Wander down a new Street',
      ];
    }
  }
}
