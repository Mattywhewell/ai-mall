import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../../app/api/telemetry/alert/route';
import { clearStore } from '../../lib/telemetry/alertDedupe';

beforeEach(() => {
  clearStore();
  vi.restoreAllMocks();
  delete process.env.TELEMETRY_ALERT_WEBHOOK;
  delete process.env.TELEMETRY_ALERT_THRESHOLD;
});

describe('POST /api/telemetry/alert', () => {
  it('does not forward when below threshold, forwards when threshold met', async () => {
    process.env.TELEMETRY_ALERT_WEBHOOK = 'https://example.com/webhook';
    process.env.TELEMETRY_ALERT_THRESHOLD = '2';

    global.fetch = vi.fn(() => Promise.resolve({ ok: true })) as any;

    const body = { event: 'renderer-import-failure', message: 'err', buildSha: 'abc' };
    const req = new Request('http://localhost/api/telemetry/alert', { method: 'POST', body: JSON.stringify(body) });

    // First call: count=1, threshold=2 -> forwarded false
    let res = await POST(req as any);
    let json = await res.json();
    expect(json.forwarded).toBe(false);
    expect((global.fetch as any).mock.calls.length).toBe(0);

    // Second call: forwarded true
    const req2 = new Request('http://localhost/api/telemetry/alert', { method: 'POST', body: JSON.stringify(body) });
    res = await POST(req2 as any);
    json = await res.json();
    expect(json.forwarded).toBe(true);
    expect((global.fetch as any).mock.calls.length).toBe(1);
    const call = (global.fetch as any).mock.calls[0];
    expect(call[0]).toBe(process.env.TELEMETRY_ALERT_WEBHOOK);
    const slackPayload = JSON.parse(call[1].body);
    expect(slackPayload.text).toContain('*renderer-import-failure*');
  });

  it('forwards immediately on critical severity', async () => {
    process.env.TELEMETRY_ALERT_WEBHOOK = 'https://example.com/webhook';
    global.fetch = vi.fn(() => Promise.resolve({ ok: true })) as any;

    const body = { event: 'renderer-import-failure', message: 'bad', severity: 'critical', buildSha: 'abc' };
    const req = new Request('http://localhost/api/telemetry/alert', { method: 'POST', body: JSON.stringify(body) });
    const res = await POST(req as any);
    const json = await res.json();
    expect(json.forwarded).toBe(true);
    expect(global.fetch).toHaveBeenCalled();
  });
});