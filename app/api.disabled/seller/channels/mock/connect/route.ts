import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const storeName = body.store_name || 'Mock Store';

    const { data, error } = await supabase.from('seller_channel_connections').insert({ seller_id: userId, channel_type: 'mock', channel_name: storeName, store_url: null, connection_status: 'connected', is_active: true }).select().single();

    if (error) {
      console.error('Failed to create mock connection', error);
      return NextResponse.json({ error: 'Failed to create connection' }, { status: 500 });
    }

    // Audit
    try { const { logAudit } = await import('@/lib/audit'); await logAudit(userId, 'user', 'mock_connected', { connection_id: data.id }); } catch (e) { console.error('audit error', e); }

    return NextResponse.json({ connection: data });
  } catch (err) {
    console.error('POST /api/seller/channels/mock/connect error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}