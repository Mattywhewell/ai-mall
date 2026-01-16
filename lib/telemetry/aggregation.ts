import type RedisType from 'ioredis';

// Aggregation helper: accumulate events in a rolling window and decide when to forward
// or produce a summary. Default implementation is in-memory and suitable for testing.

const DEFAULT_WINDOW_MS = parseInt(process.env.TELEMETRY_AGGREGATION_WINDOW_MS || '60000', 10);
const DEFAULT_SAMPLE_SIZE = parseInt(process.env.TELEMETRY_AGGREGATION_SAMPLE_SIZE || '3', 10);

type Aggregate = {
  count: number;
  samples: string[];
  lastTs: number;
};

const MEM_STORE = new Map<string, Aggregate>();

let redisClient: RedisType | null = null;
let redisEnabled = false;
try {
  redisEnabled = process.env.TELEMETRY_REDIS_ENABLED === 'true' && !!process.env.TELEMETRY_REDIS_URL;
  if (redisEnabled) {
    // lazy require to avoid hard dep if not used
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const IORedis = require('ioredis');
    redisClient = new IORedis(process.env.TELEMETRY_REDIS_URL);
  }
} catch (e) {
  // If redis not available, fallback to in-memory
  // eslint-disable-next-line no-console
  console.warn('Aggregation: Redis disabled/unavailable, falling back to in-memory aggregation', e);
  redisClient = null;
  redisEnabled = false;
}

export async function recordAggregateEvent({ key, message, now = Date.now(), sampleSize = DEFAULT_SAMPLE_SIZE, windowMs = DEFAULT_WINDOW_MS }: { key: string; message?: string; now?: number; sampleSize?: number; windowMs?: number }) {
  // When redis is enabled, we'd use Redis structures (e.g., ZSET with timestamps or hash + list)
  // For now, implement a simple in-memory strategy.
  if (!redisEnabled) {
    const cutoff = now - windowMs;
    let agg = MEM_STORE.get(key);
    if (!agg) {
      agg = { count: 0, samples: [], lastTs: now };
    }

    // reset if lastTs is older than window
    if (agg.lastTs < cutoff) {
      agg.count = 0;
      agg.samples = [];
    }

    agg.count += 1;
    agg.lastTs = now;

    if (message && agg.samples.length < sampleSize) {
      agg.samples.push(message);
    }

    MEM_STORE.set(key, agg);

    // Decide whether to forward: forward when count equals sampleSize (simple heuristic)
    const shouldForward = agg.count >= sampleSize;

    return { count: agg.count, shouldForward, samples: agg.samples.slice(0, sampleSize) };
  }

  // Placeholder: Redis-based aggregation should be implemented here later.
  // Return a conservative default to avoid accidental forwarding.
  return { count: 1, shouldForward: false, samples: message ? [message] : [] };
}

export function clearAggregationStore() {
  MEM_STORE.clear();
}

export function getAggregation(key: string) {
  return MEM_STORE.get(key) ?? { count: 0, samples: [], lastTs: 0 };
}
