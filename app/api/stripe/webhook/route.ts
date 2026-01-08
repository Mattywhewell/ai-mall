import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseClient } from '@/lib/supabase-server';

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2025-12-15.clover' });
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    if (!stripe) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    const supabase = getSupabaseClient();

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};
        const amount = session.amount_total ? session.amount_total / 100 : 0;
        
        // Handle different payment types based on metadata
        switch (metadata.type) {
          case 'digital':
            const supabase = getSupabaseClient();
            await supabase.rpc('increment_digital_product_stats', {
              p_product_id: metadata.product_id,
              p_revenue: amount,
            });
            await supabase.from('digital_product_purchases').insert({
              product_id: metadata.product_id,
              customer_email: session.customer_email,
              stripe_session_id: session.id,
              amount_paid: amount,
            });
            console.log('✅ Digital product sold:', metadata.product_id);
            break;

          case 'supplier_onboarding':
            await supabase.from('supplier_onboarding_purchases').insert({
              supplier_id: metadata.supplier_id,
              package_id: metadata.package_id,
              amount_paid: amount,
              stripe_payment_intent_id: session.payment_intent as string,
              status: 'completed',
              completed_at: new Date().toISOString(),
            });
            console.log('✅ Supplier onboarding purchased:', metadata.package_name);
            break;

          case 'credit_purchase':
            const totalCredits = parseInt(metadata.credits) + parseInt(metadata.bonus_credits || '0');
            await supabase.from('user_ai_credits').upsert({
              user_id: metadata.user_id,
              credits_balance: supabase.rpc('increment', { x: totalCredits }),
              credits_purchased: supabase.rpc('increment', { x: totalCredits }),
              last_purchase_at: new Date().toISOString(),
            });
            await supabase.from('ai_credit_transactions').insert({
              user_id: metadata.user_id,
              transaction_type: 'purchase',
              credits_amount: totalCredits,
              package_id: metadata.package_id,
              stripe_payment_intent_id: session.payment_intent as string,
              amount_paid: amount,
            });
            console.log('✅ AI credits purchased:', totalCredits);
            break;

          case 'featured_placement':
            await supabase.from('featured_placements').insert({
              supplier_id: metadata.supplier_id,
              placement_type: metadata.placement_type,
              product_id: metadata.product_id || null,
              title: metadata.title,
              start_date: metadata.start_date,
              end_date: metadata.end_date,
              daily_budget: parseFloat(metadata.daily_budget),
              total_budget: amount,
              status: 'pending',
            });
            console.log('✅ Featured placement purchased:', metadata.placement_type);
            break;

          default:
            // Physical product order
            await supabase.from('orders').insert({
              user_id: metadata.userId,
              stripe_session_id: session.id,
              amount,
              status: 'completed',
              customer_email: session.customer_email,
            });
            console.log('✅ Order completed:', session.id);
        }
        break;

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('✅ PaymentIntent succeeded:', paymentIntent.id);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.log('❌ Payment failed:', failedPayment.id);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        
        // Upsert subscription in database
        await supabase.from('user_subscriptions').upsert({
          user_id: subscription.customer as string,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer as string,
          plan_id: subscription.metadata?.plan_id,
          status: subscription.status === 'active' ? 'active' : 
                 subscription.status === 'trialing' ? 'trial' :
                 subscription.status === 'past_due' ? 'past_due' :
                 subscription.status === 'canceled' ? 'canceled' : 'active',
          billing_cycle: subscription.items.data[0]?.price.recurring?.interval === 'year' ? 'yearly' : 'monthly',
          current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
          current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
          trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'stripe_subscription_id',
        });

        console.log('✅ Subscription synced:', subscription.id, subscription.status);
        break;

      case 'customer.subscription.deleted':
        const deletedSub = event.data.object as Stripe.Subscription;
        
        await supabase
          .from('user_subscriptions')
          .update({
            status: 'expired',
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', deletedSub.id);

        console.log('✅ Subscription deleted:', deletedSub.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 400 }
    );
  }
}
