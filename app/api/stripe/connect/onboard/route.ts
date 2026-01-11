import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

/**
 * GET /api/stripe/connect/onboard
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
    console.error('Stripe onboard status error:', error);
    return NextResponse.json(
      { error: 'Failed to check Stripe connection' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/stripe/connect/onboard
 * Initiate Stripe Connect onboarding for authenticated supplier
 */
export async function POST(request: Request) {
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
      .select('id, business_name, email, stripe_account_id')
      .eq('user_id', user.id)
      .single();

    if (supplierError || !supplier) {
      return NextResponse.json(
        { error: 'Supplier account not found' },
        { status: 404 }
      );
    }

    // Check if already connected
    if (supplier.stripe_account_id) {
      return NextResponse.json({
        connected: true,
        accountId: supplier.stripe_account_id
      });
    }

    const supplierId = supplier.id;

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
