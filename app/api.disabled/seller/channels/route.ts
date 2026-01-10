import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) return NextResponse.json({ connections: [] });

    const { data, error } = await supabase
      .from('seller_channel_connections')
      .select('*')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });

    if (error && error.code === '42P01') {
      return NextResponse.json({ connections: [] });
    }

    return NextResponse.json({ connections: data || [] });
  } catch (err) {
    console.error('GET /api/seller/channels error', err);
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

    const { encryptText } = await import('@/lib/encryption');

    const insertPayload = {
      seller_id: userId,
      channel_type: body.channel_type,
      channel_name: body.channel_name,
      store_url: body.store_url || null,
      api_key: body.api_key ? encryptText(body.api_key) : null,
      api_secret: body.api_secret ? encryptText(body.api_secret) : null,
      access_token: body.access_token ? encryptText(body.access_token) : null,
      store_id: body.store_id || null,
      marketplace_id: body.marketplace_id || null,
      is_active: true
    };

    const { data, error } = await supabase
      .from('seller_channel_connections')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('Insert channel error', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Audit: channel connected
    try {
      const { logAudit } = await import('@/lib/audit');
      await logAudit(userId, 'user', 'channel_connected', { channel_type: data.channel_type, channel_name: data.channel_name, store_url: data.store_url, connection_id: data.id });
    } catch (auditErr) {
      console.error('Audit log failed for channel create', auditErr);
    }

    return NextResponse.json({ connection: data });
  } catch (err) {
    console.error('POST /api/seller/channels error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}