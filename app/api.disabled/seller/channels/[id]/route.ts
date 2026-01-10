import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase
      .from('seller_channel_connections')
      .delete()
      .eq('id', params.id)
      .eq('seller_id', userId);

    if (error) {
      console.error('Delete channel error', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/seller/channels/[id] error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) return NextResponse.json({ connection: null });

    const { data, error } = await supabase
      .from('seller_channel_connections')
      .select('*')
      .eq('id', params.id)
      .eq('seller_id', userId)
      .single();

    if (error && error.code === '42P01') {
      return NextResponse.json({ connection: null });
    }

    return NextResponse.json({ connection: data || null });
  } catch (err) {
    console.error('GET /api/seller/channels/[id] error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}