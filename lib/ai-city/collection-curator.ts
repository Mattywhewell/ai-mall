/**
 * AI Collection Curator
 * 
 * An intelligent system that creates, evolves, and personalizes product collections
 * using AI analysis of user behavior, trends, seasons, and thematic coherence.
 * 
 * Inspired by museum curators who thoughtfully assemble exhibitions,
 * this AI Spirit curates shopping experiences that feel intentional and inspiring.
 */

import { supabase } from '@/lib/supabaseClient';
import { getOpenAI } from '../openai';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  tags: string[];
  microstore_id: string;
}

interface CollectionTheme {
  name: string;
  slug: string;
  description: string;
  theme: 'wellness' | 'tech' | 'seasonal' | 'trending' | 'personalized';
  curatorPersonality: string;
  targetMood?: string;
  targetPersona?: string;
  season?: string;
  philosophy?: string;
}

interface CurationCriteria {
  minProducts: number;
  maxProducts: number;
  themeCoherence: number; // 0-1
  priceRange?: { min: number; max: number };
  categoryDiversity?: boolean;
  complementaryUse?: boolean;
}

export class CollectionCurator {
  /**
   * Create a new AI-curated collection based on a theme
   */
  async curateCollection(
    theme: CollectionTheme,
    criteria: CurationCriteria = { minProducts: 4, maxProducts: 8, themeCoherence: 0.8 }
  ): Promise<string | null> {
    try {
      // Fetch candidate products
      const products = await this.fetchCandidateProducts(theme);
      
      if (products.length < criteria.minProducts) {
        console.error(`Not enough products found for theme: ${theme.name}`);
        return null;
      }

      // Use AI to select the best products for this collection
      const selectedProducts = await this.aiSelectProducts(
        products,
        theme,
        criteria
      );

      if (selectedProducts.length < criteria.minProducts) {
        console.error(`AI selected too few products for ${theme.name}`);
        return null;
      }

      // Generate curation reasoning
      const reasoning = await this.generateCurationReasoning(
        selectedProducts,
        theme
      );

      // Generate color scheme
      const colorScheme = this.generateColorScheme(theme.theme);

      // Create collection in database
      const collectionId = await this.createCollectionInDatabase({
        theme,
        productIds: selectedProducts.map(p => p.id),
        reasoning,
        colorScheme
      });

      // Log creation
      await this.logEvolution(collectionId, 'created', 'ai_curator', {
        action: 'initial_creation',
        product_count: selectedProducts.length,
        reasoning: reasoning.summary
      });

      return collectionId;
    } catch (error) {
      console.error('Error curating collection:', error);
      return null;
    }
  }

  /**
   * Fetch candidate products based on theme
   */
  private async fetchCandidateProducts(theme: CollectionTheme): Promise<Product[]> {
    let query = supabase
      .from('products')
      .select('id, name, description, category, price, tags, microstore_id')
      .eq('active', true);

    // Theme-specific filtering
    if (theme.theme === 'wellness') {
      query = query.or('category.ilike.%wellness%,category.ilike.%health%,tags.cs.{wellness,health,mindfulness}');
    } else if (theme.theme === 'tech') {
      query = query.or('category.ilike.%tech%,category.ilike.%gadget%,tags.cs.{tech,innovation,gadget}');
    } else if (theme.theme === 'seasonal') {
      const season = theme.season || this.getCurrentSeason();
      query = query.or(`tags.cs.{${season}},description.ilike.%${season}%`);
    }

    const { data, error } = await query.limit(50);

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return (data || []) as Product[];
  }

  /**
   * Use AI to intelligently select products that work well together
   */
  private async aiSelectProducts(
    candidates: Product[],
    theme: CollectionTheme,
    criteria: CurationCriteria
  ): Promise<Product[]> {
    const prompt = `You are ${theme.curatorPersonality}, an expert product curator.

Your task: Curate ${criteria.minProducts}-${criteria.maxProducts} products for a collection called "${theme.name}".

Theme Description: ${theme.description}
Target Mood: ${theme.targetMood || 'versatile'}
Target Persona: ${theme.targetPersona || 'general audience'}

Available Products:
${candidates.map((p, i) => `${i + 1}. ${p.name} - $${p.price} (${p.category})
   Description: ${p.description?.substring(0, 150) || 'No description'}
   Tags: ${p.tags?.join(', ') || 'none'}`).join('\n\n')}

Selection Criteria:
- Choose products that create a cohesive story
- ${criteria.complementaryUse ? 'Products should complement each other in use' : 'Products can be independent but thematically aligned'}
- ${criteria.categoryDiversity ? 'Prefer diversity in categories' : 'Category overlap is acceptable'}
- Price range: ${criteria.priceRange ? `$${criteria.priceRange.min}-$${criteria.priceRange.max}` : 'any'}
- Theme coherence: ${criteria.themeCoherence >= 0.8 ? 'very high' : criteria.themeCoherence >= 0.6 ? 'moderate' : 'flexible'}

Respond with ONLY a JSON array of product numbers (e.g., [1, 4, 7, 12]).
No explanation, just the array.`;

    try {
      const response = await getOpenAI().chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert product curator. Respond only with valid JSON arrays.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      });

