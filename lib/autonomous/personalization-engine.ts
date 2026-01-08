/**
 * Predictive Personalization Engine
 * Learns from user behavior and adapts experience
 */

import { supabase } from '../supabaseClient';
import { callOpenAI } from '../ai/openaiClient';

export interface UserProfile {
  user_id: string;
  browsing_history: string[];
  purchase_history: string[];
  search_history: string[];
  preferences: Record<string, any>;
  predicted_interests: string[];
  district_affinity: Record<string, number>;
  next_likely_action: string;
  engagement_score: number;
}

export interface PersonalizedLayout {
  user_id: string;
  homepage_sections: any[];
  featured_districts: string[];
  product_order: string[];
  personalization_reason: string;
}

export class PersonalizationEngine {
  /**
   * Build user profile from behavior
   */
  static async buildUserProfile(userId: string): Promise<UserProfile> {
    console.log(`👤 Building profile for user: ${userId}`);

    // Gather user activity
    const { data: events } = await supabase
      .from('analytics')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(500);

    if (!events || events.length === 0) {
      return this.getDefaultProfile(userId);
    }

    // Extract patterns
    const browsingHistory = events
      .filter((e) => e.event_type === 'view' && e.product_id)
      .map((e) => e.product_id)
      .slice(0, 50);

    const purchaseHistory = events
      .filter((e) => e.event_type === 'purchase' && e.product_id)
      .map((e) => e.product_id);

    const searchHistory = events
      .filter((e) => e.event_type === 'search' && e.metadata?.query)
      .map((e) => e.metadata.query)
      .slice(0, 20);

    // Calculate district affinity
    const districtViews: Record<string, number> = {};
    events.forEach((e) => {
      if (e.microstore_id) {
        districtViews[e.microstore_id] = (districtViews[e.microstore_id] || 0) + 1;
      }
    });

    const totalViews = Object.values(districtViews).reduce((sum, v) => sum + v, 0);
    const districtAffinity: Record<string, number> = {};
    Object.entries(districtViews).forEach(([id, views]) => {
      districtAffinity[id] = views / totalViews;
    });

    // Predict interests using AI
    const predictedInterests = await this.predictInterests(
      browsingHistory,
      purchaseHistory,
      searchHistory
    );

    // Predict next action
    const nextLikelyAction = await this.predictNextAction(events);

    // Calculate engagement score
    const engagementScore = this.calculateEngagementScore(events);

    const profile: UserProfile = {
      user_id: userId,
      browsing_history: browsingHistory,
      purchase_history: purchaseHistory,
      search_history: searchHistory,
      preferences: {},
      predicted_interests: predictedInterests,
      district_affinity: districtAffinity,
      next_likely_action: nextLikelyAction,
      engagement_score: engagementScore,
    };

    // Save profile
    await supabase.from('user_profiles').upsert({
      user_id: userId,
      profile_data: profile,
      updated_at: new Date().toISOString(),
    });

    return profile;
  }

  /**
   * Predict user interests using AI
   */
  private static async predictInterests(
    browsingHistory: string[],
    purchaseHistory: string[],
    searchHistory: string[]
  ): Promise<string[]> {
    if (browsingHistory.length === 0 && searchHistory.length === 0) {
      return [];
    }

    // Get product details
    const productIds = [...new Set([...browsingHistory, ...purchaseHistory])].slice(0, 20);
    
    const { data: products } = await supabase
      .from('products')
      .select('name, tags')
      .in('id', productIds);

    const systemPrompt = `You are a user interest prediction AI. Based on browsing and search history, predict user interests.

Return JSON array of 5-10 interest keywords: ["interest1", "interest2", ...]`;

    const userPrompt = `Products Viewed:
${products?.map((p) => `- ${p.name} (tags: ${p.tags?.join(', ')})`).join('\n') || 'None'}

Searches:
${searchHistory.map((q) => `- "${q}"`).join('\n') || 'None'}

Predict interests.`;

    try {
      const response = await callOpenAI(systemPrompt, userPrompt, 0.7);
      const interests = JSON.parse(response);
      return interests;
    } catch (error) {
      return [];
    }
  }

  /**
   * Predict next likely action
   */
  private static async predictNextAction(events: any[]): Promise<string> {
    const recentEvents = events.slice(0, 10);

    const systemPrompt = `You are a user behavior prediction AI. Based on recent activity, predict the user's next likely action.

Options: "make_purchase", "browse_more", "search_specific", "add_to_cart", "leave_site"

Return just the prediction string.`;

    const userPrompt = `Recent Activity:
${recentEvents.map((e) => `- ${e.event_type} at ${e.created_at}`).join('\n')}

Predict next action.`;

    try {
      const prediction = await callOpenAI(systemPrompt, userPrompt, 0.6);
      return prediction.trim();
    } catch (error) {
      return 'browse_more';
    }
  }

  /**
   * Calculate engagement score
   */
  private static calculateEngagementScore(events: any[]): number {
    if (events.length === 0) return 0;

    const weights = {
      view: 1,
      click: 2,
      search: 3,
      add_to_cart: 5,
      purchase: 10,
    };

    const score = events.reduce((sum, e) => {
      return sum + (weights[e.event_type as keyof typeof weights] || 0);
    }, 0);

    // Normalize to 0-100
    return Math.min(100, (score / events.length) * 10);
  }

