import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

/**
 * GET /api/stripe/connect/callback
 * Handle Stripe Connect OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This should be the supplier ID
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('Stripe Connect OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/supplier?error=stripe_connect_failed`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/supplier?error=missing_oauth_params`
      );
    }

    const supabase = getSupabaseClient();

    // Verify the supplier exists
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id, user_id')
      .eq('id', state)
      .single();

    if (supplierError || !supplier) {
      console.error('Invalid supplier ID in OAuth state:', state);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/supplier?error=invalid_supplier`
      );
    }

    // Exchange the authorization code for an access token
    const tokenResponse = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code: code,
    });

    if (!tokenResponse.stripe_user_id) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/supplier?error=stripe_token_exchange_failed`
      );
    }

    // Update the supplier record with Stripe account ID
    const { error: updateError } = await supabase
      .from('suppliers')
      .update({
        stripe_account_id: tokenResponse.stripe_user_id,
        stripe_connected_at: new Date().toISOString(),
        integration_status: 'connected'
      })
      .eq('id', state);

    if (updateError) {
      console.error('Failed to update supplier with Stripe account:', updateError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/supplier?error=database_update_failed`
      );
    }

    // Log the successful connection
    await supabase
      .from('audit_logs')
      .insert({
        table_name: 'suppliers',
        record_id: state,
        action: 'UPDATE',
        actor_role: 'supplier',
        actor_id: supplier.user_id,
        changes: {
          stripe_account_id: tokenResponse.stripe_user_id,
          integration_status: 'connected'
        },
        metadata: {
          event: 'stripe_connect_success',
          stripe_account_id: tokenResponse.stripe_user_id
        }
      });

    // Redirect back to supplier dashboard with success message
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/supplier?success=stripe_connected`
    );

  } catch (error) {
    console.error('Stripe Connect callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/supplier?error=stripe_callback_error`
    );
  }
}