      const content = response.choices[0].message.content?.trim() || '[]';
      const selectedIndices = JSON.parse(content) as number[];
      
      return selectedIndices
        .map(index => candidates[index - 1])
        .filter(Boolean)
        .slice(0, criteria.maxProducts);
    } catch (error) {
      console.error('Error in AI selection:', error);
      // Fallback: select first N products
      return candidates.slice(0, criteria.maxProducts);
    }
  }

  /**
   * Generate detailed reasoning for why products were selected
   */
  private async generateCurationReasoning(
    products: Product[],
    theme: CollectionTheme
  ): Promise<any> {
    const prompt = `As ${theme.curatorPersonality}, explain why these products make a perfect collection for "${theme.name}":

Products Selected:
${products.map(p => `- ${p.name}: ${p.description?.substring(0, 100)}`).join('\n')}

Provide:
1. A compelling 2-sentence summary of why these work together
2. Individual product contributions (1 sentence each)
3. The emotional journey this collection creates
4. Target user benefits

Format as JSON:
{
  "summary": "Why these products work together",
  "productContributions": {"product_id": "what it adds to the collection"},
  "emotionalJourney": "The experience users will have",
  "userBenefits": ["benefit1", "benefit2", "benefit3"]
}`;

    try {
      const response = await getOpenAI().chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 400
      });

      const content = response.choices[0].message.content?.trim() || '{}';
      return JSON.parse(content);
    } catch (error) {
      console.error('Error generating reasoning:', error);
      return {
        summary: `A thoughtfully curated ${theme.name} collection`,
        productContributions: {},
        emotionalJourney: 'A cohesive shopping experience',
        userBenefits: ['Quality selection', 'Thematic coherence', 'Curated with care']
      };
    }
  }

  /**
   * Create collection in database
   */
  private async createCollectionInDatabase(data: {
    theme: CollectionTheme;
    productIds: string[];
    reasoning: any;
    colorScheme: any;
  }): Promise<string> {
    const { data: collection, error } = await supabase
      .from('ai_collections')
      .insert({
        name: data.theme.name,
        slug: data.theme.slug,
        description: data.theme.description,
        theme: data.theme.theme,
        curator_personality: data.theme.curatorPersonality,
        curation_reasoning: data.reasoning,
        product_ids: data.productIds,
        color_scheme: data.colorScheme,
        status: 'active',
        visibility: 'public',
        active_from: new Date().toISOString(),
        ai_generated: true,
        last_ai_refresh: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create collection: ${error.message}`);
    }

    return collection.id;
  }

  /**
   * Refresh an existing collection with new products
   */
  async refreshCollection(collectionId: string): Promise<boolean> {
    try {
      // Fetch current collection
      const { data: collection, error } = await supabase
        .from('ai_collections')
        .select('*')
        .eq('id', collectionId)
        .single();

      if (error || !collection) {
        console.error('Collection not found');
        return false;
      }

      // Check performance
      const engagement = await this.calculateEngagement(collectionId);
      
      // If performance is good (>60), keep it. If poor (<40), refresh it.
      if (engagement > 60) {
        console.log(`Collection ${collection.name} performing well. No refresh needed.`);
        return true;
      }

      console.log(`Refreshing collection ${collection.name} due to low engagement (${engagement})`);

      // Fetch new candidates
      const theme: CollectionTheme = {
        name: collection.name,
        slug: collection.slug,
        description: collection.description,
        theme: collection.theme,
        curatorPersonality: collection.curator_personality
      };

      const products = await this.fetchCandidateProducts(theme);
      const selectedProducts = await this.aiSelectProducts(
        products,
        theme,
        { minProducts: 4, maxProducts: 8, themeCoherence: 0.8 }
      );

      // Update collection
      const { error: updateError } = await supabase
        .from('ai_collections')
        .update({
          product_ids: selectedProducts.map(p => p.id),
          last_ai_refresh: new Date().toISOString(),
          version: collection.version + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', collectionId);

      if (updateError) {
        console.error('Error updating collection:', updateError);
        return false;
      }

      // Log evolution
      await this.logEvolution(collectionId, 'refreshed', 'performance_trigger', {
        previous_engagement: engagement,
        new_product_count: selectedProducts.length,
        reason: 'Low engagement triggered automatic refresh'
      });

      return true;
    } catch (error) {
      console.error('Error refreshing collection:', error);
      return false;
    }
  }

  /**
   * Generate personalized collection for a specific user
   */
  async generatePersonalizedCollection(userId: string): Promise<string | null> {
    try {
      // Fetch user preferences from analytics
      const { data: userActivity } = await supabase
        .from('world_analytics')
        .select('entity_id, entity_type, metric_type, metric_value')
        .eq('user_id', userId)
        .in('metric_type', ['view', 'engagement', 'conversion'])
        .order('recorded_at', { ascending: false })
        .limit(100);

      if (!userActivity || userActivity.length === 0) {
        console.log('No user activity found, cannot personalize');
        return null;
      }

      // Analyze user preferences
      const preferences = this.analyzeUserPreferences(userActivity);

      // Fetch products matching preferences
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .limit(50);

      if (!products || products.length < 4) {
        return null;
      }

      // Use AI to create personalized collection
      const theme: CollectionTheme = {
        name: `Just for You`,
        slug: `personalized-${userId}-${Date.now()}`,
        description: 'A collection curated specifically for your tastes and interests',
        theme: 'personalized',
        curatorPersonality: 'Your Personal AI Shopper'
      };

      const selectedProducts = await this.aiSelectProducts(
        products as Product[],
        theme,
        { minProducts: 4, maxProducts: 6, themeCoherence: 0.7 }
      );

      const reasoning = {
        summary: `Based on your browsing and purchase patterns, we've selected these items we think you'll love`,
        userPreferences: preferences,
        selectionMethod: 'ai_personalization'
      };

      const colorScheme = { primary: '#8b5cf6', secondary: '#7c3aed', accent: '#ec4899' };

      const collectionId = await this.createCollectionInDatabase({
        theme,
        productIds: selectedProducts.map(p => p.id),
        reasoning,
        colorScheme
      });

      // Link to user
      await supabase.from('user_collection_affinity').insert({
        user_id: userId,
        collection_id: collectionId,
        affinity_score: 85.0,
        personalized_product_order: selectedProducts.map(p => p.id)
      });

      return collectionId;
    } catch (error) {
      console.error('Error generating personalized collection:', error);
      return null;
    }
  }

  /**
   * Analyze user activity to extract preferences
   */
  private analyzeUserPreferences(activity: any[]): any {
    const categories: Record<string, number> = {};
    const products: Record<string, number> = {};

    activity.forEach(event => {
      if (event.entity_type === 'product') {
        products[event.entity_id] = (products[event.entity_id] || 0) + 1;
      }
    });

    return {
      topProducts: Object.entries(products)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([id]) => id),
      engagementLevel: activity.filter(e => e.metric_type === 'engagement').length
    };
  }

  /**
   * Calculate engagement score for a collection
   */
  private async calculateEngagement(collectionId: string): Promise<number> {
    const { data } = await supabase
      .rpc('calculate_collection_engagement', {
        p_collection_id: collectionId,
        p_days: 7
      });

    return data || 0;
  }

  /**
   * Log collection evolution event
   */
  private async logEvolution(
    collectionId: string,
    evolutionType: string,
    triggeredBy: string,
    changes: any
  ): Promise<void> {
    await supabase.from('collection_evolution_log').insert({
      collection_id: collectionId,
      evolution_type: evolutionType,
      triggered_by: triggeredBy,
      changes,
      ai_reasoning: JSON.stringify(changes),
      created_at: new Date().toISOString()
    });
  }

  /**
   * Generate theme-appropriate color scheme
   */
  private generateColorScheme(theme: string): any {
    const schemes: Record<string, any> = {
      wellness: { primary: '#10b981', secondary: '#059669', accent: '#fbbf24' },
      tech: { primary: '#3b82f6', secondary: '#1d4ed8', accent: '#f59e0b' },
      seasonal: { primary: '#d97706', secondary: '#92400e', accent: '#dc2626' },
      trending: { primary: '#ec4899', secondary: '#db2777', accent: '#f59e0b' },
      personalized: { primary: '#8b5cf6', secondary: '#7c3aed', accent: '#ec4899' }
    };

    return schemes[theme] || { primary: '#6b7280', secondary: '#374151', accent: '#f3f4f6' };
  }

  /**
   * Get current season for seasonal collections
   */
  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  /**
   * Auto-curate collections based on current trends and seasons
   */
  async autoCurateCollections(): Promise<string[]> {
    const themes: CollectionTheme[] = [
      {
        name: 'Trending Now',
        slug: `trending-${Date.now()}`,
        description: 'The hottest products everyone is talking about',
        theme: 'trending',
        curatorPersonality: 'Trend Scout AI'
      },
      {
        name: `${this.getCurrentSeason()} Essentials`,
        slug: `${this.getCurrentSeason()}-essentials-${Date.now()}`,
        description: `Perfect picks for ${this.getCurrentSeason()}`,
        theme: 'seasonal',
        curatorPersonality: 'Seasonal Curator',
        season: this.getCurrentSeason()
      }
    ];

    const createdIds: string[] = [];

    for (const theme of themes) {
      const id = await this.curateCollection(theme);
      if (id) {
        createdIds.push(id);
      }
    }

    return createdIds;
  }
}

// Export singleton instance
export const collectionCurator = new CollectionCurator();
