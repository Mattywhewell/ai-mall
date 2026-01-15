import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    // Log server-side for visibility in CI builds and include server timestamp
    const server_received_at = new Date().toISOString();
    console.log(`[CI-RTR] ci-prefetch-received`, body, { server_received_at });
    return NextResponse.json({ ok: true, ci_prefetch_id: body?.ci_prefetch_id, server_received_at });
  } catch (e) {
    console.error('[CI-RTR] ci-prefetch error', e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
