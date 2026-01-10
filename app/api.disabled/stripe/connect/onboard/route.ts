import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

/**
 * POST /api/stripe/connect/onboard
 * Initiate Stripe Connect onboarding for supplier
 */
export async function POST(request: Request) {
  try {    const supabase = getSupabaseClient();    const { supplierId } = await request.json();

    if (!supplierId) {
      return NextResponse.json(
        { error: 'Supplier ID required' },
        { status: 400 }
      );
    }

    // Check if supplier exists
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id, business_name, email')
      .eq('id', supplierId)
      .single();

    if (supplierError || !supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    // Generate Stripe Connect OAuth link
    const clientId = process.env.STRIPE_CONNECT_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/stripe/connect/callback`;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Stripe Connect not configured. Please add STRIPE_CONNECT_CLIENT_ID to environment variables.' },
        { status: 500 }
      );
    }

    // Build OAuth URL
    const stripeOAuthUrl = new URL('https://connect.stripe.com/oauth/authorize');
    stripeOAuthUrl.searchParams.append('response_type', 'code');
    stripeOAuthUrl.searchParams.append('client_id', clientId);
    stripeOAuthUrl.searchParams.append('scope', 'read_write');
    stripeOAuthUrl.searchParams.append('redirect_uri', redirectUri);
    stripeOAuthUrl.searchParams.append('state', supplierId); // Pass supplier ID in state

    // Optional: Pre-fill email
    if (supplier.email) {
      stripeOAuthUrl.searchParams.append('stripe_user[email]', supplier.email);
    }

    // Optional: Pre-fill business name
    if (supplier.business_name) {
      stripeOAuthUrl.searchParams.append('stripe_user[business_name]', supplier.business_name);
    }

    return NextResponse.json({
      url: stripeOAuthUrl.toString()
    });
  } catch (error) {
    console.error('Stripe Connect onboarding error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Stripe Connect' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/stripe/connect/onboard?supplierId=xxx
 * Get current Stripe connection status
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId');

    if (!supplierId) {
      return NextResponse.json(
        { error: 'Supplier ID required' },
        { status: 400 }
      );
    }

    // Check if supplier has connected Stripe account
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('stripe_account_id, stripe_connected_at')
      .eq('id', supplierId)
      .single();

    const isConnected = !!(supplier?.stripe_account_id);

    return NextResponse.json({
      connected: isConnected,
      accountId: supplier?.stripe_account_id || null,
      connectedAt: supplier?.stripe_connected_at || null
    });
  } catch (error) {
    console.error('Get connection status error:', error);
    return NextResponse.json(
      { error: 'Failed to get connection status' },
      { status: 500 }
    );
  }
}
