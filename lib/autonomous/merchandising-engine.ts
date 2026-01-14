/**
 * Self-Optimizing Merchandising Engine
 * Dynamically reorders products, runs A/B tests, and optimizes layouts
 */

import { getSupabaseClient } from '@/lib/supabase-server';
import { AIRouter } from '../ai/modelRouter';


export interface MerchandisingRule {
  id: string;
  name: string;
  type: 'boost' | 'demote' | 'pin' | 'hide';
  condition: Record<string, any>;
  weight: number;
  active: boolean;
}

export interface ABTest {
  id: string;
  name: string;
  variant_a: string;
  variant_b: string;
  metric: string;
  winner?: string;
  status: 'running' | 'completed' | 'paused';
  started_at: string;
  completed_at?: string;
}

export class MerchandisingEngine {
  private static get supabase() { return getSupabaseClient(); }

  /**
   * Get optimized product order for a district
   */
  static async getOptimizedProductOrder(
    districtSlug: string,
    userId?: string
  ): Promise<string[]> {
    // Fetch all products in district
    const { data: microstore } = await this.supabase
      .from('microstores')
      .select('id')
      .eq('slug', districtSlug)
      .single();

    if (!microstore) return [];

    const { data: products } = await this.supabase
      .from('products')
      .select('id, name, tags')
      .eq('microstore_id', microstore.id);

    if (!products || products.length === 0) return [];

    // Calculate scores for each product
    const scoredProducts = await Promise.all(
      products.map(async (product) => {
        const score = await this.calculateProductScore(product.id, userId);
        return { id: product.id, score };
      })
    );

    // Sort by score (highest first)
    scoredProducts.sort((a, b) => b.score - a.score);

    return scoredProducts.map((p) => p.id);
  }

  /**
   * Calculate product score for ranking
   */
  private static async calculateProductScore(
    productId: string,
    userId?: string
  ): Promise<number> {
    let score = 0;

    // Base score from performance
    const { data: performance } = await this.supabase.rpc('get_product_score', {
      p_product_id: productId,
    });

    if (performance && performance.length > 0) {
      const perf = performance[0];
      score += perf.conversion_rate * 1000; // Weight conversion heavily
      score += perf.engagement_rate * 500;
      score += (1 - perf.bounce_rate) * 300;
      score += Math.log(perf.views + 1) * 10; // Logarithmic views
    }

    // Apply merchandising rules
    const rules = await this.getActiveRules();
    for (const rule of rules) {
      if (await this.ruleApplies(rule, productId)) {
        score *= rule.weight;
      }
    }

    // Personalization boost if user provided
    if (userId) {
      const personalBoost = await this.getPersonalizationBoost(productId, userId);
      score += personalBoost;
    }

    // Recency boost (newer products get slight advantage)
    const { data: product } = await this.supabase
      .from('products')
      .select('created_at')
      .eq('id', productId)
      .single();

    if (product) {
      const daysSinceCreation =
        (Date.now() - new Date(product.created_at).getTime()) / (1000 * 60 * 60 * 24);
      const recencyBoost = Math.max(0, 100 - daysSinceCreation * 2);
      score += recencyBoost;
    }

    return score;
  }

  /**
   * Get active merchandising rules
   */
  private static async getActiveRules(): Promise<MerchandisingRule[]> {
    const { data, error } = await this.supabase
      .from('merchandising_rules')
      .select('*')
      .eq('active', true)
      .order('weight', { ascending: false });

    return data || [];
  }

  /**
   * Check if rule applies to product
   */
  private static async ruleApplies(
    rule: MerchandisingRule,
    productId: string
  ): Promise<boolean> {
    const { data: product } = await this.supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (!product) return false;

    // Evaluate condition
    if (rule.condition.tags) {
      const requiredTags = rule.condition.tags;
      const hasTag = requiredTags.some((tag: string) =>
        product.tags?.includes(tag)
      );
      if (!hasTag) return false;
    }

    if (rule.condition.price_min && product.price < rule.condition.price_min) {
      return false;
    }

    if (rule.condition.price_max && product.price > rule.condition.price_max) {
      return false;
    }

    return true;
  }

  /**
   * Get personalization boost for user
   */
  private static async getPersonalizationBoost(
    productId: string,
    userId: string
  ): Promise<number> {
    // Check user's interaction history
    const { data: interactions } = await this.supabase
      .from('analytics')
      .select('product_id, event_type')
      .eq('user_id', userId)
      .limit(100);

    if (!interactions) return 0;

    // Get product tags
    const { data: product } = await this.supabase
      .from('products')
      .select('tags')
      .eq('id', productId)
      .single();

    if (!product) return 0;

    // Calculate tag affinity
    const userTagCounts: Record<string, number> = {};
    for (const interaction of interactions) {
      const { data: interactedProduct } = await this.supabase
        .from('products')
        .select('tags')
        .eq('id', interaction.product_id)
        .single();

      if (interactedProduct && interactedProduct.tags) {
        interactedProduct.tags.forEach((tag: string) => {
          userTagCounts[tag] = (userTagCounts[tag] || 0) + 1;
        });
      }
    }

    // Calculate boost based on tag overlap
    let boost = 0;
    product.tags?.forEach((tag: string) => {
      if (userTagCounts[tag]) {
        boost += userTagCounts[tag] * 10;
      }
    });

    return boost;
  }

