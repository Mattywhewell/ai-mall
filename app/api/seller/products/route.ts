import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    // Return a simple list of products (for mapping UI). In multi-tenant setups this should be scoped to seller or microstore.
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, image_url')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error && error.code === '42P01') return NextResponse.json({ products: [] });

    return NextResponse.json({ products: data || [] });
  } catch (err) {
    console.error('GET /api/seller/products error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}