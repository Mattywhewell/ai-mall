import { generateEmbedding } from './openaiClient';
import { supabase } from '../supabaseClient';

export async function generateProductEmbedding(
  productName: string,
  description: string,
  tags: string[]
): Promise<number[]> {
  // Combine product information into a single text for embedding
  const combinedText = `${productName}. ${description}. Tags: ${tags.join(', ')}`;
  return await generateEmbedding(combinedText);
}

export interface SearchResult {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  tags: string[];
  microstore_id: string;
  similarity: number;
}

export async function semanticSearch(
  query: string,
  limit: number = 10,
  threshold: number = 0.7
): Promise<SearchResult[]> {
  try {
    // Generate embedding for search query
    const queryEmbedding = await generateEmbedding(query);

    // Call Supabase function for similarity search
    const { data, error } = await supabase.rpc('search_products', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
    });

    if (error) {
      console.error('Semantic search error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to perform semantic search:', error);
    return [];
  }
}

export async function updateProductEmbedding(
  productId: string,
  embedding: number[]
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('products')
      .update({ embedding })
      .eq('id', productId);

    if (error) {
      console.error('Failed to update embedding:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to update product embedding:', error);
    return false;
  }
}
