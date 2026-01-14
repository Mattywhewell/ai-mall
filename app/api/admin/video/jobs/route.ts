import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

function toCsv(rows: any[]) {
  if (!rows || rows.length === 0) return '';
  const headers = ['id','job_name','started_at','finished_at','status','activated_count','deactivated_count','error_message','metadata'];
  const escape = (v: any) => {
    if (v === null || v === undefined) return '""';
    const s = typeof v === 'string' ? v : JSON.stringify(v);
    return '"' + s.replace(/"/g, '""') + '"';
  };
  const lines = [headers.join(',')];
  for (const r of rows) {
    const vals = headers.map(h => escape(r[h]));
    lines.push(vals.join(','));
  }
  return lines.join('\n');
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const params = url.searchParams;

    const page = Math.max(1, parseInt(params.get('page') || '1', 10));
    const perPage = Math.min(100, Math.max(1, parseInt(params.get('per_page') || '20', 10)));
    const status = params.get('status');
    const startedAfter = params.get('started_after');
    const startedBefore = params.get('started_before');
    const searchQ = params.get('q')?.trim() || null;
    const exportCsv = params.get('export') === 'csv' || request.headers.get('accept') === 'text/csv';

    // Check if job_run_log table exists in schema cache
    let tableExists = false;
    try {
      const { error: tableCheckError } = await supabase.from('job_run_log').select('id').limit(1);
      tableExists = !tableCheckError || tableCheckError.code !== 'PGRST205';
    } catch (e) {
      tableExists = false;
    }

    let logs: any[] = [];
    let totalCount = 0;

    if (tableExists) {
      // Build query normally
      let query = supabase.from('job_run_log').select('*', { count: 'exact' }).order('created_at', { ascending: false });

      if (status) query = query.eq('status', status);
      if (startedAfter) query = query.gte('started_at', startedAfter);
      if (startedBefore) query = query.lte('started_at', startedBefore);

      // Apply simple search across job_name, error_message and metadata when `q` provided
      if (searchQ) {
        // sanitize simple chars and limit length to avoid abuse
        const safe = searchQ.replace(/["'%]/g, '').slice(0, 200);
        const like = `%${safe}%`;
        try {
          query = query.or(`job_name.ilike.${like},error_message.ilike.${like},metadata.ilike.${like}`);
        } catch (e) {
          console.warn('Search filter not applied due to client limitations', e);
        }
      }

      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      const { data, count, error } = await query.range(from, to);

      if (error) {
        console.error('Error fetching job run logs:', error);
        return NextResponse.json({ error: 'Failed to fetch job run logs' }, { status: 500 });
      }

      logs = data || [];
      totalCount = count ?? logs.length;
    } else {
      // Table not available yet, return empty results
      console.warn('job_run_log table not yet available in PostgREST schema cache');
      logs = [];
      totalCount = 0;
    }

    if (exportCsv) {
      const csv = toCsv(logs);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="job_run_log.csv"'
        }
      });
    }

    return NextResponse.json({ success: true, logs, total: totalCount ?? logs.length, page, per_page: perPage });
  } catch (error) {
    console.error('Admin jobs API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}