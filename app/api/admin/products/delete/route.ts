/**
 * POST /api/admin/products/delete
 * Permanently delete a rejected product
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { pendingProductId } = await request.json();

    if (!pendingProductId) {
      return NextResponse.json(
        { error: 'Pending product ID is required' },
        { status: 400 }
      );
    }

    // Delete the rejected product
    const { error: deleteError } = await supabase
      .from('pending_products')
      .delete()
      .eq('id', pendingProductId)
      .eq('status', 'rejected'); // Safety check - only delete rejected products

    if (deleteError) {
      console.error('Error deleting product:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 500 }
      );
    }

    // Log the delete action
    console.log(`[Admin] Product permanently deleted: (ID: ${pendingProductId})`);

    return NextResponse.json({
      success: true,
      message: 'Product permanently deleted'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}