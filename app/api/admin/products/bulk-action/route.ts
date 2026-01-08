/**
 * POST /api/admin/products/bulk-action
 * Handle bulk approve/reject operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { action, productIds } = await request.json();

    if (!action || !productIds || !Array.isArray(productIds)) {
      return NextResponse.json(
        { error: 'Action and product IDs are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Process each product
    for (const productId of productIds) {
      try {
        if (action === 'approve') {
          // Get the pending product
          const { data: pendingProduct, error: fetchError } = await supabase
            .from('pending_products')
            .select('*')
            .eq('id', productId)
            .single();

          if (fetchError || !pendingProduct) {
            results.failed++;
            results.errors.push(`Product ${productId} not found`);
            continue;
          }

          // Create the live product
          const { error: productError } = await supabase
            .from('products')
            .insert({
              supplier_id: pendingProduct.supplier_id,
              name: pendingProduct.extracted_data.title,
              description: pendingProduct.extracted_data.description,
              price: parseFloat(pendingProduct.extracted_data.price) || 0,
              images: pendingProduct.extracted_data.images || [],
              category: pendingProduct.extracted_data.category || 'Uncategorized',
              specifications: pendingProduct.extracted_data.specifications || {},
              tags: pendingProduct.extracted_data.tags || [],
              source_url: pendingProduct.source_url,
              extraction_metadata: {
                extracted_at: pendingProduct.created_at,
                approved_at: new Date().toISOString(),
                approved_by: 'admin',
                original_similarity_scores: pendingProduct.similarity_scores
              },
              status: 'active',
              created_at: new Date().toISOString()
            });

          if (productError) {
            results.failed++;
            results.errors.push(`Failed to create product ${productId}: ${productError.message}`);
            continue;
          }

          // Update pending product status
          await supabase
            .from('pending_products')
            .update({
              status: 'approved',
              reviewed_at: new Date().toISOString(),
              reviewed_by: 'admin',
              review_notes: 'Bulk approved'
            })
            .eq('id', productId);

        } else if (action === 'reject') {
          // Update pending product status
          const { error: updateError } = await supabase
            .from('pending_products')
            .update({
              status: 'rejected',
              reviewed_at: new Date().toISOString(),
              reviewed_by: 'admin',
              review_notes: 'Bulk rejected'
            })
            .eq('id', productId);

          if (updateError) {
            results.failed++;
            results.errors.push(`Failed to reject product ${productId}: ${updateError.message}`);
            continue;
          }
        }

        results.successful++;

      } catch (error) {
        results.failed++;
        results.errors.push(`Error processing product ${productId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`[Admin] Bulk ${action} completed: ${results.successful} successful, ${results.failed} failed`);

    return NextResponse.json({
      success: true,
      results,
      message: `Bulk ${action} completed: ${results.successful} successful, ${results.failed} failed`
    });

  } catch (error) {
    console.error('Bulk action API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}