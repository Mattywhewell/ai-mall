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
    const { product_id, user_email } = await request.json();

    const supabase = getSupabaseClient();

    // Get product
    const { data: product, error: productError } = await supabase
      .from('digital_products')
      .select('*')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Create Stripe checkout session for digital product
    const stripe = getStripe();
    if (!stripe) throw new Error('STRIPE_SECRET_KEY not configured');

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: product.currency || 'usd',
          unit_amount: Math.round(product.price * 100), // Convert to cents
          product_data: {
            name: product.title,
            description: product.description || undefined,
            images: product.thumbnail_url ? [product.thumbnail_url] : undefined,
          },
        },
        quantity: 1,
      }],
      customer_email: user_email,
      metadata: {
        product_id: product.id,
        product_type: 'digital',
        type: product.type,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/digital-products/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/digital-products/${product.id}`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error: any) {
    console.error('Purchase error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