  /**
   * Create A/B test
   */
  static async createABTest(
    name: string,
    variantA: string,
    variantB: string,
    metric: string
  ): Promise<string> {
    const { data, error } = await this.supabase
      .from('ab_tests')
      .insert({
        name,
        variant_a: variantA,
        variant_b: variantB,
        metric,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  }

  /**
   * Track A/B test result
   */
  static async trackABTestResult(
    testId: string,
    variant: 'a' | 'b',
    metricValue: number
  ) {
    await this.supabase.from('ab_test_results').insert({
      test_id: testId,
      variant,
      metric_value: metricValue,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Analyze A/B test and determine winner
   */
  static async analyzeABTest(testId: string): Promise<'a' | 'b' | null> {
    const { data: results } = await this.supabase
      .from('ab_test_results')
      .select('*')
      .eq('test_id', testId);

    if (!results || results.length < 100) return null; // Need minimum sample size

    const variantA = results.filter((r) => r.variant === 'a');
    const variantB = results.filter((r) => r.variant === 'b');

    const avgA =
      variantA.reduce((sum, r) => sum + r.metric_value, 0) / variantA.length;
    const avgB =
      variantB.reduce((sum, r) => sum + r.metric_value, 0) / variantB.length;

    // Simple significance check (should use proper statistical test)
    const difference = Math.abs(avgA - avgB);
    const pooledAvg = (avgA + avgB) / 2;
    const percentDiff = (difference / pooledAvg) * 100;

    if (percentDiff < 5) return null; // Not significant enough

    return avgA > avgB ? 'a' : 'b';
  }

  /**
   * Auto-create merchandising rules based on performance
   */
  static async autoGenerateRules(): Promise<number> {
    console.log('🧠 Analyzing patterns to generate merchandising rules...');

    // Fetch top-performing products
    const { data: topProducts } = await this.supabase.rpc('get_top_products', {
      p_limit: 20,
    });

    if (!topProducts || topProducts.length === 0) return 0;

    // Analyze common patterns using AI
    const patterns = await this.discoverPatterns(topProducts);

    let rulesCreated = 0;
    for (const pattern of patterns) {
      await this.supabase.from('merchandising_rules').insert({
        name: `Auto-generated: ${pattern.description}`,
        type: 'boost',
        condition: pattern.condition,
        weight: pattern.weight,
        active: true,
        auto_generated: true,
        created_at: new Date().toISOString(),
      });
      rulesCreated++;
    }

    console.log(`✓ Created ${rulesCreated} new merchandising rules`);
    return rulesCreated;
  }

  /**
   * Discover patterns in top products using AI
   */
  private static async discoverPatterns(products: any[]): Promise<any[]> {
    const systemPrompt = `You are a merchandising AI. Analyze top-performing products and discover patterns.

Return JSON array of patterns:
[
  {
    "description": "brief description of pattern",
    "condition": { "tags": ["tag1"], "price_min": 10, "price_max": 100 },
    "weight": 1.2,
    "reasoning": "why this pattern works"
  }
]

Focus on:
- Common tags among top performers
- Price ranges that work well
- Category patterns
- Timing patterns`;

    const productSummary = products
      .map(
        (p) =>
          `- ${p.name}: tags=[${p.tags?.join(', ')}], price=$${p.price}, views=${p.views}`
      )
      .join('\n');

    const userPrompt = `Top performing products:\n${productSummary}\n\nDiscover 3-5 actionable patterns.`;

    try {
      const response = await AIRouter.getInstance().executeTask({
        id: `merch-patterns-${districtSlug}-${Date.now()}`,
        type: 'analysis',
        content: userPrompt,
        systemPrompt,
        temperature: 0.7,
        priority: 'medium'
      });
      const patterns = JSON.parse(response);
      return patterns;
    } catch (error) {
      console.error('Error discovering patterns:', error);
      return [];
    }
  }

  /**
   * Dynamic layout optimization
   */
  static async optimizeLayout(districtSlug: string): Promise<any> {
    const systemPrompt = `You are a UX optimization AI. Suggest layout improvements for an e-commerce district.

Return JSON:
{
  "layout": {
    "grid_columns": 3 or 4,
    "featured_count": number of featured products,
    "sorting_default": "recommended" | "price" | "newest" | "popular"
  },
  "reasoning": "why these changes will improve conversions"
}`;

    const { data: analytics } = await this.supabase.rpc('get_district_analytics', {
      p_district_slug: districtSlug,
    });

    const userPrompt = `District: ${districtSlug}
Performance: ${JSON.stringify(analytics)}

Suggest optimal layout configuration.`;

    try {
      const response = await AIRouter.getInstance().executeTask({
        id: `layout-optimization-${districtSlug}-${Date.now()}`,
        type: 'analysis',
        content: userPrompt,
        systemPrompt,
        temperature: 0.6,
        priority: 'medium'
      });
      const layout = JSON.parse(response);

      // Save layout configuration
      await this.supabase.from('district_layouts').upsert({
        district_slug: districtSlug,
        config: layout.layout,
        reasoning: layout.reasoning,
        updated_at: new Date().toISOString(),
      });

      return layout;
    } catch (error) {
      console.error('Error optimizing layout:', error);
      return null;
    }
  }
}
