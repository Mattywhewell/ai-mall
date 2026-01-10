import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const supplier_id = searchParams.get('supplier_id');

  try {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('supplier_revenue_breakdown')
      .select('*')
      .order('gross_revenue', { ascending: false });

    if (supplier_id) {
      query = query.eq('supplier_id', supplier_id);
    }

    const { data: breakdown, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      breakdown: breakdown || [],
    });

  } catch (error: any) {
    console.error('Revenue breakdown error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
