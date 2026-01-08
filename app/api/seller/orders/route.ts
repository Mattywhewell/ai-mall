import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) return NextResponse.json({ orders: [] });

    const { data, error } = await supabase
      .from('channel_orders')
      .select('*')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error && error.code === '42P01') return NextResponse.json({ orders: [] });

    return NextResponse.json({ orders: data || [] });
  } catch (err) {
    console.error('GET /api/seller/orders error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}