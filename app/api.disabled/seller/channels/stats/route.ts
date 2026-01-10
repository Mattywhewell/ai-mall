import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) return NextResponse.json({ stats: {} });

    const [{ data: connections }, { data: pendingOrders }, { data: syncErrors }] = await Promise.all([
      supabase.from('seller_channel_connections').select('id').eq('seller_id', userId),
      supabase.from('channel_orders').select('id').eq('seller_id', userId).eq('order_status', 'pending'),
      supabase.from('channel_orders').select('id').eq('seller_id', userId).eq('sync_status', 'error')
    ]);

    const stats = {
      totalConnections: (connections || []).length,
      activeConnections: (await supabase.from('seller_channel_connections').select('id').eq('seller_id', userId).eq('is_active', true)).data?.length || 0,
      pendingOrders: (pendingOrders || []).length,
      syncErrors: (syncErrors || []).length
    };

    return NextResponse.json({ stats });
  } catch (err) {
    console.error('GET /api/seller/channels/stats error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}