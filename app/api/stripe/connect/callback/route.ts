import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

/**
 * GET /api/stripe/connect/callback
 * Handle Stripe Connect OAuth callback
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This is the supplier ID
    const error = searchParams.get('error');

    // Handle OAuth error
    if (error) {
      console.error('Stripe OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/supplier?error=stripe_connection_failed`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/supplier?error=invalid_callback`
      );
    }

    const supplierId = state;

    // Exchange authorization code for Stripe account ID
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    const response = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code: code
    });

    const stripeAccountId = response.stripe_user_id;

    // Save Stripe account ID to supplier record
    const { error: updateError } = await supabase
      .from('suppliers')
      .update({
        stripe_account_id: stripeAccountId,
        stripe_connected_at: new Date().toISOString(),
        metadata: {
          stripe_response: response
        }
      })
      .eq('id', supplierId);

    if (updateError) {
      console.error('Failed to save Stripe account:', updateError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/supplier?error=save_failed`
      );
    }

    // Success! Redirect back to supplier dashboard
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/supplier?success=stripe_connected`
    );
  } catch (error) {
    console.error('Stripe Connect callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/supplier?error=connection_error`
    );
  }
}
