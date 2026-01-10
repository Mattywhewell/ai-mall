import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';
import { generateProductDescription } from '@/lib/ai/generateDescription';

// Create new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      storefront_id,
      product_name,
      description,
      product_type,
      base_price,
      currency = 'USD',
      inventory_count,
      unlimited_inventory = false,
      images = [],
      model_3d_url,
      tags = [],
      category,
      customization_options = {},
      generate_ai_description = true
    } = body;

    // Validation
    if (!storefront_id || !product_name || !product_type || !base_price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase_client = supabase;

    // Verify storefront exists and is active
    const { data: storefront, error: storefrontError } = await supabase_client
      .from('creator_storefronts')
      .select('*')
      .eq('id', storefront_id)
      .eq('status', 'active')
      .single();

    if (storefrontError || !storefront) {
      return NextResponse.json(
        { error: 'Storefront not found or inactive' },
        { status: 404 }
      );
    }

    // Generate slug
    const slug = product_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Generate AI description if requested
    let ai_description: any = null;
    let ai_tags: string[] = [];
    
    if (generate_ai_description && description) {
      try {
        ai_description = await generateProductDescription(
          product_name,
          category || 'general',
          product_type || 'product'
        );
        
        // Generate tags based on product details
        ai_tags = [
          category,
          product_type,
          ...tags
        ].filter(Boolean);
      } catch (aiError) {
        console.error('AI generation failed:', aiError);
        // Continue without AI enhancement
      }
    }

    // Create product
    const { data: product, error } = await supabase_client
      .from('creator_products')
      .insert([{
        storefront_id,
        product_name,
        slug,
        description,
        product_type,
        base_price,
        currency,
        inventory_count,
        unlimited_inventory,
        images,
        model_3d_url,
        tags,
        category,
        customization_options,
        ai_generated_description: ai_description,
        ai_generated_tags: ai_tags,
        status: 'draft',
        featured_in_hall: false
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      );
    }

    // Update storefront product count
    await supabase_client
      .from('creator_storefronts')
      .update({
        total_sales_count: storefront.total_sales_count || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', storefront_id);

    return NextResponse.json({
      success: true,
      product,
      ai_enhanced: !!ai_description,
      message: 'Product created successfully!'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in products POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get products
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const storefront_id = searchParams.get('storefront_id');
    const product_id = searchParams.get('product_id');
    const slug = searchParams.get('slug');
    const status = searchParams.get('status') || 'active';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase_client = supabase;
    let query = supabase_client.from('creator_products').select('*');

    if (product_id) {
      const { data, error } = await query.eq('id', product_id).single();
      if (error) throw error;
      return NextResponse.json(data);
    } else if (slug && storefront_id) {
      const { data, error } = await query.eq('slug', slug).eq('storefront_id', storefront_id).single();
      if (error) throw error;
      return NextResponse.json(data);
    } else if (storefront_id) {
      query = query.eq('storefront_id', storefront_id);
    }

    if (!product_id && !slug) {
      query = query.eq('status', status);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      products: Array.isArray(data) ? data : [data],
      count,
      limit,
      offset
    });

  } catch (error) {
    console.error('Error in products GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update product
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { product_id, ...updates } = body;

    if (!product_id) {
      return NextResponse.json(
        { error: 'product_id required' },
        { status: 400 }
      );
    }

    const supabase_client = supabase;

    const { data: product, error } = await supabase_client
      .from('creator_products')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', product_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product,
      message: 'Product updated successfully'
    });

  } catch (error) {
    console.error('Error in products PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete product
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const product_id = searchParams.get('product_id');

    if (!product_id) {
      return NextResponse.json(
        { error: 'product_id required' },
        { status: 400 }
      );
    }

    const supabase_client = supabase;

    const { error } = await supabase_client
      .from('creator_products')
      .delete()
      .eq('id', product_id);

    if (error) {
      console.error('Error deleting product:', error);
      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Error in products DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
