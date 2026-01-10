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
    const { plan_id, user_email, billing_cycle } = await request.json();

    // Get plan details
    const supabase = getSupabaseClient();
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Determine price based on billing cycle
    const price = billing_cycle === 'yearly' 
      ? plan.price_yearly 
      : plan.price_monthly;

    if (!price || price === 0) {
      return NextResponse.json(
        { error: 'Invalid price for selected billing cycle' },
        { status: 400 }
      );
    }

    // Create or get Stripe customer
    const stripe = getStripe();
    if (!stripe) throw new Error('STRIPE_SECRET_KEY not configured');

    let customer;
    const existingCustomers = await stripe.customers.list({
      email: user_email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: user_email,
        metadata: {
          source: 'ai_mall',
        },
      });
    }

    // Create Stripe subscription checkout
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customer.id,
      line_items: [{
        price_data: {
          currency: plan.currency || 'usd',
          product_data: {
            name: `${plan.name} Plan`,
            description: plan.description || undefined,
          },
          unit_amount: Math.round(price * 100), // Convert to cents
          recurring: {
            interval: billing_cycle === 'yearly' ? 'year' : 'month',
          },
        },
        quantity: 1,
      }],
      metadata: {
        plan_id: plan.id,
        plan_name: plan.name,
        billing_cycle,
      },
      subscription_data: {
        metadata: {
          plan_id: plan.id,
          plan_name: plan.name,
        },
        trial_period_days: plan.name === 'Free' ? 0 : 14, // 14-day trial for paid plans
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscriptions/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error: any) {
    console.error('Subscription creation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Get user's current subscription
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const user_email = searchParams.get('user_email');

  if (!user_email) {
    return NextResponse.json(
      { error: 'user_email required' },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseClient();
    // Get user's active subscription
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans (*)
      `)
      .eq('user_id', user_email)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({
      subscription: subscription || null,
    });

  } catch (error: any) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
