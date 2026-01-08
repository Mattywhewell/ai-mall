/**
 * POST /api/admin/products/reject
 * Reject a pending product
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { pendingProductId, reason } = await request.json();

    if (!pendingProductId) {
      return NextResponse.json(
        { error: 'Pending product ID is required' },
        { status: 400 }
      );
    }

    // Update the pending product status
    const { data: updatedProduct, error: updateError } = await supabase
      .from('pending_products')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'admin', // You might want to get the actual user
        review_notes: reason || 'Rejected during manual review'
      })
      .eq('id', pendingProductId)
      .select()
      .single();

    if (updateError) {
      console.error('Error rejecting product:', updateError);
      return NextResponse.json(
        { error: 'Failed to reject product' },
        { status: 500 }
      );
    }

    // Log the rejection action
    console.log(`[Admin] Product rejected: ${updatedProduct.extracted_data?.title} (ID: ${pendingProductId})`);

    return NextResponse.json({
      success: true,
      message: 'Product rejected successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}