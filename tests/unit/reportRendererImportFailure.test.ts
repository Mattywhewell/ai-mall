import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { reportRendererImportFailure } from '../../lib/telemetry/reportRendererImportFailure';

describe('reportRendererImportFailure', () => {
  beforeEach(() => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: true })) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('posts to the telemetry endpoint and alert endpoint', async () => {
    await reportRendererImportFailure('test error', { foo: 'bar' }, { severity: 'warning' });
    expect(global.fetch).toHaveBeenCalled();
    const calls = (global.fetch as any).mock.calls;
    // First call posts to hero-event
    expect(calls[0][0]).toBe('/api/telemetry/hero-event');
    const body0 = JSON.parse(calls[0][1].body);
    expect(body0.event).toBe('renderer-import-failure');
    expect(body0.message).toBe('test error');
    expect(body0.extra.foo).toBe('bar');

    // Second call posts to alert endpoint (fire-and-forget)
    expect(calls[1][0]).toBe('/api/telemetry/alert');
    const body1 = JSON.parse(calls[1][1].body);
    expect(body1.event).toBe('renderer-import-failure');
    expect(body1.message).toBe('test error');
    expect(body1.severity).toBe('warning');
  });
});
