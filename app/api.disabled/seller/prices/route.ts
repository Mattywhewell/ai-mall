import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) return NextResponse.json({ prices: [] });

    // For now, synthesize price items from product mappings and product table
    const { data, error } = await supabase
      .from('channel_product_mappings')
      .select('*')
      .eq('seller_id', userId)
      .order('updated_at', { ascending: false })
      .limit(500);

    if (error && error.code === '42P01') return NextResponse.json({ prices: [] });

    // Map to a price item shape for the UI
    const prices = (data || []).map((m: any) => ({
      id: m.id,
      product_id: m.local_product_id,
      product_name: m.channel_data?.name || 'Unknown',
      product_sku: m.channel_sku || '',
      base_price: m.channel_data?.base_price || 0,
      channel_connection_id: m.channel_connection_id,
      channel_name: '',
      channel_price: m.channel_data?.price || 0,
      channel_currency: m.channel_data?.currency || 'USD',
      markup_percentage: Math.round(((m.price_multiplier || 1) - 1) * 100),
      sync_enabled: m.sync_price ?? true,
      last_sync: m.updated_at,
      sync_status: 'synced',
      price_rule: 'markup'
    }));

    return NextResponse.json({ prices });
  } catch (err) {
    console.error('GET /api/seller/prices error', err);
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

    // Allow updating channel price / markup by updating channel_data or multipliers
    const updatePayload: any = {};
    if (body.channel_price !== undefined) updatePayload.channel_data = { price: body.channel_price };
    if (body.markup_percentage !== undefined) updatePayload.price_multiplier = 1 + (body.markup_percentage / 100);
    if (body.sync_enabled !== undefined) updatePayload.sync_price = body.sync_enabled;

    const { data, error } = await supabase
      .from('channel_product_mappings')
      .update(updatePayload)
      .eq('id', params.id)
      .eq('seller_id', userId)
      .select()
      .single();

    if (error) {
      console.error('PATCH /api/seller/prices/[id] error', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, mapping: data });
  } catch (err) {
    console.error('PATCH /api/seller/prices/[id] error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}