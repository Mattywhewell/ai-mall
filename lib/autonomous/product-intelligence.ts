/**
 * Autonomous Product Intelligence
 * Continuously optimizes product content based on performance
 */

import { supabase } from '../supabaseClient';
import { generateProductDescription } from '../ai/generateDescription';
import { generateProductTags } from '../ai/generateTags';
import { generateSEOMetadata } from '../ai/generateSEO';
import { generateProductEmbedding, updateProductEmbedding } from '../ai/semanticSearch';
import { callOpenAI } from '../ai/openaiClient';

export interface ProductPerformance {
  product_id: string;
  views: number;
  clicks: number;
  add_to_carts: number;
  purchases: number;
  conversion_rate: number;
  engagement_rate: number;
  bounce_rate: number;
  avg_time_on_page: number;
}

export class ProductIntelligence {
  /**
   * Analyze product performance and identify underperformers
   */
  static async analyzeProducts(limit: number = 50): Promise<ProductPerformance[]> {
    const { data, error } = await supabase.rpc('analyze_product_performance', {
      p_limit: limit,
    });

    if (error) {
      console.error('Error analyzing products:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Autonomously optimize a product based on performance
   */
  static async optimizeProduct(productId: string): Promise<boolean> {
    try {
      // Fetch current product data
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*, microstore:microstores(slug, category)')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        console.error('Product not found:', productId);
        return false;
      }

      // Fetch performance metrics
      const performance = await this.getProductPerformance(productId);

      // Determine optimization strategy
      const strategy = await this.determineOptimizationStrategy(product, performance);

      console.log(`🎯 Optimizing ${product.name} with strategy:`, strategy.actions);

      // Apply optimizations
      const updates: any = {};

      if (strategy.actions.includes('rewrite_description')) {
        const newDescription = await this.generateOptimizedDescription(
          product,
          performance,
          strategy.insights
        );
        updates.description = newDescription.longDescription;
      }

      if (strategy.actions.includes('regenerate_tags')) {
        const newTags = await this.generateOptimizedTags(
          product,
          performance,
          strategy.insights
        );
        updates.tags = newTags;
      }

      if (strategy.actions.includes('update_seo')) {
        await this.updateSEOMetadata(productId, product, strategy.insights);
      }

      if (strategy.actions.includes('regenerate_embedding')) {
        const embedding = await generateProductEmbedding(
          product.name,
          updates.description || product.description,
          updates.tags || product.tags
        );
        updates.embedding = embedding;
      }

      // Apply updates
      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('products')
          .update({
            ...updates,
            last_optimized_at: new Date().toISOString(),
          })
          .eq('id', productId);

        if (updateError) {
          console.error('Failed to update product:', updateError);
          return false;
        }
      }

      // Log optimization
      await this.logOptimization(productId, strategy, updates);

      console.log(`✓ Product ${product.name} optimized successfully`);
      return true;
    } catch (error) {
      console.error('Product optimization error:', error);
      return false;
    }
  }

  /**
   * Determine optimization strategy using AI
   */
  private static async determineOptimizationStrategy(
    product: any,
    performance: ProductPerformance
  ): Promise<{ actions: string[]; insights: string }> {
    const systemPrompt = `You are an e-commerce optimization AI. Analyze product performance and suggest specific optimization actions.

Available actions:
- rewrite_description: Rewrite product description for better engagement
- regenerate_tags: Generate new, more relevant tags
- update_seo: Update SEO metadata
- regenerate_embedding: Update semantic search embedding
- adjust_pricing: Suggest pricing strategy (not implemented yet)
- improve_imagery: Suggest better images (not implemented yet)

Return a JSON object with:
{
  "actions": ["action1", "action2"],
  "insights": "Brief explanation of why these actions will help"
}`;

    const userPrompt = `Product: ${product.name}
Category: ${product.microstore?.category || 'general'}
Current Description Length: ${product.description?.length || 0} characters
Current Tags: ${product.tags?.join(', ') || 'none'}

Performance Metrics:
- Views: ${performance.views}
- Clicks: ${performance.clicks}
- Add to Carts: ${performance.add_to_carts}
- Purchases: ${performance.purchases}
- Conversion Rate: ${(performance.conversion_rate * 100).toFixed(2)}%
- Engagement Rate: ${(performance.engagement_rate * 100).toFixed(2)}%
- Bounce Rate: ${(performance.bounce_rate * 100).toFixed(2)}%

Suggest optimization actions.`;

    const response = await callOpenAI(systemPrompt, userPrompt, 0.7);
    
    try {
      const parsed = JSON.parse(response);
      return {
        actions: parsed.actions || ['rewrite_description', 'regenerate_tags'],
        insights: parsed.insights || 'Optimizing for better engagement',
      };
    } catch (error) {
      return {
        actions: ['rewrite_description', 'regenerate_tags'],
        insights: 'Standard optimization applied',
      };
    }
  }

  /**
   * Generate optimized description based on performance insights
   */
  private static async generateOptimizedDescription(
    product: any,
    performance: ProductPerformance,
    insights: string
  ) {
    const systemPrompt = `You are rewriting a product description to improve its performance.

Context: ${insights}

Make the description:
- More compelling and benefit-focused
- Better optimized for search
- More likely to convert viewers to buyers
- Appropriate length (200-400 words)

Return JSON:
{
  "longDescription": "optimized description",
  "shortDescription": "optimized short version",
  "seoKeywords": ["keyword1", "keyword2", ...],
  "tone": "tone used"
}`;

    const userPrompt = `Product: ${product.name}
Current Description: ${product.description}
Category: ${product.microstore?.category}

Performance Issues:
- Low conversion rate: ${(performance.conversion_rate * 100).toFixed(2)}%
- High bounce rate: ${(performance.bounce_rate * 100).toFixed(2)}%

Rewrite for better performance.`;

    const response = await callOpenAI(systemPrompt, userPrompt, 0.8);
    const parsed = JSON.parse(response);
    return parsed;
  }

  /**
   * Generate optimized tags based on performance
   */
  private static async generateOptimizedTags(
    product: any,
    performance: ProductPerformance,
    insights: string
  ): Promise<string[]> {
    const systemPrompt = `You are optimizing product tags for better discoverability.

Context: ${insights}

Generate tags that:
- Improve search visibility
- Match user search intent
- Are specific and relevant
- Help with semantic search

Return JSON array of strings: ["tag1", "tag2", ...]`;

    const userPrompt = `Product: ${product.name}
Description: ${product.description}
Current Tags: ${product.tags?.join(', ')}
Category: ${product.microstore?.category}

Generate 8-12 optimized tags.`;

    const response = await callOpenAI(systemPrompt, userPrompt, 0.7);
    const parsed = JSON.parse(response);
    return parsed;
  }

  /**
   * Update SEO metadata
   */
  private static async updateSEOMetadata(
    productId: string,
    product: any,
    insights: string
  ) {
    const seo = await generateSEOMetadata(
      product.name,
      product.description,
      `E-commerce product in ${product.microstore?.category}. ${insights}`
    );

    await supabase.from('product_seo').upsert({
      product_id: productId,
      meta_title: seo.title,
      meta_description: seo.description,
      keywords: seo.keywords,
      og_title: seo.ogTitle,
      og_description: seo.ogDescription,
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Get product performance metrics
   */
  private static async getProductPerformance(
    productId: string
  ): Promise<ProductPerformance> {
    const { data, error } = await supabase.rpc('get_product_performance', {
      p_product_id: productId,
    });

    if (error || !data || data.length === 0) {
      return {
        product_id: productId,
        views: 0,
        clicks: 0,
        add_to_carts: 0,
        purchases: 0,
        conversion_rate: 0,
        engagement_rate: 0,
        bounce_rate: 0,
        avg_time_on_page: 0,
      };
    }

    return data[0];
  }

  /**
   * Log optimization for tracking
   */
  private static async logOptimization(
    productId: string,
    strategy: any,
    updates: any
  ) {
    await supabase.from('optimization_log').insert({
      entity_type: 'product',
      entity_id: productId,
      strategy: strategy.actions,
      insights: strategy.insights,
      changes: updates,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Batch optimize products
   */
  static async batchOptimize(limit: number = 10): Promise<number> {
    const products = await this.analyzeProducts(limit);
    
    // Filter products that need optimization (low performance)
    const needsOptimization = products.filter(
      (p) => p.conversion_rate < 0.02 || p.engagement_rate < 0.1 || p.bounce_rate > 0.7
    );

    console.log(`🔄 Batch optimizing ${needsOptimization.length} products`);

    let successCount = 0;
    for (const product of needsOptimization) {
      const success = await this.optimizeProduct(product.product_id);
      if (success) successCount++;
      
      // Add delay to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    return successCount;
  }

  /**
   * Generate product variants based on trends
   */
  static async generateVariants(productId: string): Promise<any[]> {
    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (!product) return [];

    const systemPrompt = `You are a product strategist. Based on a successful product, suggest 3-5 variants or related products that could be added to the catalog.

Return JSON array:
[
  {
    "name": "product name",
    "description": "brief description",
    "suggested_price": number,
    "reasoning": "why this variant would work"
  }
]`;

    const userPrompt = `Original Product: ${product.name}
Description: ${product.description}
Price: $${product.price}
Tags: ${product.tags?.join(', ')}

Suggest variants.`;

    try {
      const response = await callOpenAI(systemPrompt, userPrompt, 0.8);
      const variants = JSON.parse(response);
      return variants;
    } catch (error) {
      console.error('Error generating variants:', error);
      return [];
    }
  }
}
