import { describe, it, expect, beforeEach } from 'vitest';
import { recordAggregateEvent, clearAggregationStore, getAggregation } from '../../lib/telemetry/aggregation';

describe('aggregation', () => {
  beforeEach(() => {
    clearAggregationStore();
  });

  it('accumulates counts and samples and triggers shouldForward when sampleSize reached', async () => {
    const key = 'agg:test:1';
    let r = await recordAggregateEvent({ key, message: 'first', now: 1000, sampleSize: 2, windowMs: 2000 });
    expect(r.count).toBe(1);
    expect(r.shouldForward).toBe(false);
    expect(r.samples).toEqual(['first']);

    r = await recordAggregateEvent({ key, message: 'second', now: 1500, sampleSize: 2, windowMs: 2000 });
    expect(r.count).toBe(2);
    expect(r.shouldForward).toBe(true);
    expect(r.samples).toEqual(['first', 'second']);
  });

  it('resets after window elapses', async () => {
    const key = 'agg:test:2';
    let r = await recordAggregateEvent({ key, message: 'a', now: 1000, sampleSize: 2, windowMs: 1000 });
    expect(r.count).toBe(1);

    // now after window: should reset
    r = await recordAggregateEvent({ key, message: 'b', now: 3000, sampleSize: 2, windowMs: 1000 });
    expect(r.count).toBe(1);
    expect(r.samples).toEqual(['b']);
  });
});