  /**
   * Generate personalized layout
   */
  static async personalizeHomepage(userId: string): Promise<PersonalizedLayout> {
    const profile = await this.buildUserProfile(userId);

    // Get top affinity districts
    const topDistricts = Object.entries(profile.district_affinity)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([id]) => id);

    // Get recommended products based on interests
    const { data: recommendedProducts } = await supabase.rpc(
      'get_products_by_interests',
      { interests: profile.predicted_interests }
    );

    const productOrder = recommendedProducts?.map((p: any) => p.id) || [];

    // Generate AI reasoning
    const systemPrompt = `You are a UX personalization AI. Explain why this homepage layout was chosen for a user.

Be concise (1-2 sentences).`;

    const userPrompt = `User Interests: ${profile.predicted_interests.join(', ')}
Top Districts: ${topDistricts.length}
Engagement Score: ${profile.engagement_score}
Next Likely Action: ${profile.next_likely_action}

Explain personalization.`;

    let reason = 'Personalized based on your browsing history';
    try {
      reason = await callOpenAI(systemPrompt, userPrompt, 0.6);
    } catch (error) {
      // Use default
    }

    const layout: PersonalizedLayout = {
      user_id: userId,
      homepage_sections: [
        { type: 'recommended', title: 'Recommended For You', product_ids: productOrder.slice(0, 6) },
        { type: 'districts', title: 'Your Favorite Districts', district_ids: topDistricts },
        { type: 'trending', title: 'Trending Now', product_ids: [] },
      ],
      featured_districts: topDistricts,
      product_order: productOrder,
      personalization_reason: reason.trim(),
    };

    // Save layout
    await supabase.from('personalized_layouts').insert({
      user_id: userId,
      layout_data: layout,
      generated_at: new Date().toISOString(),
    });

    return layout;
  }

  /**
   * Suggest districts based on affinity
   */
  static async suggestDistricts(userId: string): Promise<string[]> {
    const profile = await this.buildUserProfile(userId);

    // Get districts user hasn't visited
    const { data: allDistricts } = await supabase
      .from('microstores')
      .select('id, name, category, description');

    if (!allDistricts) return [];

    const visitedIds = Object.keys(profile.district_affinity);
    const unvisited = allDistricts.filter((d) => !visitedIds.includes(d.id));

    // Use AI to match interests to districts
    const systemPrompt = `You are a recommendation AI. Match user interests to unvisited districts.

Return JSON array of district IDs: ["id1", "id2", "id3"]`;

    const userPrompt = `User Interests: ${profile.predicted_interests.join(', ')}

Unvisited Districts:
${unvisited.map((d) => `- ${d.id}: ${d.name} (${d.category}) - ${d.description}`).join('\n')}

Suggest 3 districts.`;

    try {
      const response = await callOpenAI(systemPrompt, userPrompt, 0.7);
      const suggestions = JSON.parse(response);
      return suggestions;
    } catch (error) {
      return unvisited.slice(0, 3).map((d) => d.id);
    }
  }

  /**
   * Predict intent from recent behavior
   */
  static async predictIntent(userId: string): Promise<string> {
    const { data: recentEvents } = await supabase
      .from('analytics')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!recentEvents || recentEvents.length === 0) {
      return 'explore';
    }

    const systemPrompt = `You are an intent prediction AI. Based on recent user behavior, predict their current intent.

Options: "ready_to_buy", "comparing_products", "just_browsing", "looking_for_specific", "price_checking"

Return just the intent string.`;

    const userPrompt = `Recent Events:
${recentEvents.map((e) => `- ${e.event_type} (${e.product_id ? 'product' : 'general'})`).join('\n')}

Predict intent.`;

    try {
      const intent = await callOpenAI(systemPrompt, userPrompt, 0.6);
      return intent.trim();
    } catch (error) {
      return 'just_browsing';
    }
  }

  /**
   * Adapt layout based on session behavior
   */
  static async adaptLayoutRealtime(userId: string, sessionEvents: any[]): Promise<any> {
    if (sessionEvents.length < 5) {
      return null; // Not enough data to adapt
    }

    // Detect behavior patterns
    const hasSearched = sessionEvents.some((e) => e.event_type === 'search');
    const hasAddedToCart = sessionEvents.some((e) => e.event_type === 'add_to_cart');
    const viewCount = sessionEvents.filter((e) => e.event_type === 'view').length;

    let adaptations = [];

    if (hasSearched && viewCount > 5) {
      adaptations.push({
        action: 'show_search_refinement',
        reason: 'User is searching actively, offer filters',
      });
    }

    if (hasAddedToCart && viewCount > 10) {
      adaptations.push({
        action: 'show_checkout_prompt',
        reason: 'User has items in cart and is still browsing, prompt checkout',
      });
    }

    if (viewCount > 15 && !hasAddedToCart) {
      adaptations.push({
        action: 'show_recommendations',
        reason: 'User is browsing heavily, show personalized picks',
      });
    }

    return adaptations;
  }

  /**
   * Default profile for new users
   */
  private static getDefaultProfile(userId: string): UserProfile {
    return {
      user_id: userId,
      browsing_history: [],
      purchase_history: [],
      search_history: [],
      preferences: {},
      predicted_interests: [],
      district_affinity: {},
      next_likely_action: 'explore',
      engagement_score: 0,
    };
  }
}
