export async function reportRendererImportFailure(errorMessage: string, extra: Record<string, any> = {}) {
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
  } catch (e) {
    // Do not throw — telemetry failure should not impact page
    // eslint-disable-next-line no-console
    console.warn('Telemetry report failed', e);
  }
}
