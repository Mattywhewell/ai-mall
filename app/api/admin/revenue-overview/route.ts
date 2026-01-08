import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { searchParams } = new URL(request.url);
  const timeframe = searchParams.get('timeframe') || '30d';

  try {
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'all':
        startDate = new Date('2020-01-01');
        break;
    }

    const startDateISO = startDate.toISOString();

    // Pillar 1: Digital Products
    const { data: digitalProducts } = await supabase
      .from('digital_product_purchases')
      .select('amount_paid')
      .gte('created_at', startDateISO);

    const pillar1 = {
      revenue: digitalProducts?.reduce((sum, p) => sum + parseFloat(p.amount_paid), 0) || 0,
      sales: digitalProducts?.length || 0,
    };

    // Pillar 2: Subscriptions (calculate MRR from active subscriptions)
    const { data: subscriptions } = await supabase
      .from('user_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('status', 'active');

    const pillar2 = {
      revenue: subscriptions?.reduce((sum, s) => {
        const price = s.billing_cycle === 'yearly' 
          ? (s.subscription_plans?.price_yearly || 0) / 12
          : (s.subscription_plans?.price_monthly || 0);
        return sum + price;
      }, 0) || 0,
      active: subscriptions?.length || 0,
    };

    // Pillar 3: Marketplace Fees
    const { data: fees } = await supabase
      .from('marketplace_transactions')
      .select('marketplace_fee')
      .gte('created_at', startDateISO);

    const pillar3 = {
      revenue: fees?.reduce((sum, f) => sum + parseFloat(f.marketplace_fee), 0) || 0,
      transactions: fees?.length || 0,
    };

    // Pillar 4: Supplier Onboarding
    const { data: onboarding } = await supabase
      .from('supplier_onboarding_purchases')
      .select('amount_paid')
      .gte('created_at', startDateISO)
      .eq('status', 'completed');

    const pillar4 = {
      revenue: onboarding?.reduce((sum, o) => sum + parseFloat(o.amount_paid), 0) || 0,
      purchases: onboarding?.length || 0,
    };

    // Pillar 5: AI Credits
    const { data: credits } = await supabase
      .from('ai_credit_transactions')
      .select('amount_paid')
      .eq('transaction_type', 'purchase')
      .gte('created_at', startDateISO);

    const pillar5 = {
      revenue: credits?.reduce((sum, c) => sum + parseFloat(c.amount_paid || 0), 0) || 0,
      purchased: credits?.length || 0,
    };

    // Pillar 6: Featured Ads
    const { data: ads } = await supabase
      .from('featured_placements')
      .select('total_budget, spend_total')
      .gte('created_at', startDateISO);

    const pillar6 = {
      revenue: ads?.reduce((sum, a) => sum + parseFloat(a.total_budget || 0), 0) || 0,
      campaigns: ads?.length || 0,
    };

    const total_revenue = pillar1.revenue + pillar2.revenue + pillar3.revenue + 
                          pillar4.revenue + pillar5.revenue + pillar6.revenue;

    return NextResponse.json({
      stats: {
        pillar1_digital_products: pillar1,
        pillar2_subscriptions: pillar2,
        pillar3_marketplace_fees: pillar3,
        pillar4_onboarding: pillar4,
        pillar5_credits: pillar5,
        pillar6_ads: pillar6,
        total_revenue: Math.round(total_revenue * 100) / 100,
        timeframe,
      },
    });

  } catch (error: any) {
    console.error('Revenue overview error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
