export async function reportRendererImportFailure(errorMessage: string, extra: Record<string, any> = {}, opts: { severity?: 'warning'|'critical' } = {}) {
  try {
    // lightweight client-side telemetry: reuse existing telemetry endpoint
    await fetch('/api/telemetry/hero-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'renderer-import-failure',
        message: errorMessage,
        extra,
        url: typeof window !== 'undefined' ? window.location.href : null,
        ts: Date.now(),
      }),
    });

    // Also call the alerting route (server-only) with a small alert payload. The server decides whether to forward to Slack/webhook.
    try {
      await fetch('/api/telemetry/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'renderer-import-failure',
          message: errorMessage,
          stack: extra.stack || null,
          url: typeof window !== 'undefined' ? window.location.href : null,
          buildSha: (window as any).__BUILD_SHA || null,
          severity: opts.severity || 'warning',
        }),
      });
    } catch (e) {
      // ignore alert posting failures
    }
  } catch (e) {
    // Do not throw — telemetry failure should not impact page
     
    console.warn('Telemetry report failed', e);
  }
}
