/**
 * GET /api/admin/products/pending
 * Get all pending products for review
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access (you might want to add proper admin authentication)
    const supabase = getSupabaseClient();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending_review';
    const supplierId = searchParams.get('supplier');

    let query = supabase
      .from('pending_products')
      .select(`
        *,
        supplier:suppliers(business_name)
      `)
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (supplierId && supplierId !== 'all') {
      query = query.eq('supplier_id', supplierId);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('Error fetching pending products:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      products: products || [],
      total: products?.length || 0
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}