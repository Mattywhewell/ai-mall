import { NextResponse } from 'next/server';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Capture daily growth metrics
    const { error: metricsError } = await supabase.rpc('capture_daily_growth_metrics');
    if (metricsError) throw metricsError;

    // Update all customer LTVs
    const { data: customers } = await supabase
      .from('orders')
      .select('user_id')
      .not('user_id', 'is', null);

    const uniqueCustomers = [...new Set(customers?.map(c => c.user_id))];
    
    for (const userId of uniqueCustomers.slice(0, 100)) { // Process 100 per run
      await supabase.rpc('update_customer_ltv', { p_user_id: userId });
    }

    // Update product analytics
    const today = new Date().toISOString().split('T')[0];
    const { data: products } = await supabase
      .from('products')
      .select('id');

    for (const product of products?.slice(0, 50) || []) { // Process 50 per run
      const { data: orders } = await supabase
        .from('orders')
        .select('amount')
        .contains('products', [product.id])
        .gte('created_at', today);

      await supabase
        .from('product_analytics')
        .upsert({
          date: today,
          product_id: product.id,
          purchases: orders?.length || 0,
          revenue: orders?.reduce((sum, o) => sum + parseFloat(o.amount), 0) || 0,
        }, {
          onConflict: 'date,product_id',
        });
    }

    return NextResponse.json({
      success: true,
      message: 'Daily growth metrics captured',
      customers_processed: uniqueCustomers.slice(0, 100).length,
      products_processed: products?.slice(0, 50).length || 0,
    });

  } catch (error: any) {
    console.error('Growth metrics cron error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
