/**
 * GET /api/admin/products/rejected
 * Get all rejected products
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    const { data: products, error } = await supabase
      .from('pending_products')
      .select(`
        *,
        supplier:suppliers(business_name)
      `)
      .eq('status', 'rejected')
      .order('reviewed_at', { ascending: false });

    if (error) {
      console.error('Error fetching rejected products:', error);
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