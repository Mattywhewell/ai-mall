import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

/**
 * GET /api/supplier/stripe/status
 * Get Stripe connection status for current supplier
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

    // Get supplier data
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('stripe_account_id, stripe_connected_at')
      .eq('user_id', user.id)
      .single();

    if (supplierError || !supplier) {
      return NextResponse.json(
        { error: 'Supplier account not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      connected: !!supplier.stripe_account_id,
      accountId: supplier.stripe_account_id,
      connectedAt: supplier.stripe_connected_at
    });
  } catch (error) {
    console.error('Stripe status error:', error);
    return NextResponse.json(
      { error: 'Failed to check Stripe status' },
      { status: 500 }
    );
  }
}