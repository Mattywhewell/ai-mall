/**
 * POST /api/admin/products/restore
 * Restore a rejected product back to pending review
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

    // Update the product status back to pending_review
    const { data: updatedProduct, error: updateError } = await supabase
      .from('pending_products')
      .update({
        status: 'pending_review',
        reviewed_at: null,
        reviewed_by: null,
        review_notes: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', pendingProductId)
      .select()
      .single();

    if (updateError) {
      console.error('Error restoring product:', updateError);
      return NextResponse.json(
        { error: 'Failed to restore product' },
        { status: 500 }
      );
    }

    // Log the restore action
    console.log(`[Admin] Product restored to pending: ${updatedProduct.extracted_data?.title} (ID: ${pendingProductId})`);

    return NextResponse.json({
      success: true,
      message: 'Product restored to pending review'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}