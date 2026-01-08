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
    const { supplier_id, package_id, user_email } = await request.json();

    const supabase = getSupabaseClient();
    const { data: pkg, error: pkgError } = await supabase
      .from('supplier_onboarding_packages')
      .select('*')
      .eq('id', package_id)
      .single();

    if (pkgError || !pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

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
            name: `${pkg.name} Onboarding Package`,
            description: pkg.description,
          },
        },
        quantity: 1,
      }],
      customer_email: user_email,
      metadata: {
        supplier_id,
        package_id: pkg.id,
        package_name: pkg.name,
        type: 'supplier_onboarding',
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/vendor-registration/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/vendor-registration`,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error: any) {
    console.error('Onboarding purchase error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
