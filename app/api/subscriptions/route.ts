import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

// GET - List subscription plans or user subscriptions
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const creatorId = searchParams.get('creatorId');
    const userId = searchParams.get('userId');

    if (userId) {
      const supabase = getSupabaseClient();
      // Get user's active subscriptions
      const { data: subscriptions, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans (
            *,
            creator:creator_storefronts (
              brand_name,
              slug,
              logo_url
            )
          )
        `)
        .eq('user_id', userId)
        .in('status', ['active', 'paused'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get upcoming boxes
      for (const sub of subscriptions || []) {
        const { data: boxes } = await supabase
          .from('subscription_boxes')
          .select('*')
          .eq('subscription_id', sub.id)
          .order('created_at', { ascending: false })
          .limit(3);

        sub.recent_boxes = boxes || [];
      }

      return NextResponse.json({ subscriptions: subscriptions || [] });
    }

    // Get plans by creator or all active plans
    const supabase = getSupabaseClient();
    let query = supabase
      .from('subscription_plans')
      .select(`
        *,
        creator:creator_storefronts (
          id,
          brand_name,
          slug,
          logo_url,
          description,
          rating,
          total_sales
        )
      `)
      .eq('active', true);

    if (creatorId) {
      query = query.eq('creator_id', creatorId);
    }

    const { data: plans, error } = await query.order('subscribers_count', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ plans: plans || [] });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}

// POST - Create subscription plan or subscribe user
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Create subscription plan (for creators)
    if (body.creatorId && body.name && body.priceMonthly) {
      const {
        creatorId,
        name,
        description,
        tagline,
        imageUrl,
        priceMonthly,
        priceQuarterly,
        priceAnnual,
        productsPerBox,
        estimatedValue,
        shippingIncluded,
        exclusiveProducts,
        earlyAccess,
        allowPreferences,
        preferenceCategories,
        skipAllowed,
        spotsAvailable,
      } = body;

      const { data: plan, error } = await supabase
        .from('subscription_plans')
        .insert([{
          creator_id: creatorId,
          name,
          description,
          tagline,
          image_url: imageUrl,
          price_monthly: priceMonthly,
          price_quarterly: priceQuarterly,
          price_annual: priceAnnual,
          products_per_box: productsPerBox,
          estimated_value: estimatedValue,
          shipping_included: shippingIncluded !== false,
          exclusive_products: exclusiveProducts || false,
          early_access: earlyAccess || false,
          allow_preferences: allowPreferences !== false,
          preference_categories: preferenceCategories || [],
          skip_allowed: skipAllowed !== false,
          spots_available: spotsAvailable,
          active: true,
        }])
        .select(`
          *,
          creator:creator_storefronts (
            brand_name,
            slug
          )
        `)
        .single();

      if (error) throw error;

      return NextResponse.json({ plan }, { status: 201 });
    }

    // Subscribe user to plan
    if (body.planId && body.userId && body.billingCycle) {
      const { planId, userId, billingCycle, shippingAddress, preferences } = body;

      // Get plan details
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*, creator:creator_storefronts(brand_name)')
        .eq('id', planId)
        .single();

      if (planError || !plan) {
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
      }

      // Check spots availability
      if (plan.spots_available !== null && plan.subscribers_count >= plan.spots_available) {
        return NextResponse.json({ error: 'No spots available' }, { status: 400 });
      }

      // Calculate price based on billing cycle
      let price = plan.price_monthly;
      if (billingCycle === 'quarterly' && plan.price_quarterly) {
        price = plan.price_quarterly;
      } else if (billingCycle === 'annual' && plan.price_annual) {
        price = plan.price_annual;
      }

      // Calculate next billing date
      const startDate = new Date();
      const nextBillingDate = new Date(startDate);
      if (billingCycle === 'monthly') {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      } else if (billingCycle === 'quarterly') {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);
      } else if (billingCycle === 'annual') {
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
      }

      // Create subscription
      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .insert([{
          plan_id: planId,
          user_id: userId,
          billing_cycle: billingCycle,
          price_paid: price,
          status: 'active',
          start_date: startDate.toISOString().split('T')[0],
          next_billing_date: nextBillingDate.toISOString().split('T')[0],
          shipping_address: shippingAddress,
          user_preferences: preferences || {},
        }])
        .select(`
          *,
          plan:subscription_plans (
            *,
            creator:creator_storefronts (
              brand_name,
              slug
            )
          )
        `)
        .single();

      if (error) throw error;

      // Update plan subscriber count
      await supabase
        .from('subscription_plans')
        .update({ subscribers_count: plan.subscribers_count + 1 })
        .eq('id', planId);

      // Create first box
      const currentMonth = new Date().toLocaleString('default', { month: 'long' });
      const currentYear = new Date().getFullYear();

      await supabase.from('subscription_boxes').insert([{
        subscription_id: subscription.id,
        plan_id: planId,
        box_number: 1,
        month: currentMonth,
        year: currentYear,
        theme: 'Welcome Box',
        products: [],
        total_value: plan.estimated_value,
        status: 'preparing',
      }]);

      // Send notification
      await supabase.from('user_notifications').insert([{
        user_id: userId,
        notification_type: 'subscription_started',
        title: 'Subscription Activated!',
        message: `Your ${plan.creator.brand_name} subscription is now active`,
        link_url: `/subscriptions/${subscription.id}`,
        metadata: {
          subscription_id: subscription.id,
          plan_name: plan.name,
        }
      }]);

      return NextResponse.json({ subscription }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
  }
}

// PUT - Update subscription or plan
export async function PUT(req: NextRequest) {
  try {
    const { subscriptionId, planId, action, data } = await req.json();

    if (subscriptionId) {
      // Update user subscription
      let updates: any = {};

      switch (action) {
        case 'pause':
          updates.status = 'paused';
          break;

        case 'resume':
          updates.status = 'active';
          break;

        case 'cancel':
          updates.status = 'cancelled';
          updates.cancel_date = new Date().toISOString().split('T')[0];
          updates.cancel_reason = data?.reason;
          break;

        case 'update_preferences':
          updates.user_preferences = data?.preferences;
          break;

        case 'update_address':
          updates.shipping_address = data?.address;
          break;

        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }

      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .update(updates)
        .eq('id', subscriptionId)
        .select(`
          *,
          plan:subscription_plans (
            *,
            creator:creator_storefronts (brand_name)
          )
        `)
        .single();

      if (error) throw error;

      // Update subscriber count if cancelled
      if (action === 'cancel') {
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('subscribers_count')
          .eq('id', subscription.plan_id)
          .single();

        if (plan) {
          await supabase
            .from('subscription_plans')
            .update({ subscribers_count: Math.max(0, plan.subscribers_count - 1) })
            .eq('id', subscription.plan_id);
        }
      }

      return NextResponse.json({ subscription });
    }

    if (planId) {
      // Update plan
      const { data: plan, error } = await supabase
        .from('subscription_plans')
        .update(data)
        .eq('id', planId)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ plan });
    }

    return NextResponse.json({ error: 'Subscription ID or Plan ID required' }, { status: 400 });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}

// DELETE - Delete subscription plan (creators only)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const planId = searchParams.get('planId');

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID required' }, { status: 400 });
    }

    // Check if plan has active subscribers
    const { count } = await supabase
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('plan_id', planId)
      .eq('status', 'active');

    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete plan with active subscribers' },
        { status: 400 }
      );
    }

    // Soft delete by deactivating
    const { error } = await supabase
      .from('subscription_plans')
      .update({ active: false })
      .eq('id', planId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 });
  }
}
