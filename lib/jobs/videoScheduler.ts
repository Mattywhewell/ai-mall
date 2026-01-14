import { createClient } from '@/lib/supabaseServer';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Checks video_assets scheduling fields and toggles is_active accordingly.
 * - Deactivates assets where schedule_end < now and is_active = true
 * - Activates assets where schedule_start <= now and (is_active = false OR is_active IS NULL)
 * Accepts an optional Supabase client (useful for testing).
 */
export async function runVideoScheduleCheck(supabaseClient?: SupabaseClient) {
  const supabase = supabaseClient || (await createClient());

  const now = new Date().toISOString();

  // Insert a running job_run_log record
  const { data: insertedRun, error: insertError } = await supabase
    .from('job_run_log')
    .insert({ job_name: 'video_schedules', status: 'running', started_at: now })
    .select('*')
    .single();

  const runId = insertedRun?.id || null;

  try {
    // Deactivate expired assets
    const { data: deactivated, error: deactivateError } = await supabase
      .from('video_assets')
      .update({ is_active: false })
      .lte('schedule_end', now)
      .eq('is_active', true)
      .select('id');

    if (deactivateError) {
      console.error('Error deactivating expired videos:', deactivateError);
      // Update job_run_log as failed
      await supabase.from('job_run_log').update({ status: 'failed', finished_at: new Date().toISOString(), error_message: String(deactivateError) }).eq('id', runId);
      throw deactivateError;
    }

    // Activate assets whose schedule has started
    const { data: activated, error: activateError } = await supabase
      .from('video_assets')
      .update({ is_active: true })
      .lte('schedule_start', now)
      .or('is_active.eq.false,is_active.is.null')
      .select('id');

    if (activateError) {
      console.error('Error activating scheduled videos:', activateError);
      await supabase.from('job_run_log').update({ status: 'failed', finished_at: new Date().toISOString(), error_message: String(activateError) }).eq('id', runId);
      throw activateError;
    }

    const activatedCount = Array.isArray(activated) ? activated.length : 0;
    const deactivatedCount = Array.isArray(deactivated) ? deactivated.length : 0;

    // Update job_run_log as completed
    await supabase.from('job_run_log').update({ status: 'completed', finished_at: new Date().toISOString(), activated_count: activatedCount, deactivated_count: deactivatedCount }).eq('id', runId);

    return {
      activated: activatedCount,
      deactivated: deactivatedCount,
      runId
    };
  } catch (err) {
    // In case of any thrown error not handled above
    await supabase.from('job_run_log').update({ status: 'failed', finished_at: new Date().toISOString(), error_message: String(err) }).eq('id', runId);
    throw err;
  }
}
