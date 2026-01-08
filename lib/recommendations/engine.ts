import { supabase } from '../supabaseClient';
import { Product } from '../types';

export interface RecommendationOptions {
  userId?: string;
  currentProductId?: string;
  districtSlug?: string;
  tags?: string[];
  limit?: number;
}

export async function getRecommendedProducts(
  options: RecommendationOptions
): Promise<Product[]> {
  const { currentProductId, districtSlug, tags, limit = 6 } = options;

  try {
    let query = supabase.from('products').select(`
      *,
      microstore:microstores(slug)
    `);

    // Exclude current product if viewing a product page
    if (currentProductId) {
      query = query.neq('id', currentProductId);
    }

    // Filter by district if provided
    if (districtSlug) {
      query = query.eq('microstore.slug', districtSlug);
    }

    const { data: products, error } = await query.limit(limit * 2);

    if (error) throw error;

    if (!products || products.length === 0) return [];

    // Score products based on tag similarity
    const scoredProducts = products.map((product) => {
      let score = Math.random(); // Base randomness

      if (tags && product.tags) {
        const tagMatches = product.tags.filter((tag: string) =>
          tags.some((t) => t.toLowerCase() === tag.toLowerCase())
        ).length;
        score += tagMatches * 10; // Boost score for tag matches
      }

      return { ...product, score };
    });

    // Sort by score and return top results
    return scoredProducts
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ score, ...product }) => product);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return [];
  }
}

export async function getTrendingProducts(limit: number = 6): Promise<Product[]> {
  try {
    // Get products with most views in the last 7 days
    const { data, error } = await supabase.rpc('get_trending_products', {
      p_limit: limit,
      p_days: 7,
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching trending products:', error);
    return [];
  }
}

export async function getSimilarProducts(
  productId: string,
  limit: number = 6
): Promise<Product[]> {
  try {
    // Get the current product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('tags, microstore_id')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      console.error('Error fetching product:', productError);
      return [];
    }

    // Find similar products based on tags and microstore
    return await getRecommendedProducts({
      currentProductId: productId,
      tags: product.tags || [],
      limit,
    });
  } catch (error) {
    console.error('Error fetching similar products:', error);
    return [];
  }
}

export async function getPersonalizedRecommendations(
  userId: string,
  limit: number = 6
): Promise<Product[]> {
  try {
    // Get user's browsing history and preferences
    const { data: analytics, error: analyticsError } = await supabase
      .from('analytics')
      .select('product_id, microstore_id')
      .eq('user_id', userId)
      .in('event_type', ['view', 'click', 'add_to_cart'])
      .order('created_at', { ascending: false })
      .limit(20);

    if (analyticsError) {
      console.error('Error fetching user analytics:', analyticsError);
      return getTrendingProducts(limit);
    }

    if (!analytics || analytics.length === 0) {
      return getTrendingProducts(limit);
    }

    // Get products from user's favorite microstores
    const microstoreIds = [
      ...new Set(
        analytics
          .map((a) => a.microstore_id)
          .filter((id): id is string => id !== null)
      ),
    ];

    if (microstoreIds.length === 0) {
      return getTrendingProducts(limit);
    }

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .in('microstore_id', microstoreIds)
      .limit(limit);

    if (error) throw error;

    return products || [];
  } catch (error) {
    console.error('Error fetching personalized recommendations:', error);
    return getTrendingProducts(limit);
  }
}
