import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: connection, error: connErr } = await supabase
      .from('seller_channel_connections')
      .select('*')
      .eq('id', params.id)
      .eq('seller_id', userId)
      .single();

    if (connErr || !connection) return NextResponse.json({ error: 'Connection not found' }, { status: 404 });

    if (connection.channel_type !== 'shopify') {
      return NextResponse.json({ error: 'fetchProducts currently only supports Shopify' }, { status: 400 });
    }

    const { decryptText } = await import('@/lib/encryption');
    const accessToken = connection.access_token ? decryptText(connection.access_token) : null;
    if (!accessToken) return NextResponse.json({ error: 'Missing access token' }, { status: 400 });

    const { createAdapter } = await import('@/lib/channel-adapters');
    // supply decrypted token into a shallow copy to pass to adapter
    const connForAdapter = { ...connection, access_token: accessToken };
    const adapter = createAdapter(connForAdapter as any);

    const products = await adapter.fetchProducts();

    return NextResponse.json({ products });
  } catch (err) {
    console.error('GET /api/seller/channels/[id]/fetch-products error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}