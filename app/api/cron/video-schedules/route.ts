import { NextRequest, NextResponse } from 'next/server';
import { runVideoScheduleCheck } from '@/lib/jobs/videoScheduler';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  // Token-based validation: require X-Scheduler-Token to match VIDEO_SCHEDULER_TOKEN when set
  const token = request.headers.get('x-scheduler-token') || '';
  const requiredToken = process.env.VIDEO_SCHEDULER_TOKEN || '';

  if (requiredToken) {
    if (token !== requiredToken) {
      return NextResponse.json({ error: 'Unauthorized - invalid token' }, { status: 401 });
    }
  } else {
    console.warn('VIDEO_SCHEDULER_TOKEN is not set; cron endpoint is unprotected in this environment.');
  }

  // Optional IP allowlist validation using X-Forwarded-For
  const forwardedFor = request.headers.get('x-forwarded-for') || request.ip || null;
  const allowlistRaw = process.env.VIDEO_SCHEDULER_IP_ALLOWLIST || undefined;
  const { checkIpAllowlist, verifyHmacSignature } = await import('@/lib/security/schedulerAuth');
  if (!checkIpAllowlist(forwardedFor, allowlistRaw)) {
    return NextResponse.json({ error: 'Unauthorized - IP not allowed' }, { status: 401 });
  }

  // Optional HMAC signature validation
  const hmacSecret = process.env.VIDEO_SCHEDULER_HMAC_SECRET || '';
  if (hmacSecret) {
    const signature = request.headers.get('x-scheduler-signature') || '';
    // Read raw body - NextRequest.text() will give us string body
    const rawBody = await request.text();
    const valid = verifyHmacSignature(hmacSecret, rawBody || '', signature);
    if (!valid) {
      return NextResponse.json({ error: 'Unauthorized - invalid signature' }, { status: 401 });
    }
  }

  try {
    const result = await runVideoScheduleCheck();

    // Revalidate admin video page so UI updates
    revalidatePath('/admin/video');

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Video schedule cron error:', error);
    return NextResponse.json({ error: 'Failed to run video schedule job' }, { status: 500 });
  }
}
