import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

/**
 * GET /api/supplier/products
 * Get all products for supplier
 */
export async function GET() {
  try {
    const supabase = getSupabaseClient();
    // Mock supplier ID - in production, get from auth session
    const supplierId = 'supplier_123';

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('vendor_id', supplierId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Mock additional data for display
    const enrichedProducts = (products || []).map(product => ({
      ...product,
      views: Math.floor(Math.random() * 500) + 50,
      sales: Math.floor(Math.random() * 100) + 5,
      category: product.category || 'Uncategorized',
      status: product.stock_quantity > 0 ? 'active' : 'out_of_stock',
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
    const body = await request.json();
    const supplierId = 'supplier_123';

    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          ...body,
          vendor_id: supplierId,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
