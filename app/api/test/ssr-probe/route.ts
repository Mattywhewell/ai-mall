import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Deterministic, test-only SSR probe API. Gated to avoid exposing in prod.
export async function GET(request: Request) {
  if (!(process.env.NEXT_PUBLIC_INCLUDE_TEST_PAGES === 'true' || process.env.CI === 'true')) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const cookieStore = await cookies();
    const cookieVal = cookieStore.get('test_user')?.value;
    const owner = cookieStore.get('test_user_owner')?.value;

    let parsed: any = null;
    if (cookieVal) {
      try {
        parsed = JSON.parse(decodeURIComponent(cookieVal));
      } catch (e) {
        try { parsed = JSON.parse(cookieVal); } catch (e2) { parsed = null; }
      }
    }

    // Log for traces to capture whether the server saw cookie and the probe header
    try {
      // eslint-disable-next-line no-console
      console.info('test/ssr-probe: incoming Cookie header:', request.headers.get('cookie'), 'cookieVal:', cookieVal, 'owner:', owner || '<none>', 'parsed:', parsed, 'probeHeader:', request.headers.get('x-e2e-ssr-probe'));
    } catch (e) {
      // ignore logging errors
    }

    const role = parsed?.role || null;
    const res = NextResponse.json({ cookieVal: cookieVal || null, owner: owner || null, parsed: parsed || null, sawProbeHeader: !!request.headers.get('x-e2e-ssr-probe'), role }, {
      headers: { 'x-e2e-saw-role': role || '' }
    });

    return res;
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
