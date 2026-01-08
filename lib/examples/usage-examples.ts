// Example: Complete Product Creation Flow with All AI Features
// This demonstrates how all AI features work together

import { supabase } from '@/lib/supabaseClient';
import { generateProductDescription } from '@/lib/ai/generateDescription';
import { generateProductTags } from '@/lib/ai/generateTags';
import { generateSEOMetadata } from '@/lib/ai/generateSEO';
import { generateSocialMediaAssets } from '@/lib/ai/generateSocial';
import { generateProductEmbedding, updateProductEmbedding } from '@/lib/ai/semanticSearch';

interface ProductInput {
  name: string;
  category: string;
  districtTheme: string;
  price: number;
  imageUrl: string;
  microstoreId: string;
}

/**
 * Complete AI-powered product creation workflow
 * This function demonstrates using all AI features together
 */
export async function createAIEnhancedProduct(input: ProductInput) {
  const { name, category, districtTheme, price, imageUrl, microstoreId } = input;

  try {
    console.log('🤖 Starting AI-enhanced product creation...');

    // Step 1: Generate product description with AI
    console.log('📝 Generating product description...');
    const descriptionResult = await generateProductDescription(
      name,
      category,
      districtTheme
    );

    // Step 2: Generate tags with AI
    console.log('🏷️  Generating product tags...');
    const tags = await generateProductTags(
      name,
      descriptionResult.longDescription,
      districtTheme
    );

    // Step 3: Create the product in database
    console.log('💾 Creating product in database...');
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        name,
        description: descriptionResult.longDescription,
        price,
        image_url: imageUrl,
        tags,
        microstore_id: microstoreId,
      })
      .select()
      .single();

    if (productError || !product) {
      throw new Error('Failed to create product');
    }

    console.log('✅ Product created:', product.id);

    // Step 4: Generate and store embedding for semantic search
    console.log('🔍 Generating search embedding...');
    const embedding = await generateProductEmbedding(
      name,
      descriptionResult.longDescription,
      tags
    );
    await updateProductEmbedding(product.id, embedding);

    // Step 5: Generate SEO metadata
    console.log('📈 Generating SEO metadata...');
    const seoMetadata = await generateSEOMetadata(
      name,
      descriptionResult.longDescription,
      `${category} in ${districtTheme}`
    );

    // Store SEO metadata
    await supabase.from('product_seo').insert({
      product_id: product.id,
      meta_title: seoMetadata.title,
      meta_description: seoMetadata.description,
      keywords: seoMetadata.keywords,
      og_title: seoMetadata.ogTitle,
      og_description: seoMetadata.ogDescription,
    });

    // Step 6: Generate social media content
    console.log('📱 Generating social media content...');
    const socialAssets = await generateSocialMediaAssets(
      name,
      descriptionResult.longDescription,
      districtTheme
    );

    // Store social media content
    await supabase.from('product_social').insert({
      product_id: product.id,
      tiktok_hook: socialAssets.tiktokHook,
      instagram_caption: socialAssets.instagramCaption,
      tweet: socialAssets.tweet,
      hashtags: socialAssets.hashtags,
    });

    console.log('🎉 AI-enhanced product creation complete!');

    return {
      product,
      description: descriptionResult,
      tags,
      seo: seoMetadata,
      social: socialAssets,
    };
  } catch (error) {
    console.error('❌ Error creating AI-enhanced product:', error);
    throw error;
  }
}

/**
 * Example usage:
 * 
 * const result = await createAIEnhancedProduct({
 *   name: 'Wireless Gaming Headset Pro',
 *   category: 'Electronics',
 *   districtTheme: 'Tech District',
 *   price: 149.99,
 *   imageUrl: 'https://example.com/headset.jpg',
 *   microstoreId: 'your-microstore-id'
 * });
 * 
 * console.log('Created product:', result.product);
 * console.log('AI Description:', result.description);
 * console.log('AI Tags:', result.tags);
 * console.log('SEO Metadata:', result.seo);
 * console.log('Social Content:', result.social);
 */

/**
 * Example: Using semantic search
 */
export async function searchProductsExample() {
  const { semanticSearch } = await import('@/lib/ai/semanticSearch');
  
  // Natural language search
  const results = await semanticSearch(
    'comfortable wireless headphones for gaming',
    10,
    0.7 // similarity threshold
  );

  console.log('Search results:', results);
  return results;
}

/**
 * Example: Getting personalized recommendations
 */
export async function getRecommendationsExample(productId: string) {
  const { getSimilarProducts } = await import('@/lib/recommendations/engine');
  
  const recommendations = await getSimilarProducts(productId, 6);
  
  console.log('Recommended products:', recommendations);
  return recommendations;
}

/**
 * Example: Tracking analytics
 */
export async function trackAnalyticsExample(productId: string, microstoreId: string) {
  const { trackProductView, trackAddToCart } = await import('@/lib/analytics/tracking');
  
  // Track a product view
  await trackProductView(productId, microstoreId);
  
  // Track add to cart
  await trackAddToCart(productId, microstoreId, 99.99);
  
  console.log('Analytics tracked');
}

/**
 * Example: Admin dashboard data
 */
export async function getDashboardDataExample() {
  const {
    getAnalyticsSummary,
    getTopProductsByEvent,
    getDistrictPopularity,
  } = await import('@/lib/analytics/tracking');

  const summary = await getAnalyticsSummary();
  const topProducts = await getTopProductsByEvent('view', 10);
  const districts = await getDistrictPopularity(5);

  console.log('Dashboard Summary:', summary);
  console.log('Top Products:', topProducts);
  console.log('Popular Districts:', districts);

  return { summary, topProducts, districts };
}

/**
 * Example: Cart operations
 */
export function cartOperationsExample() {
  const { useCartStore } = require('@/lib/store/cartStore');
  const store = useCartStore.getState();

  // Add item to cart
  store.addItem({
    productId: 'product-id',
    name: 'Product Name',
    price: 99.99,
    imageUrl: 'https://example.com/image.jpg',
    microstoreId: 'microstore-id',
  });

  // Get cart totals
  const totalItems = store.getTotalItems();
  const totalPrice = store.getTotalPrice();

  console.log('Cart:', { totalItems, totalPrice });
}

/**
 * Example: Complete shopping flow
 */
export async function completeShoppingFlowExample() {
  console.log('=== Complete Shopping Flow Example ===\n');

  // 1. Search for products
  console.log('1. Customer searches for products...');
  const searchResults = await searchProductsExample();

  // 2. View product (analytics tracked)
  console.log('\n2. Customer views a product...');
  const productId = searchResults[0]?.id;
  const microstoreId = searchResults[0]?.microstore_id;
  if (productId && microstoreId) {
    await trackAnalyticsExample(productId, microstoreId);
  }

  // 3. Get recommendations
  console.log('\n3. Show product recommendations...');
  if (productId) {
    await getRecommendationsExample(productId);
  }

  // 4. Add to cart
  console.log('\n4. Customer adds to cart...');
  cartOperationsExample();

  // 5. Admin views dashboard
  console.log('\n5. Admin checks dashboard...');
  await getDashboardDataExample();

  console.log('\n=== Shopping Flow Complete ===');
}

// Export for use in scripts or API routes
export default {
  createAIEnhancedProduct,
  searchProductsExample,
  getRecommendationsExample,
  trackAnalyticsExample,
  getDashboardDataExample,
  cartOperationsExample,
  completeShoppingFlowExample,
};
