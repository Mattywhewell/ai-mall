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
    const { user_id, package_id, user_email } = await request.json();

    const supabase = getSupabaseClient();
    const { data: pkg, error: pkgError } = await supabase
      .from('ai_credit_packages')
      .select('*')
      .eq('id', package_id)
      .single();

    if (pkgError || !pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    const totalCredits = pkg.credits + (pkg.bonus_credits || 0);

    const stripe = getStripe();
    if (!stripe) throw new Error('STRIPE_SECRET_KEY not configured');

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(pkg.price * 100),
          product_data: {
            name: `${pkg.name} - ${totalCredits.toLocaleString()} AI Credits`,
            description: pkg.bonus_credits > 0 ? `Includes ${pkg.bonus_credits} bonus credits!` : undefined,
          },
        },
        quantity: 1,
      }],
      customer_email: user_email,
      metadata: {
        user_id,
        package_id: pkg.id,
        credits: pkg.credits,
        bonus_credits: pkg.bonus_credits || 0,
        type: 'credit_purchase',
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/credits`,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
