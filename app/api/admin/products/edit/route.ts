/**
 * POST /api/admin/products/edit
 * Edit a pending product's data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { pendingProductId, productData } = await request.json();

    if (!pendingProductId || !productData) {
      return NextResponse.json(
        { error: 'Pending product ID and product data are required' },
        { status: 400 }
      );
    }

    // Update the pending product with edited data
    const { data: updatedProduct, error: updateError } = await supabase
      .from('pending_products')
      .update({
        extracted_data: productData,
        updated_at: new Date().toISOString()
      })
      .eq('id', pendingProductId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating product:', updateError);
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      );
    }

    // Log the edit action
    console.log(`[Admin] Product edited: ${productData.title} (ID: ${pendingProductId})`);

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}