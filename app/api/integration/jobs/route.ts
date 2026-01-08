import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

/**
 * GET /api/integration/jobs
 * Get all pending integration jobs
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('autonomous_jobs')
      .select('*')
      .order('scheduled_for', { ascending: false })
      .limit(limit);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('job_type', type);
    }

    const { data: jobs, error } = await query;

    if (error) throw error;

    // Get stats
    const { data: stats } = await supabase
      .from('autonomous_jobs')
      .select('status')
      .then(({ data }) => {
        const pending = data?.filter(j => j.status === 'pending').length || 0;
        const inProgress = data?.filter(j => j.status === 'in_progress').length || 0;
        const completed = data?.filter(j => j.status === 'completed').length || 0;
        const failed = data?.filter(j => j.status === 'failed').length || 0;
        
        return {
          data: {
            pending,
            inProgress,
            completed,
            failed,
            total: data?.length || 0
          }
        };
      });

    return NextResponse.json({
      jobs: jobs || [],
      stats: stats || { pending: 0, inProgress: 0, completed: 0, failed: 0, total: 0 }
    });
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integration/jobs/retry
 * Retry failed jobs
 */
export async function POST(request: Request) {
  try {    const supabase = getSupabaseClient();    const body = await request.json();
    const { jobId, jobIds } = body;

    if (jobId) {
      // Retry single job
      await supabase
        .from('autonomous_jobs')
        .update({
          status: 'pending',
          scheduled_for: new Date().toISOString(),
          attempts: 0,
          last_error: null
        })
        .eq('id', jobId)
        .eq('status', 'failed');

      return NextResponse.json({
        success: true,
        message: 'Job queued for retry'
      });
    }

    if (jobIds && Array.isArray(jobIds)) {
      // Retry multiple jobs
      await supabase
        .from('autonomous_jobs')
        .update({
          status: 'pending',
          scheduled_for: new Date().toISOString(),
          attempts: 0,
          last_error: null
        })
        .in('id', jobIds)
        .eq('status', 'failed');

      return NextResponse.json({
        success: true,
        message: `${jobIds.length} jobs queued for retry`
      });
    }

    return NextResponse.json(
      { error: 'Provide jobId or jobIds' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error retrying jobs:', error);
    return NextResponse.json(
      { error: 'Failed to retry jobs', details: error.message },
      { status: 500 }
    );
  }
}
