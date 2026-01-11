/**
 * POST /api/admin/products/approve
 * Approve a pending product and move it to live products
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { pendingProductId, productData, adminNotes } = await request.json();

    if (!pendingProductId) {
      return NextResponse.json(
        { error: 'Pending product ID is required' },
        { status: 400 }
      );
    }

    // Get the pending product
    const { data: pendingProduct, error: fetchError } = await supabase
      .from('pending_products')
      .select('*')
      .eq('id', pendingProductId)
      .single();

    if (fetchError || !pendingProduct) {
      return NextResponse.json(
        { error: 'Pending product not found' },
        { status: 404 }
      );
    }

    // Use provided productData or fall back to extracted_data
    const finalProductData = productData || pendingProduct.extracted_data;

    // Create the live product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        supplier_id: pendingProduct.supplier_id,
        name: finalProductData.title,
        description: finalProductData.description,
        price: parseFloat(finalProductData.price) || 0,
        images: finalProductData.images || [],
        category: finalProductData.category || 'Uncategorized',
        specifications: finalProductData.specifications || {},
        tags: finalProductData.tags || [],
        source_url: pendingProduct.source_url,
        extraction_metadata: {
          extracted_at: pendingProduct.created_at,
          approved_at: new Date().toISOString(),
          approved_by: 'admin', // You might want to get the actual user
          original_similarity_scores: pendingProduct.similarity_scores
        },
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (productError) {
      console.error('Error creating live product:', productError);
      return NextResponse.json(
        { error: 'Failed to create live product' },
        { status: 500 }
      );
    }

    // Update the pending product status
    const { error: updateError } = await supabase
      .from('pending_products')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'admin', // You might want to get the actual user
        review_notes: adminNotes || 'Approved for publication'
      })
      .eq('id', pendingProductId);

    if (updateError) {
      console.error('Error updating pending product:', updateError);
      // Don't fail the whole operation if this update fails
    }

    // Create product variants if any
    if (finalProductData.variants && finalProductData.variants.length > 0) {
      const variantsToInsert = finalProductData.variants.map((variant: any) => ({
        product_id: product.id,
        name: variant.name,
        options: variant.options,
        price_modifier: variant.price_modifier || 0
      }));

      const { error: variantError } = await supabase
        .from('product_variants')
        .insert(variantsToInsert);

      if (variantError) {
        console.error('Error creating product variants:', variantError);
      }
    }

    // Log the approval action
    console.log(`[Admin] Product approved: ${product.name} (ID: ${product.id})`);

    return NextResponse.json({
      success: true,
      product_id: product.id,
      message: 'Product approved and published successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}