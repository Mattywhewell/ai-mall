import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  // Generate a stable request identifier for lifecycle correlation
  const request_id = (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function')
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const lifecycleDir = path.join(process.cwd(), 'test-results');
  const lifecycleFile = path.join(lifecycleDir, 'ci-prefetch-lifecycle.log');

  // Helper to append lifecycle events (best-effort)
  function appendLifecycle(entry) {
    try {
      try { fs.mkdirSync(lifecycleDir, { recursive: true }); } catch (e) {}
      fs.appendFileSync(lifecycleFile, JSON.stringify(entry) + '\n', 'utf8');
    } catch (e) {
      console.error('[CI-RTR] failed-to-write-lifecycle', e);
    }
  }

  // Log start
  const start_at = new Date().toISOString();
  console.log('[CI-RTR] ci-prefetch-start', { request_id, start_at, url: request.url });
  appendLifecycle({ event: 'start', request_id, start_at, url: request.url });

  // Listen for request abort if available (best-effort)
  try {
    // @ts-ignore - Request.signal may exist in runtime
    if (request && (request as any).signal && typeof (request as any).signal.addEventListener === 'function') {
      // use once to avoid duplicate logging
      (request as any).signal.addEventListener('abort', () => {
        const aborted_at = new Date().toISOString();
        console.log('[CI-RTR] ci-prefetch-aborted', { request_id, aborted_at });
        appendLifecycle({ event: 'abort', request_id, aborted_at });
      }, { once: true });
    }
  } catch (e) {
    // ignore
  }

  try {
    const body = await request.json().catch(() => ({}));
    // Log server-side for visibility in CI builds and include server timestamp
    const server_received_at = new Date().toISOString();
    console.log(`[CI-RTR] ci-prefetch-received`, body, { server_received_at, request_id });

    // Persist receipt to test-results so the GH workflow will upload it as an artifact
    try {
      const receiptsDir = path.join(process.cwd(), 'test-results');
      const receiptsFile = path.join(receiptsDir, 'ci-prefetch-received.log');
      try { fs.mkdirSync(receiptsDir, { recursive: true }); } catch (e) {}
      const entry = JSON.stringify({ ci_prefetch_id: body?.ci_prefetch_id, server_received_at, body: body || null, request_id }) + '\n';
      fs.appendFileSync(receiptsFile, entry, 'utf8');
      console.log('[CI-RTR] ci-prefetch-written-to-log', receiptsFile);
    } catch (e) {
      console.error('[CI-RTR] failed-to-write-ci-prefetch-log', e);
    }

    // Record finish in lifecycle log
    const finished_at = new Date().toISOString();
    appendLifecycle({ event: 'finish', request_id, finished_at, ci_prefetch_id: body?.ci_prefetch_id });

    return NextResponse.json({ ok: true, ci_prefetch_id: body?.ci_prefetch_id, server_received_at, request_id });
  } catch (e) {
    console.error('[CI-RTR] ci-prefetch error', e);
    appendLifecycle({ event: 'error', request_id, error: String(e), at: new Date().toISOString() });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
