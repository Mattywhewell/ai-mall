import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) return NextResponse.json({ jobs: [] });

    const { data, error } = await supabase
      .from('job_queue')
      .select('*')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('GET /api/seller/jobs error', error);
      return NextResponse.json({ jobs: [] });
    }

    return NextResponse.json({ jobs: data || [] });
  } catch (err) {
    console.error('GET /api/seller/jobs unexpected error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const payload = body.payload || {};
    const jobType = body.job_type || 'generic';
    const scheduledAt = body.scheduled_at || new Date().toISOString();

    const insertPayload = {
      seller_id: userId,
      job_type: jobType,
      payload,
      scheduled_at: scheduledAt
    };

    const { data, error } = await supabase
      .from('job_queue')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('POST /api/seller/jobs insert error', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Audit: job enqueued
    try {
      const { logAudit } = await import('@/lib/audit');
      await logAudit(userId, 'user', 'job_enqueued', { job_id: data.id, job_type: jobType });
    } catch (auditErr) {
      console.error('Audit log failed for job enqueue', auditErr);
    }

    return NextResponse.json({ job: data });
  } catch (err) {
    console.error('POST /api/seller/jobs unexpected error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}