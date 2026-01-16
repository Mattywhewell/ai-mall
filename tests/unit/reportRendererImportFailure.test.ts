import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { reportRendererImportFailure } from '../../lib/telemetry/reportRendererImportFailure';

describe('reportRendererImportFailure', () => {
  beforeEach(() => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: true })) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('posts to the telemetry endpoint', async () => {
    await reportRendererImportFailure('test error', { foo: 'bar' });
    expect(global.fetch).toHaveBeenCalled();
    const calledWith = (global.fetch as any).mock.calls[0];
    expect(calledWith[0]).toBe('/api/telemetry/hero-event');
    const body = JSON.parse(calledWith[1].body);
    expect(body.event).toBe('renderer-import-failure');
    expect(body.message).toBe('test error');
    expect(body.extra.foo).toBe('bar');
  });
});
