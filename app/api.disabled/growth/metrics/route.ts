import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Get growth dashboard data
export async function GET(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30');

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get daily metrics
    const { data: metrics, error: metricsError } = await supabase
      .from('growth_metrics')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (metricsError) throw metricsError;

    // Calculate growth rates
    const latestMetrics = metrics?.[0] || {};
    const previousMetrics = metrics?.[days - 1] || {};

    const revenueGrowth = previousMetrics.daily_revenue 
      ? ((latestMetrics.daily_revenue - previousMetrics.daily_revenue) / previousMetrics.daily_revenue * 100)
      : 0;

    const userGrowth = previousMetrics.dau
      ? ((latestMetrics.dau - previousMetrics.dau) / previousMetrics.dau * 100)
      : 0;

    // Get top performing products
    const { data: topProducts, error: productsError } = await supabase
      .from('product_analytics')
      .select('product_id, revenue, purchases, conversion_rate')
      .gte('date', startDate.toISOString().split('T')[0])
      .order('revenue', { ascending: false })
      .limit(10);

    if (productsError) throw productsError;

    // Get customer segments
    const { data: segments, error: segmentsError } = await supabase
      .from('customer_ltv')
      .select('segment, tier')
      .order('total_spent', { ascending: false });

    if (segmentsError) throw segmentsError;

    const segmentCounts = {
      whale: segments?.filter(s => s.segment === 'whale').length || 0,
      regular: segments?.filter(s => s.segment === 'regular').length || 0,
      at_risk: segments?.filter(s => s.segment === 'at_risk').length || 0,
      churned: segments?.filter(s => s.segment === 'churned').length || 0,
    };

    // Calculate key metrics
    const totalRevenue = metrics?.reduce((sum, m) => sum + parseFloat(m.daily_revenue || 0), 0) || 0;
    const avgDailyRevenue = totalRevenue / days;
    const currentMRR = latestMetrics.mrr || 0;
    const projectedARR = currentMRR * 12;

    return NextResponse.json({
      overview: {
        total_revenue: Math.round(totalRevenue * 100) / 100,
        avg_daily_revenue: Math.round(avgDailyRevenue * 100) / 100,
        current_mrr: Math.round(currentMRR * 100) / 100,
        projected_arr: Math.round(projectedARR * 100) / 100,
        revenue_growth_rate: Math.round(revenueGrowth * 100) / 100,
        user_growth_rate: Math.round(userGrowth * 100) / 100,
      },
      daily_metrics: metrics,
      top_products: topProducts,
      customer_segments: segmentCounts,
      total_customers: segments?.length || 0,
    });

  } catch (error: any) {
    console.error('Growth metrics error:', error);
    return NextResponse.json({
      error: error.message,
      overview: {
        total_revenue: 0,
        avg_daily_revenue: 0,
        current_mrr: 0,
        projected_arr: 0,
        revenue_growth_rate: 0,
        user_growth_rate: 0,
      },
      daily_metrics: [],
      top_products: [],
      customer_segments: {
        whale: 0,
        regular: 0,
        at_risk: 0,
        churned: 0,
      },
      total_customers: 0,
    }, { status: 500 });
  }
}

// Manually trigger daily snapshot
export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  try {
    const { error } = await supabase.rpc('capture_daily_growth_metrics');
    
    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Growth metrics captured',
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
