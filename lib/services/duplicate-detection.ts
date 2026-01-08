/**
 * Duplicate Detection Service
 * Prevents duplicate products using similarity scoring
 */

import { getSupabaseClient } from '../supabase-server';
import { getOpenAI } from '../openai';



interface ProductData {
  title: string;
  description: string;
  price: number;
  category: string;
  supplier_id: string;
  images?: string[];
}

interface DuplicateResult {
  is_duplicate: boolean;
  similarity_score: number;
  duplicate_product_id?: string;
  duplicate_product_title?: string;
  reason?: string;
}

export class DuplicateDetector {
  private SIMILARITY_THRESHOLD = 0.85; // 85% similarity = likely duplicate

  /**
   * Check if a product is a duplicate of existing products
   */
  async checkDuplicate(productData: ProductData): Promise<DuplicateResult> {
    try {
      // Step 1: Generate embedding for the new product
      const productText = this.buildSearchText(productData);
      const embedding = await this.generateEmbedding(productText);

      const supabase = getSupabaseClient();

      // Step 2: Search for similar products using vector similarity
      const { data: similarProducts, error } = await supabase.rpc(
        'search_similar_products',
        {
          query_embedding: embedding,
          match_threshold: this.SIMILARITY_THRESHOLD,
          match_count: 5,
          supplier_filter: productData.supplier_id,
        }
      );

      if (error) {
        console.error('Error searching for duplicates:', error);
        return {
          is_duplicate: false,
          similarity_score: 0,
          reason: 'Error checking for duplicates',
        };
      }

      // Step 3: Check for exact matches first
      const exactMatch = await this.checkExactMatch(productData);
      if (exactMatch.is_duplicate) {
        return exactMatch;
      }

      // Step 4: Check vector similarity results
      if (similarProducts && similarProducts.length > 0) {
        const mostSimilar = similarProducts[0];
        
        if (mostSimilar.similarity >= this.SIMILARITY_THRESHOLD) {
          return {
            is_duplicate: true,
            similarity_score: mostSimilar.similarity,
            duplicate_product_id: mostSimilar.id,
            duplicate_product_title: mostSimilar.title,
            reason: `Found similar product: ${mostSimilar.title}`,
          };
        }
      }

      // Step 5: Check SKU/identifier if provided
      const skuMatch = await this.checkSKUMatch(productData);
      if (skuMatch.is_duplicate) {
        return skuMatch;
      }

      return {
        is_duplicate: false,
        similarity_score: similarProducts?.[0]?.similarity || 0,
      };

    } catch (error) {
      console.error('Duplicate detection error:', error);
      return {
        is_duplicate: false,
        similarity_score: 0,
        reason: 'Error during duplicate check',
      };
    }
  }

  /**
   * Check for exact title/price matches
   */
  private async checkExactMatch(productData: ProductData): Promise<DuplicateResult> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('products')
      .select('id, title')
      .eq('supplier_id', productData.supplier_id)
      .ilike('title', productData.title)
      .eq('price', productData.price)
      .limit(1);

    if (!error && data && data.length > 0) {
      return {
        is_duplicate: true,
        similarity_score: 1.0,
        duplicate_product_id: data[0].id,
        duplicate_product_title: data[0].title,
        reason: 'Exact match: same title and price',
      };
    }

    return { is_duplicate: false, similarity_score: 0 };
  }

  /**
   * Check for SKU matches
   */
  private async checkSKUMatch(productData: any): Promise<DuplicateResult> {
    if (!productData.sku) {
      return { is_duplicate: false, similarity_score: 0 };
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('products')
      .select('id, title, sku')
      .eq('supplier_id', productData.supplier_id)
      .eq('sku', productData.sku)
      .limit(1);

    if (!error && data && data.length > 0) {
      return {
        is_duplicate: true,
        similarity_score: 1.0,
        duplicate_product_id: data[0].id,
        duplicate_product_title: data[0].title,
        reason: `Duplicate SKU: ${productData.sku}`,
      };
    }

    return { is_duplicate: false, similarity_score: 0 };
  }

  /**
   * Build searchable text from product data
   */
  private buildSearchText(productData: ProductData): string {
    return `${productData.title} ${productData.description} ${productData.category}`;
  }

  /**
   * Generate embedding using OpenAI
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const client = getOpenAI();
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  }

  /**
   * Calculate text similarity using fuzzy matching
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);

    const commonWords = words1.filter(word => words2.includes(word));
    const similarity = (2 * commonWords.length) / (words1.length + words2.length);

    return similarity;
  }

  /**
   * Batch check for duplicates
   */
  async checkBatchDuplicates(products: ProductData[]): Promise<Map<number, DuplicateResult>> {
    const results = new Map<number, DuplicateResult>();

    for (let i = 0; i < products.length; i++) {
      const result = await this.checkDuplicate(products[i]);
      results.set(i, result);
    }

    return results;
  }
}

// Supabase function for vector similarity search
// Run this SQL in Supabase SQL Editor:
/*
CREATE OR REPLACE FUNCTION search_similar_products(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  supplier_filter uuid
)
RETURNS TABLE (
  id uuid,
  title text,
  price numeric,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    title,
    price,
    1 - (embedding <=> query_embedding) as similarity
  FROM products
  WHERE supplier_id = supplier_filter
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
*/
