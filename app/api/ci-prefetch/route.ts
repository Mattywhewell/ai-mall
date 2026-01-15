import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    // Log server-side for visibility in CI builds and include server timestamp
    const server_received_at = new Date().toISOString();
    console.log(`[CI-RTR] ci-prefetch-received`, body, { server_received_at });

    // Persist receipt to test-results so the GH workflow will upload it as an artifact
    try {
      const receiptsDir = path.join(process.cwd(), 'test-results');
      const receiptsFile = path.join(receiptsDir, 'ci-prefetch-received.log');
      try { fs.mkdirSync(receiptsDir, { recursive: true }); } catch (e) {}
      const entry = JSON.stringify({ ci_prefetch_id: body?.ci_prefetch_id, server_received_at, body: body || null }) + '\n';
      fs.appendFileSync(receiptsFile, entry, 'utf8');
      console.log('[CI-RTR] ci-prefetch-written-to-log', receiptsFile);
    } catch (e) {
      console.error('[CI-RTR] failed-to-write-ci-prefetch-log', e);
    }

    return NextResponse.json({ ok: true, ci_prefetch_id: body?.ci_prefetch_id, server_received_at });
  } catch (e) {
    console.error('[CI-RTR] ci-prefetch error', e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
