import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // For now, enqueue a job record for syncing and return 202
    const { data, error } = await supabase
      .from('channel_sync_jobs')
      .insert({ channel_connection_id: id, seller_id: userId, status: 'queued' })
      .select()
      .single();

    if (error) {
      console.error('Create sync job error', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, job: data }, { status: 202 });
  } catch (err) {
    console.error('POST /api/seller/channels/[id]/sync error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
