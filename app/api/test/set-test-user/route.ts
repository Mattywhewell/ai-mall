import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { setServerTestUser } from '@/lib/testUserServerState';

// Test-only endpoint to set a per-request `test_user` cookie.
// Gated: only enabled when NEXT_PUBLIC_INCLUDE_TEST_PAGES or CI is set to avoid exposing this in prod.
export async function GET(request: Request) {
  if (!(process.env.NEXT_PUBLIC_INCLUDE_TEST_PAGES === 'true' || process.env.CI === 'true')) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const url = new URL(request.url);
    const role = url.searchParams.get('role') || 'citizen';
    // Use raw JSON string for cookie value to avoid double-encoding ambiguity in traces
    const cookieVal = JSON.stringify({ role });

    // Diagnostics: log incoming cookies/headers in CI/debug so traces show whether the request
    // actually carried a cookie at the time this endpoint was invoked.
    try {
      // eslint-disable-next-line no-console
      console.info('test/set-test-user: incoming Cookie header:', request.headers.get('cookie'));
      // DIAG: request details (safe subset)
      try {
        // eslint-disable-next-line no-console
        console.info('DIAG: set-test-user request', { url: request.url, role, ts: Date.now(), userAgent: request.headers.get('user-agent') });
      } catch (e) {}
    } catch (e) {
      // ignore logging errors
    }

    // Set a cookie on the response so subsequent SSR requests will carry it.
    const cookieStore = await cookies();

    // If the incoming request already had a test_user_owner cookie, preserve it; otherwise generate one.
    const incomingOwner = cookieStore.get('test_user_owner')?.value;
    const owner = incomingOwner || `${Date.now()}-${Math.random().toString(36).slice(2,10)}`;

    cookieStore.set({
      name: 'test_user',
      value: cookieVal,
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
    });

    // Also set a companion owner cookie so parallel workers won't clobber global runtime state
    cookieStore.set({
      name: 'test_user_owner',
      value: owner,
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60,
    });

    // Also set the server-side runtime flag for this owner so SSR respects explicit test-user set/clear operations
    try {
      setServerTestUser(role, owner);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('test/set-test-user: failed to set server runtime test-user flag', e && (e.message || e));
    }

    // Log the value being set so we can later correlate server logs and probe logs
    // eslint-disable-next-line no-console
    console.info('test/set-test-user: set test_user cookie value:', cookieVal, 'role:', role, 'owner:', owner);

    return NextResponse.json({ ok: true, role, owner });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
