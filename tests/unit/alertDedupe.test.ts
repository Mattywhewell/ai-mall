import { describe, it, expect, beforeEach } from 'vitest';
import { recordEvent, getEventCount, clearStore, shouldForwardAlert } from '../../lib/telemetry/alertDedupe';

describe('alertDedupe', () => {
  beforeEach(() => clearStore());

  it('records events and counts within window', () => {
    const key = 'test:123';
    expect(getEventCount(key)).toBe(0);
    recordEvent(key, 1000);
    recordEvent(key, 1500);
    expect(getEventCount(key, 2000, 2000)).toBe(2);
  });

  it('shouldForwardAlert for critical severity', () => {
    const key = 'test:123';
    recordEvent(key);
    expect(shouldForwardAlert({ key, severity: 'critical' })).toBe(true);
  });

  it('shouldForwardAlert based on threshold', () => {
    const key = 'test:123';
    recordEvent(key, 0);
    recordEvent(key, 10);
    recordEvent(key, 20);
    expect(shouldForwardAlert({ key, severity: 'warning', threshold: 3, now: 30 })).toBe(true);
    expect(shouldForwardAlert({ key, severity: 'warning', threshold: 5, now: 30 })).toBe(false);
  });
});