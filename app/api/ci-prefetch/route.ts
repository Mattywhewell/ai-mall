import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    // Log server-side for visibility in CI builds
    console.log(`[CI-RTR] ci-prefetch-received`, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[CI-RTR] ci-prefetch error', e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
