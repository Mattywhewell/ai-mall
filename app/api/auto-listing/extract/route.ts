/**
 * Auto-Listing Engine API Endpoint
 * POST /api/auto-listing/extract
 */

import { NextRequest, NextResponse } from 'next/server';
import { autoListingEngine } from '@/lib/services/auto-listing-engine';
import { fullAutomateCJOrder } from '@/lib/dropshipping/full-cj-order-automation';
import { getSupabaseClient } from '@/lib/supabase-server';
import { withRateLimit, rateLimiters } from '@/lib/rate-limiting/rate-limiter';

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(request, rateLimiters.api);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // Debug: log incoming request metadata to investigate 403s
    console.log('[Auto-Listing] Incoming request', {
      method: request.method,
      url: request.url,
      headers: {
        'content-type': request.headers.get('content-type'),
        authorization: request.headers.get('authorization'),
        'x-forwarded-for': request.headers.get('x-forwarded-for'),
      },
    });

    let body;
    try {
      body = await request.json();
      console.log('[Auto-Listing] Request body received:', body);
    } catch (jsonError) {
      console.error('[Auto-Listing] JSON parsing error:', jsonError);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
          details: jsonError instanceof Error ? jsonError.message : String(jsonError)
        },
        { status: 400 }
      );
    }
    const { product_url, supplier_id } = body;

    // Validation
    if (!product_url) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product URL is required'
        },
        { status: 400 }
      );
    }

    if (!supplier_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Supplier ID is required'
        },
        { status: 400 }
      );
    }

    // Verify supplier exists and has permission (temporarily disabled for testing)
    /*
    const supabase = getSupabaseClient();
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id, business_name, status')
      .eq('id', supplier_id)
      .single();

    if (supplierError || !supplier) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid supplier ID or supplier not found'
        },
        { status: 403 }
      );
    }

    if (supplier.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          error: 'Supplier account is not active'
        },
        { status: 403 }
      );
    }
    */

    // Mock supplier for testing
    const supplier = { id: supplier_id, business_name: 'Test Supplier', status: 'active' };

    // Process the product URL
    console.log(`[Auto-Listing] Processing URL for supplier ${supplier.business_name}:`, product_url);
    
    const result = await autoListingEngine.processProductURL(product_url, supplier_id);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    // Save to database if approved (temporarily disabled for testing)
    /*
    if (result.data && result.data.status === 'approved') {
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          supplier_id: supplier_id,
          name: result.data.title,
          description: result.data.description,
          price: parseFloat(result.data.price) || 0,
          images: result.data.images,
          category: result.data.category,
          specifications: result.data.specifications,
          tags: result.data.tags,
          source_url: product_url,
          extraction_metadata: result.data.extraction_metadata,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (productError) {
        console.error('[Auto-Listing] Database error:', productError);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to save product to database',
            details: productError.message
          },
          { status: 500 }
        );
      }


      // Save variants if any
      if (result.data.variants && result.data.variants.length > 0) {
        const variantsToInsert = result.data.variants.map((variant: any) => ({
          product_id: product.id,
          name: variant.name,
          options: variant.options,
          price_modifier: variant.price_modifier || 0
        }));
        await supabase.from('product_variants').insert(variantsToInsert);
      }

      // --- CJ Order Automation Integration ---
      let cjOrderAutomationResult: any = null;
      let cjOrderAutomationError: any = null;
      try {
        // Construct orderData for CJ API (customize as needed)
        const orderData = {
          // Example mapping - adjust fields as required by CJ API
          productList: [
            {
              name: result.data.title,
              quantity: 1, // Default to 1, adjust as needed
              price: parseFloat(result.data.price) || 0,
              image: result.data.images?.[0] || '',
              // Add more fields as required by CJ API
            }
          ],
          // Add other required order fields here
        };
        cjOrderAutomationResult = await fullAutomateCJOrder({
          supplierId: supplier_id,
          orderData
        });
      } catch (err) {
        cjOrderAutomationError = err instanceof Error ? err.message : String(err);
        console.error('[Auto-Listing] CJ Order Automation Error:', cjOrderAutomationError);
      }

      return NextResponse.json({
        success: true,
        data: result.data,
        product_id: product.id,
        message: 'Product successfully extracted, saved, and CJ order workflow triggered',
        warnings: result.warnings,
        cjOrderAutomationResult,
        cjOrderAutomationError
      });
    } else {
      // Save as pending review
      try {
        const { data: pendingProduct, error: pendingError } = await supabase
          .from('pending_products')
          .insert({
            supplier_id: supplier_id,
            extracted_data: result.data,
            source_url: product_url,
            status: 'pending_review',
            similarity_scores: result.data?.similarity_scores,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (pendingError) {
          console.error('[Auto-Listing] Failed to save pending product:', pendingError);
        }

        return NextResponse.json({
          success: true,
          data: result.data,
          pending_product_id: pendingProduct?.id,
          message: 'Product extracted but requires manual review',
          warnings: result.warnings
        });
      } catch (dbError) {
        console.error('[Auto-Listing] Database table not available:', dbError);
        return NextResponse.json({
          success: true,
          data: result.data,
          message: 'Product extracted but database save failed - table may not exist',
          warnings: [...(result.warnings || []), 'Database save failed']
        });
      }
    }
    */

    // Return result without database operations
    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Product extracted successfully (database operations disabled for testing)',
      warnings: result.warnings
    });

  } catch (error: any) {
    console.error('[Auto-Listing] Server error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check extraction status
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const product_id = searchParams.get('product_id');
    const pending_id = searchParams.get('pending_id');

    if (product_id) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', product_id)
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data });
    }

    if (pending_id) {
      const { data, error } = await supabase
        .from('pending_products')
        .select('*')
        .eq('id', pending_id)
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: 'Pending product not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json(
      { success: false, error: 'product_id or pending_id parameter required' },
      { status: 400 }
    );

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
