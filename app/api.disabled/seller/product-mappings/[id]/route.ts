import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase
      .from('channel_product_mappings')
      .delete()
      .eq('id', params.id)
      .eq('seller_id', userId);

    if (error) {
      console.error('Delete mapping error', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/seller/product-mappings/[id] error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // This endpoint is used to trigger a sync for a single mapping
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // In production, enqueue a background job to sync to the channel. Here we just mark last_sync.
    const { data, error } = await supabase
      .from('channel_product_mappings')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('seller_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Sync mapping update error', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, mapping: data });
  } catch (err) {
    console.error('POST /api/seller/product-mappings/[id]/sync error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}