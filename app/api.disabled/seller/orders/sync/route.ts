import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    const url = new URL(req.url);
    const channelId = url.searchParams.get('channel');

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Enqueue a job to sync orders. Worker will process it.
    const jobPayload = { channel_connection_id: channelId };
    const { data: job, error: jobErr } = await supabase
      .from('job_queue')
      .insert({ seller_id: userId, job_type: 'orders_sync', payload: jobPayload, scheduled_at: new Date().toISOString() })
      .select()
      .single();

    if (jobErr) {
      console.error('Failed to enqueue orders_sync job', jobErr);
      return NextResponse.json({ error: 'Failed to enqueue job' }, { status: 500 });
    }

    return NextResponse.json({ success: true, job });
  } catch (err) {
    console.error('POST /api/seller/orders/sync error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}