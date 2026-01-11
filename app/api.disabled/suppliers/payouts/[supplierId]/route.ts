import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

/**
 * GET /api/suppliers/payouts/[supplierId]
 * Get payout history and pending payouts for a supplier
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {    const supabase = getSupabaseClient();    const { supplierId } = await params;

    // Get supplier info
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', supplierId)
      .single();

    if (supplierError || !supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    // Get payout history
    const { data: payouts, error: payoutsError } = await supabase
      .from('supplier_payouts')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (payoutsError) {
      throw payoutsError;
    }

    // Calculate current unpaid earnings
    const { data: unpaidRevenue, error: revenueError } = await supabase
      .from('revenue')
      .select('amount')
      .eq('supplier_id', supplierId)
      .or('payout_status.is.null,payout_status.eq.unpaid');

    const unpaidEarnings = unpaidRevenue?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
    const netUnpaid = unpaidEarnings * (1 - supplier.commission_rate / 100);

    // Get payout transactions for latest payout
    let latestTransactions: any[] = [];
    if (payouts && payouts.length > 0) {
      const { data: transactions } = await supabase
        .from('payout_transactions')
        .select('*')
        .eq('payout_id', payouts[0].id)
        .order('created_at', { ascending: false });
      
      latestTransactions = transactions || [];
    }

    return NextResponse.json({
      supplier: {
        id: supplier.id,
        business_name: supplier.business_name,
        payout_method: supplier.payout_method,
        commission_rate: supplier.commission_rate,
        minimum_payout_threshold: supplier.minimum_payout_threshold,
        stripe_account_id: supplier.stripe_account_id,
        payout_email: supplier.payout_email,
        last_payout_date: supplier.last_payout_date,
        next_payout_date: supplier.next_payout_date,
      },
      payouts: payouts || [],
      unpaidEarnings: {
        gross: unpaidEarnings,
        commission: unpaidEarnings * (supplier.commission_rate / 100),
        net: netUnpaid,
        belowThreshold: netUnpaid < supplier.minimum_payout_threshold,
      },
      latestTransactions,
      summary: {
        totalPayouts: payouts?.length || 0,
        totalPaid: payouts?.reduce((sum, p) => sum + (p.status === 'completed' ? p.net_amount : 0), 0) || 0,
        pendingAmount: payouts?.reduce((sum, p) => sum + (p.status === 'pending' ? p.net_amount : 0), 0) || 0,
      },
    });
  } catch (error) {
    console.error('[Payout API] Error fetching supplier payouts:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch payouts',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
