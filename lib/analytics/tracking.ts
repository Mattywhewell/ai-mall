import { supabase } from '../supabaseClient';

export type AnalyticsEventType =
  | 'view'
  | 'click'
  | 'add_to_cart'
  | 'purchase'
  | 'search';

export interface AnalyticsEvent {
  event_type: AnalyticsEventType;
  product_id?: string;
  microstore_id?: string;
  metadata?: Record<string, any>;
}

export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  try {
    const { error } = await supabase.from('analytics').insert({
      event_type: event.event_type,
      product_id: event.product_id,
      microstore_id: event.microstore_id,
      metadata: event.metadata || {},
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Analytics tracking error:', error);
    }
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

export async function trackProductView(
  productId: string,
  microstoreId: string
): Promise<void> {
  await trackEvent({
    event_type: 'view',
    product_id: productId,
    microstore_id: microstoreId,
  });
}

export async function trackProductClick(
  productId: string,
  microstoreId: string
): Promise<void> {
  await trackEvent({
    event_type: 'click',
    product_id: productId,
    microstore_id: microstoreId,
  });
}

export async function trackAddToCart(
  productId: string,
  microstoreId: string,
  price: number
): Promise<void> {
  await trackEvent({
    event_type: 'add_to_cart',
    product_id: productId,
    microstore_id: microstoreId,
    metadata: { price },
  });
}

export async function trackSearch(query: string, resultsCount: number): Promise<void> {
  await trackEvent({
    event_type: 'search',
    metadata: { query, results_count: resultsCount },
  });
}

// Analytics queries for dashboard
// Global Market Intelligence Queries
// E-commerce Marketplace Analytics (Jungle Scout, Helium 10, DataHawk style)
export async function getMarketplaceKeywordTrends(keyword: string): Promise<any[]> {
  const { data, error } = await supabase.rpc('get_marketplace_keyword_trends', { p_keyword: keyword });
  if (error) {
    console.error('Error fetching marketplace keyword trends:', error);
    return [];
  }
  return data || [];
}

export async function getMarketplaceCategoryLeaders(category: string): Promise<any[]> {
  const { data, error } = await supabase.rpc('get_marketplace_category_leaders', { p_category: category });
  if (error) {
    console.error('Error fetching marketplace category leaders:', error);
    return [];
  }
  return data || [];
}

// AI-driven Forecasting & Trend Tools
export async function getAIForecastedSales(productId: string): Promise<any> {
  const { data, error } = await supabase.rpc('get_ai_forecasted_sales', { p_product_id: productId });
  if (error) {
    console.error('Error fetching AI forecasted sales:', error);
    return null;
  }
  return data || null;
}

export async function getAITrendDetection(): Promise<any[]> {
  const { data, error } = await supabase.rpc('get_ai_trend_detection');
  if (error) {
    console.error('Error fetching AI trend detection:', error);
    return [];
  }
  return data || [];
}
export async function getGlobalSalesByCountry(): Promise<any[]> {
  const { data, error } = await supabase.rpc('get_global_sales_by_country');
  if (error) {
    console.error('Error fetching global sales by country:', error);
    return [];
  }
  return data || [];
}

export async function getGlobalSalesByRegion(): Promise<any[]> {
  const { data, error } = await supabase.rpc('get_global_sales_by_region');
  if (error) {
    console.error('Error fetching global sales by region:', error);
    return [];
  }
  return data || [];
}

export async function getGlobalTopProducts(limit: number = 10): Promise<any[]> {
  const { data, error } = await supabase.rpc('get_global_top_products', { p_limit: limit });
  if (error) {
    console.error('Error fetching global top products:', error);
    return [];
  }
  return data || [];
}

export async function getGlobalRevenueTrend(): Promise<any[]> {
  const { data, error } = await supabase.rpc('get_global_revenue_trend');
  if (error) {
    console.error('Error fetching global revenue trend:', error);
    return [];
  }
  return data || [];
}
export async function getProductViewCount(productId: string): Promise<number> {
  const { count, error } = await supabase
    .from('analytics')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', productId)
    .eq('event_type', 'view');

  if (error) {
    console.error('Error fetching view count:', error);
    return 0;
  }

  return count || 0;
}

export async function getTopProductsByEvent(
  eventType: AnalyticsEventType,
  limit: number = 10
): Promise<any[]> {
  const { data, error } = await supabase.rpc('get_top_products_by_event', {
    p_event_type: eventType,
    p_limit: limit,
  });

  if (error) {
    console.error('Error fetching top products:', error);
    return [];
  }

  return data || [];
}

export async function getDistrictPopularity(limit: number = 10): Promise<any[]> {
  const { data, error } = await supabase.rpc('get_district_popularity', {
    p_limit: limit,
  });

  if (error) {
    console.error('Error fetching district popularity:', error);
    return [];
  }

  return data || [];
}

export async function getAnalyticsSummary(): Promise<{
  totalViews: number;
  totalClicks: number;
  totalAddToCarts: number;
  totalPurchases: number;
}> {
  const { data, error } = await supabase.rpc('get_analytics_summary');

  if (error) {
    console.error('Error fetching analytics summary:', error);
    return {
      totalViews: 0,
      totalClicks: 0,
      totalAddToCarts: 0,
      totalPurchases: 0,
    };
  }

  return data || { totalViews: 0, totalClicks: 0, totalAddToCarts: 0, totalPurchases: 0 };
}
