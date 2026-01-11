import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

/**
 * GET /api/supplier/stats
 * Get supplier dashboard statistics
 */
export async function GET() {
  try {
    const supabase = getSupabaseClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is a supplier
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id, status')
      .eq('user_id', user.id)
      .single();

    if (supplierError || !supplier || supplier.status !== 'active') {
      return NextResponse.json(
        { error: 'Supplier account not found or not active' },
        { status: 403 }
      );
    }

    const supplierId = supplier.id;

    // Get product count for this supplier
    const { count: totalProducts, error: productsError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', supplierId);

    if (productsError) {
      console.error('Products count error:', productsError);
    }

    // Get active orders count (orders containing supplier's products)
    const { count: activeOrders, error: ordersError } = await supabase
      .from('order_items')
      .select('*', { count: 'exact', head: true })
      .in('product_id',
        (await supabase
          .from('products')
          .select('id')
          .eq('supplier_id', supplierId)
        ).data?.map(p => p.id) || []
      );

    if (ordersError) {
      console.error('Orders count error:', ordersError);
    }

    // Get revenue data (sum of order items for supplier's products)
    const { data: revenueData, error: revenueError } = await supabase
      .from('order_items')
      .select('price, quantity, created_at')
      .in('product_id',
        (await supabase
          .from('products')
          .select('id')
          .eq('supplier_id', supplierId)
        ).data?.map(p => p.id) || []
      );

    if (revenueError) {
      console.error('Revenue data error:', revenueError);
    }

    // Calculate revenue metrics
    const totalRevenue = revenueData?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
    const monthlyRevenue = revenueData
      ?.filter(item => {
        const itemDate = new Date(item.created_at);
        const now = new Date();
        return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;

    // Mock analytics data (would come from analytics table in production)
    const totalViews = Math.floor(Math.random() * 10000) + 1000;
    const conversionRate = ((activeOrders || 0) / totalViews * 100);

    // Get low stock items
    const { count: lowStockItems, error: stockError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', supplierId)
      .lt('stock_quantity', 10);

    if (stockError) {
      console.error('Low stock count error:', stockError);
    }

    // Get supplier info
    const { data: supplierData, error: supplierDataError } = await supabase
      .from('suppliers')
      .select('website, website_analysis, integration_status, stripe_account_id, stripe_connected_at')
      .eq('id', supplierId)
      .single();

    if (supplierDataError) {
      console.error('Supplier data error:', supplierDataError);
    }

    return NextResponse.json({
      totalProducts: totalProducts || 0,
      activeOrders: activeOrders || 0,
      totalRevenue,
      monthlyRevenue,
      totalViews,
      conversionRate: Math.round(conversionRate * 100) / 100,
      lowStockItems: lowStockItems || 0,
      website: supplierData?.website,
      websiteAnalysis: supplierData?.website_analysis,
      integrationStatus: supplierData?.integration_status,
      stripeConnected: !!supplierData?.stripe_account_id,
      stripeAccountId: supplierData?.stripe_account_id
    });
  } catch (error) {
    console.error('Supplier stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supplier statistics' },
      { status: 500 }
    );
  }
}
