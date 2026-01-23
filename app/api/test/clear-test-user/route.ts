import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { clearServerTestUser } from '@/lib/testUserServerState';

// Test-only endpoint to clear the per-request `test_user` cookie.
// Gated: only enabled when NEXT_PUBLIC_INCLUDE_TEST_PAGES or CI is set to avoid exposing this in prod.
export async function GET(request: Request) {
  if (!(process.env.NEXT_PUBLIC_INCLUDE_TEST_PAGES === 'true' || process.env.CI === 'true')) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    // Diagnostics: log incoming cookies so traces show what the request carried
    try {
      // eslint-disable-next-line no-console
      console.info('test/clear-test-user: incoming Cookie header:', request.headers.get('cookie'));
    } catch (e) {}

    // Clear the cookie by setting it with maxAge: 0 (expires immediately)
    const cookieStore = await cookies();

    // Read the owner cookie so we can clear owner-specific server state
    const owner = cookieStore.get('test_user_owner')?.value;

    cookieStore.set({
      name: 'test_user',
      value: '',
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 0,
    });

    // Also clear the owner cookie
    cookieStore.set({
      name: 'test_user_owner',
      value: '',
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 0,
    });

    // Also clear the server-side runtime flag for this owner so SSR will stop injecting __test_user going forward for that owner
    try {
      clearServerTestUser(owner);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('test/clear-test-user: failed to clear server runtime test-user flag', e && (e.message || e));
    }

    // eslint-disable-next-line no-console
    console.info('test/clear-test-user: cleared test_user cookie owner:', owner);

    return NextResponse.json({ ok: true, cleared: true, owner });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
