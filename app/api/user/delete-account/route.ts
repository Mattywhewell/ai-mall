/**
 * GDPR Compliance: Account Deletion
 * Permanently deletes user account and all associated data
 */

import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function DELETE(request: Request) {
  try {
    const { user_id, confirmation } = await request.json();

    if (!user_id || confirmation !== 'DELETE_MY_ACCOUNT') {
      return NextResponse.json(
        { error: 'Invalid confirmation' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Check if user is a supplier with pending orders
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('user_id', user_id)
      .single();

    if (supplier) {
      const { data: pendingOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('supplier_id', supplier.id)
        .in('status', ['pending', 'processing']);

      if (pendingOrders && pendingOrders.length > 0) {
        return NextResponse.json(
          { error: 'Cannot delete account with pending orders. Please fulfill all orders first.' },
          { status: 400 }
        );
      }
    }

    // Log the deletion request
    await supabase.from('audit_logs').insert({
      table_name: 'user_account',
      record_id: user_id,
      action: 'deleted',
      actor_id: user_id,
      metadata: { deletion_timestamp: new Date().toISOString() },
    });

    // Delete associated data (CASCADE should handle most, but explicit for clarity)
    
    // Delete user-specific data
    await supabase.from('wishlists').delete().eq('user_id', user_id);
    await supabase.from('cart_items').delete().eq('user_id', user_id);
    await supabase.from('product_reviews').delete().eq('user_id', user_id);
    await supabase.from('user_roles').delete().eq('user_id', user_id);
    
    // Anonymize orders (keep for records but remove PII)
    await supabase
      .from('orders')
      .update({
        customer_email: 'deleted@user.com',
        customer_name: 'Deleted User',
        phone: null,
        shipping_address: null,
      })
      .eq('user_id', user_id);

    // If supplier, deactivate supplier account
    if (supplier) {
      await supabase
        .from('suppliers')
        .update({
          status: 'deleted',
          email: 'deleted@supplier.com',
          business_name: 'Deleted Supplier',
        })
        .eq('user_id', user_id);
    }

    // Delete auth user (this will cascade to other tables with user_id foreign key)
    const { error: authError } = await supabase.auth.admin.deleteUser(user_id);

    if (authError) {
      console.error('Error deleting auth user:', authError);
      return NextResponse.json(
        { error: 'Failed to delete user account' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });

  } catch (error: any) {
    console.error('Error deleting user account:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
