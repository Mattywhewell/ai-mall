import { NextRequest, NextResponse } from 'next/server';
import { runVideoScheduleCheck } from '@/lib/jobs/videoScheduler';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/role-middleware';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  // Require server-side session & admin role
  const { user, error } = await requireAdmin(request as NextRequest);
  if (error) return error;

  // Log the admin action for auditability when possible
  try {
    const supabase = getSupabaseClient();
    await supabase.from('admin_actions').insert({ user_id: user?.id || null, action: 'run_video_scheduler', metadata: { ip: request.headers.get('x-forwarded-for') || null } });
  } catch (e) {
    // Best-effort; don't block primary action
    console.warn('Failed to log admin action', e);
  }

  try {
    const result = await runVideoScheduleCheck();
    revalidatePath('/admin/video');
    revalidatePath('/admin/video/jobs');

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Admin run API error:', error);
    return NextResponse.json({ error: 'Failed to run scheduler' }, { status: 500 });
  }
}
