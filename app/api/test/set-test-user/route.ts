import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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
    } catch (e) {
      // ignore logging errors
    }

    // Set a cookie on the response so subsequent SSR requests will carry it.
    cookies().set({
      name: 'test_user',
      value: cookieVal,
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
    });

    // Log the value being set so we can later correlate server logs and probe logs
    // eslint-disable-next-line no-console
    console.info('test/set-test-user: set test_user cookie value:', cookieVal, 'role:', role);

    return NextResponse.json({ ok: true, role });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
