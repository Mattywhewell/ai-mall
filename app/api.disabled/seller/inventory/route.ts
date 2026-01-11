import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) return NextResponse.json({ inventory: [] });

    // Return a simple view from inventory sync logs joined with product mappings
    const { data, error } = await supabase
      .from('inventory_sync_log')
      .select('*')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error && error.code === '42P01') return NextResponse.json({ inventory: [] });

    return NextResponse.json({ inventory: data || [] });
  } catch (err) {
    console.error('GET /api/seller/inventory error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    const body = await req.json();

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('inventory_sync_log')
      .update(body)
      .eq('id', params.id)
      .eq('seller_id', userId)
      .select()
      .single();

    if (error) {
      console.error('PATCH inventory error', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ inventoryItem: data });
  } catch (err) {
    console.error('PATCH /api/seller/inventory/[id] error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}