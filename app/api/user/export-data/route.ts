/**
 * GDPR Compliance: Data Export
 * Allows users to download all their personal data
 */

import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const { user_id } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Collect all user data from various tables
    const userData: any = {
      requested_at: new Date().toISOString(),
      user_id,
    };

    const supabase = getSupabaseClient();

    // Get user profile
    const { data: user } = await supabase.auth.admin.getUserById(user_id);
    userData.profile = user;

    // Get user roles
    const { data: roles } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user_id);
    userData.roles = roles;

    // Get orders
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user_id);
    userData.orders = orders;

    // Get wishlist
    const { data: wishlist } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', user_id);
    userData.wishlist = wishlist;

    // Get shopping cart
    const { data: cart } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user_id);
    userData.cart = cart;

    // Get reviews/ratings
    const { data: reviews } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('user_id', user_id);
    userData.reviews = reviews;

    // Get analytics events
    const { data: analytics } = await supabase
      .from('analytics')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(1000); // Last 1000 events
    userData.analytics = analytics;

    // If user is a supplier, get supplier data
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (supplier) {
      userData.supplier = supplier;

      // Get supplier products
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('supplier_id', supplier.id);
      userData.supplier_products = products;

      // Get supplier stats
      const { data: stats } = await supabase
        .from('auto_listing_stats')
        .select('*')
        .eq('supplier_id', supplier.id);
      userData.supplier_stats = stats;
    }

    // Log the data export request
    await supabase.from('audit_logs').insert({
      table_name: 'user_data_export',
      record_id: user_id,
      action: 'exported',
      actor_id: user_id,
      metadata: { export_size: JSON.stringify(userData).length },
    });

    return NextResponse.json({
      success: true,
      data: userData,
      message: 'Data export completed successfully',
    });

  } catch (error: any) {
    console.error('Error exporting user data:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
