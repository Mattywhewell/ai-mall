import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';
import { PayoutProcessor } from '@/lib/revenue/payout-processor';

/**
 * GET /api/admin/payouts
 * Admin dashboard - get all pending and recent payouts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, completed, failed, all
    const method = searchParams.get('method'); // instant, weekly, monthly

    // Build query
    let query = supabase
      .from('supplier_payouts')
      .select(`
        *,
        suppliers:supplier_id (
          business_name,
          payout_email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (method) {
      query = query.eq('payout_method', method);
    }

    const { data: payouts, error } = await query;

    if (error) {
      throw error;
    }

    // Get summary statistics
    const { data: stats } = await supabase
      .from('supplier_payout_summary')
      .select('*');

    // Calculate totals
    const summary = {
      totalSuppliers: stats?.length || 0,
      pendingPayouts: payouts?.filter(p => p.status === 'pending').length || 0,
      pendingAmount: payouts?.reduce((sum, p) => sum + (p.status === 'pending' ? p.net_amount : 0), 0) || 0,
      completedThisMonth: payouts?.filter(p => 
        p.status === 'completed' && 
        new Date(p.completed_at).getMonth() === new Date().getMonth()
      ).length || 0,
      completedAmountThisMonth: payouts?.reduce((sum, p) => {
        if (p.status === 'completed' && new Date(p.completed_at).getMonth() === new Date().getMonth()) {
          return sum + p.net_amount;
        }
        return sum;
      }, 0) || 0,
      failedPayouts: payouts?.filter(p => p.status === 'failed').length || 0,
    };

    return NextResponse.json({
      payouts: payouts || [],
      summary,
      supplierStats: stats || [],
    });
  } catch (error) {
    console.error('[Admin Payout API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch payouts',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/payouts
 * Admin actions: complete manual payout, retry failed payout, etc.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, payoutId, supplierId, adminNotes } = body;

    switch (action) {
      case 'complete_manual':
        if (!payoutId) {
          return NextResponse.json({ error: 'payoutId required' }, { status: 400 });
        }
        await PayoutProcessor.completeManualPayout(payoutId, adminNotes);
        return NextResponse.json({ success: true, message: 'Payout marked as completed' });

      case 'trigger_payout':
        if (!supplierId) {
          return NextResponse.json({ error: 'supplierId required' }, { status: 400 });
        }
        const result = await PayoutProcessor.triggerManualPayout(supplierId);
        return NextResponse.json({ success: result.success, result });

      case 'cancel_payout':
        if (!payoutId) {
          return NextResponse.json({ error: 'payoutId required' }, { status: 400 });
        }
        await supabase
          .from('supplier_payouts')
          .update({ status: 'cancelled', admin_notes: adminNotes })
          .eq('id', payoutId);
        return NextResponse.json({ success: true, message: 'Payout cancelled' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[Admin Payout API] Error:', error);
    return NextResponse.json(
      {
        error: 'Action failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
