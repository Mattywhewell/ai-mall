import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseClient } from '@/lib/supabase-server';

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2025-12-15.clover' });
}

export async function POST(request: Request) {
  try {
    const { subscription_id, reason } = await request.json();

    if (!subscription_id) {
      return NextResponse.json(
        { error: 'subscription_id required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    // Get subscription from database
    const { data: dbSubscription, error: dbError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('id', subscription_id)
      .single();

    if (dbError || !dbSubscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Cancel in Stripe
    if (dbSubscription.stripe_subscription_id) {
      const stripe = getStripe();
      if (!stripe) throw new Error('STRIPE_SECRET_KEY not configured');

      await stripe.subscriptions.update(
        dbSubscription.stripe_subscription_id,
        {
          cancel_at_period_end: true,
          metadata: {
            cancellation_reason: reason || 'user_requested',
          },
        }
      );
    }

    // Update database
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription_id);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: 'Subscription canceled successfully',
      access_until: dbSubscription.current_period_end,
    });

  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
