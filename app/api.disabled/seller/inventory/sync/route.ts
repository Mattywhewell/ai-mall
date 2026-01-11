import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    const url = new URL(req.url);
    const itemId = url.searchParams.get('item');

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (itemId) {
      await supabase.from('inventory_sync_log').insert({ seller_id: userId, product_mapping_id: itemId, sync_type: 'push', sync_status: 'pending' });
    } else {
      await supabase.from('inventory_sync_log').insert({ seller_id: userId, sync_type: 'push', sync_status: 'pending' });
    }

    return NextResponse.json({ success: true, message: 'Inventory sync queued (placeholder)' });
  } catch (err) {
    console.error('POST /api/seller/inventory/sync error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}