import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

/**
 * GET /api/supplier/products
 * Get all products for supplier
 */
export async function GET() {
  try {
    const supabase = getSupabaseClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is a supplier
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id, status')
      .eq('user_id', user.id)
      .single();

    if (supplierError || !supplier || supplier.status !== 'active') {
      return NextResponse.json(
        { error: 'Supplier account not found or not active' },
        { status: 403 }
      );
    }

    const supplierId = supplier.id;

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch products error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    // Enrich products with analytics data (mock for now)
    const enrichedProducts = (products || []).map(product => ({
      ...product,
      views: Math.floor(Math.random() * 500) + 50,
      sales: Math.floor(Math.random() * 100) + 5,
      category: product.category || 'Uncategorized',
      status: (product.stock_quantity || 0) > 0 ? 'active' : 'out_of_stock',
    }));

    return NextResponse.json({
      products: enrichedProducts,
      total: enrichedProducts.length,
    });
  } catch (error) {
    console.error('Fetch products error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/supplier/products
 * Create new product
 */
export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is an active supplier
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id, status')
      .eq('user_id', user.id)
      .single();

    if (supplierError || !supplier || supplier.status !== 'active') {
      return NextResponse.json(
        { error: 'Supplier account not found or not active' },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          ...body,
          supplier_id: supplier.id,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Create product error:', error);
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
