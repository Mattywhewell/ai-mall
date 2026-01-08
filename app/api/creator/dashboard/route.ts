import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

// Get creator dashboard analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storefront_id = searchParams.get('storefront_id');

    if (!storefront_id) {
      return NextResponse.json(
        { error: 'storefront_id required' },
        { status: 400 }
      );
    }

    const supabase_client = supabase;

    // Get storefront details
    const { data: storefront, error: storefrontError } = await supabase_client
      .from('creator_storefronts')
      .select('*')
      .eq('id', storefront_id)
      .single();

    if (storefrontError || !storefront) {
      return NextResponse.json(
        { error: 'Storefront not found' },
        { status: 404 }
      );
    }

    // Get product statistics
    const { data: products, error: productsError } = await supabase_client
      .from('creator_products')
      .select('*')
      .eq('storefront_id', storefront_id);

    if (productsError) {
      console.error('Error fetching products:', productsError);
    }

    const productStats = {
      total: products?.length || 0,
      active: products?.filter(p => p.status === 'active').length || 0,
      draft: products?.filter(p => p.status === 'draft').length || 0,
      soldout: products?.filter(p => p.status === 'soldout').length || 0,
      total_views: products?.reduce((sum, p) => sum + (p.view_count || 0), 0) || 0,
      total_favorites: products?.reduce((sum, p) => sum + (p.favorite_count || 0), 0) || 0
    };

    // Get revenue data
    const { data: revenue, error: revenueError } = await supabase_client
      .from('creator_revenue')
      .select('*')
      .eq('storefront_id', storefront_id)
      .order('created_at', { ascending: false });

    if (revenueError) {
      console.error('Error fetching revenue:', revenueError);
    }

    // Calculate revenue metrics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const revenueStats = {
      total_revenue: revenue?.reduce((sum, r) => 
        r.transaction_type === 'sale' ? sum + parseFloat(r.amount) : sum, 0
      ) || 0,
      total_net: revenue?.reduce((sum, r) => 
        r.transaction_type === 'sale' ? sum + parseFloat(r.net_amount) : sum, 0
      ) || 0,
      last_30_days: revenue?.filter(r => 
        new Date(r.created_at) >= thirtyDaysAgo && r.transaction_type === 'sale'
      ).reduce((sum, r) => sum + parseFloat(r.net_amount), 0) || 0,
      last_7_days: revenue?.filter(r => 
        new Date(r.created_at) >= sevenDaysAgo && r.transaction_type === 'sale'
      ).reduce((sum, r) => sum + parseFloat(r.net_amount), 0) || 0,
      pending_payout: revenue?.filter(r => 
        r.payout_status === 'pending'
      ).reduce((sum, r) => sum + parseFloat(r.net_amount), 0) || 0,
      transactions: revenue?.length || 0
    };

    // Get top products
    const topProducts = products
      ?.sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0))
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        name: p.product_name,
        sales: p.sales_count || 0,
        views: p.view_count || 0,
        revenue: p.base_price * (p.sales_count || 0)
      })) || [];

    // Recent activity
    const recentActivity = revenue
      ?.slice(0, 10)
      .map(r => ({
        id: r.id,
        type: r.transaction_type,
        amount: r.net_amount,
        date: r.created_at,
        status: r.payout_status
      })) || [];

    return NextResponse.json({
      success: true,
      storefront: {
        id: storefront.id,
        name: storefront.storefront_name,
        slug: storefront.slug,
        tier: storefront.storefront_tier,
        status: storefront.status,
        featured: storefront.featured,
        verified: storefront.verified,
        badges: storefront.badges,
        rating: storefront.rating_average,
        total_sales: storefront.total_sales_count,
        total_revenue: storefront.total_revenue
      },
      products: productStats,
      revenue: revenueStats,
      top_products: topProducts,
      recent_activity: recentActivity,
      recommendations: {
        add_products: productStats.total < 5,
        enable_ai_assistant: !storefront.ai_assistant_enabled,
        upgrade_tier: storefront.storefront_tier === 'basic' && productStats.total > 10,
        optimize_pricing: productStats.total_views > 100 && revenueStats.last_7_days < 50
      }
    });

  } catch (error) {
    console.error('Error in dashboard route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
