import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) return NextResponse.json({ mappings: [] });

    const { data, error } = await supabase
      .from('channel_product_mappings')
      .select('*')
      .eq('seller_id', userId)
      .order('updated_at', { ascending: false });

    if (error && error.code === '42P01') return NextResponse.json({ mappings: [] });

    return NextResponse.json({ mappings: data || [] });
  } catch (err) {
    console.error('GET /api/seller/product-mappings error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    const body = await req.json();

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = {
      seller_id: userId,
      channel_connection_id: body.channel_connection_id,
      local_product_id: body.product_id || body.local_product_id,
      channel_product_id: body.channel_product_id,
      channel_variant_id: body.channel_variant_id || null,
      channel_sku: body.channel_sku || null,
      sync_price: body.sync_price ?? true,
      sync_inventory: body.sync_inventory ?? true,
      price_multiplier: body.price_multiplier ?? 1.0,
      price_offset: body.price_offset ?? 0.0,
      channel_data: body.channel_data || {}
    };

    const { data, error } = await supabase
      .from('channel_product_mappings')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Insert mapping error', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ mapping: data });
  } catch (err) {
    console.error('POST /api/seller/product-mappings error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}