import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

/**
 * GET /api/supplier/stats
 * Get supplier dashboard statistics
 */
export async function GET() {
  try {
    const supabase = getSupabaseClient();
    // Mock supplier ID - in production, get from auth session
    const supplierId = 'supplier_123';

    // Get product count
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', supplierId);

    // Get active orders (mock data for now)
    const activeOrders = 12;

    // Get revenue data (mock for now)
    const monthlyRevenue = 15750;
    const totalRevenue = 87500;
    const totalViews = 3420;
    const conversionRate = 3.5;

    // Get low stock items
    const { count: lowStockItems } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', supplierId)
      .lt('stock_quantity', 10);

    // Get supplier info with website data ✨
    const { data: supplierData } = await supabase
      .from('suppliers')
      .select('website, website_analysis, integration_status, stripe_account_id, stripe_connected_at')
      .eq('id', supplierId)
      .single();

    return NextResponse.json({
      totalProducts: totalProducts || 0,
      activeOrders,
      totalRevenue,
      monthlyRevenue,
      totalViews,
      conversionRate,
      lowStockItems: lowStockItems || 0,
      website: supplierData?.website,
      websiteAnalysis: supplierData?.website_analysis,
      integrationStatus: supplierData?.integration_status,
      stripeConnected: !!supplierData?.stripe_account_id,
      stripeAccountId: supplierData?.stripe_account_id,
    });
  } catch (error) {
    console.error('Supplier stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
