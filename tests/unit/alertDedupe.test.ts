import { describe, it, expect, beforeEach } from 'vitest';
import { recordEvent, getEventCount, clearStore, shouldForwardAlert } from '../../lib/telemetry/alertDedupe';

describe('alertDedupe', () => {
  beforeEach(() => clearStore());

  it('records events and counts within window', async () => {
    const key = 'test:123';
    expect(await getEventCount(key)).toBe(0);
    await recordEvent(key, 1000);
    await recordEvent(key, 1500);
    expect(await getEventCount(key, 2000, 2000)).toBe(2);
  });

  it('shouldForwardAlert for critical severity', async () => {
    const key = 'test:123';
    await recordEvent(key);
    expect(await shouldForwardAlert({ key, severity: 'critical' })).toBe(true);
  });

  it('shouldForwardAlert based on threshold', async () => {
    const key = 'test:123';
    await recordEvent(key, 0);
    await recordEvent(key, 10);
    await recordEvent(key, 20);
    expect(await shouldForwardAlert({ key, severity: 'warning', threshold: 3, now: 30 })).toBe(true);
    expect(await shouldForwardAlert({ key, severity: 'warning', threshold: 5, now: 30 })).toBe(false);
  });
});