/**
 * Semantic Search with pgvector
 * 
 * Enables:
 * - Natural language product search
 * - "You might also like" recommendations
 * - "People in this district also viewed" logic
 * - Semantic product discovery
 */

import { getSupabaseClient } from '@/lib/supabase-server';
import { getOpenAI } from '../openai';

export class SemanticSearch {
  private get supabase() { return getSupabaseClient(); }

  /**
   * Generate embedding for text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const client = getOpenAI();
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text
    });

    return response.data[0].embedding;
  }

  /**
   * Generate and store product embedding
   */
  async generateProductEmbedding(productId: string): Promise<void> {
    const { data: product } = await this.supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (!product) return;

    // Create searchable text
    const searchText = `${product.name} ${product.description} ${product.category || ''} ${(product.tags || []).join(' ')}`;

    // Generate embedding
    const embedding = await this.generateEmbedding(searchText);

    // Store embedding
    await this.supabase
      .from('products')
      .update({
        embedding: JSON.stringify(embedding),
        embedding_updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    console.log(`✅ Generated embedding for ${product.name}`);
  }

  /**
   * Semantic search for products
   */
  async searchProducts(query: string, limit: number = 10): Promise<any[]> {
    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query);

    // Use pgvector similarity search
    const { data: results, error } = await this.supabase
      .rpc('match_products', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: limit
      });

    if (error) {
      console.error('Semantic search error:', error);
      return [];
    }

    return results || [];
  }

  /**
   * Get similar products (recommendations)
   */
  async getSimilarProducts(productId: string, limit: number = 6): Promise<any[]> {
    const { data: product } = await this.supabase
      .from('products')
      .select('embedding')
      .eq('id', productId)
      .single();

    if (!product || !product.embedding) {
      return [];
    }

    const productEmbedding = JSON.parse(product.embedding);

    const { data: results } = await this.supabase
      .rpc('match_products', {
        query_embedding: productEmbedding,
        match_threshold: 0.8,
        match_count: limit + 1
      });

    // Filter out the original product
    return (results || []).filter((p: any) => p.id !== productId).slice(0, limit);
  }

  /**
   * Get products viewed by others in this district
   */
  async getDistrictRecommendations(districtId: string, userId: string, limit: number = 6): Promise<any[]> {
    // Get products in this district
    const { data: districtProducts } = await this.supabase
      .from('products')
      .select('id')
      .eq('microstore_id', districtId);

    if (!districtProducts) return [];

    const productIds = districtProducts.map(p => p.id);

    // Get what other users viewed in this district
    const { data: viewedProducts } = await this.supabase
      .from('world_analytics')
      .select('entity_id')
      .in('entity_id', productIds)
      .neq('user_id', userId)
      .eq('metric_type', 'view')
      .gte('recorded_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (!viewedProducts) return [];

    // Count views per product
    const viewCounts: Record<string, number> = {};
    viewedProducts.forEach(v => {
      viewCounts[v.entity_id] = (viewCounts[v.entity_id] || 0) + 1;
    });

    // Get top products
    const topProductIds = Object.entries(viewCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([id]) => id);

    const { data: products } = await this.supabase
      .from('products')
      .select('*')
      .in('id', topProductIds);

    return products || [];
  }

  /**
   * Predictive search suggestions
   */
  async getSuggestions(partialQuery: string): Promise<string[]> {
    // Get recent popular searches
    const { data: searches } = await this.supabase
      .from('search_log')
      .select('query, result_count')
      .ilike('query', `${partialQuery}%`)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('result_count', { ascending: false })
      .limit(5);

    return searches?.map(s => s.query) || [];
  }

  /**
   * Log search query
   */
  async logSearch(query: string, userId: string, resultCount: number): Promise<void> {
    await this.supabase
      .from('search_log')
      .insert({
        query,
        user_id: userId,
        result_count: resultCount,
        created_at: new Date().toISOString()
      });
  }

  /**
   * Generate embeddings for all products (one-time migration)
   */
  async generateAllEmbeddings(): Promise<void> {
    console.log('🔄 Generating embeddings for all products...');

    const { data: products } = await this.supabase
      .from('products')
      .select('id, name')
      .is('embedding', null);

    if (!products) {
      console.log('No products need embeddings');
      return;
    }

    console.log(`Found ${products.length} products without embeddings`);

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      await this.generateProductEmbedding(product.id);

      if ((i + 1) % 10 === 0) {
        console.log(`  Generated ${i + 1}/${products.length} embeddings...`);
        // Rate limit
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('✅ All embeddings generated');
  }
}

export const semanticSearch = new SemanticSearch();
