import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Placeholder: enqueue price sync jobs. Here, create a price_sync_log entry indicating pending sync
    await supabase.from('price_sync_log').insert({ seller_id: userId, sync_status: 'pending' });

    return NextResponse.json({ success: true, message: 'Price sync queued (placeholder)' });
  } catch (err) {
    console.error('POST /api/seller/prices/sync error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}