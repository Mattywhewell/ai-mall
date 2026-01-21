import type RedisType from 'ioredis';

type EventRecord = {
  timestamps: number[];
};

// Simple in-memory dedupe/counting store. Not durable across processes - suitable for small projects
// or as a first-pass implementation. Keyed by fingerprint (e.g., event name + host). TTL window measured in ms.

const STORE = new Map<string, EventRecord>();
const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute

let redisClient: RedisType | null = null;
let redisEnabled = process.env.TELEMETRY_REDIS_ENABLED === 'true' && !!process.env.TELEMETRY_REDIS_URL;

if (redisEnabled) {
  try {
     
    const IORedis = require('ioredis');
    redisClient = new IORedis(process.env.TELEMETRY_REDIS_URL);
  } catch (e) {
    // If ioredis is not available or connection fails, fall back to in-memory and log a warning.
    // Do not fail the application.
     
    console.warn('Redis telemetry dedupe unavailable, falling back to in-memory store:', e);
    redisClient = null;
    redisEnabled = false;
  }
}

export async function recordEvent(key: string, now = Date.now(), windowMs = DEFAULT_WINDOW_MS) {
  if (redisEnabled && redisClient) {
    // use Redis INCR with expiry (window seconds)
    const redisKey = `telemetry:${key}:${Math.floor(now / 1000 / (windowMs / 1000))}`;
    const count = await redisClient.incr(redisKey);
    // set expiry to window if newly created
    if (count === 1) {
      await redisClient.expire(redisKey, Math.ceil(windowMs / 1000));
    }
    return count;
  }

  const rec = STORE.get(key) ?? { timestamps: [] };
  // keep only timestamps within the window
  const cutoff = now - windowMs;
  rec.timestamps = rec.timestamps.filter(ts => ts >= cutoff);
  rec.timestamps.push(now);
  STORE.set(key, rec);
  return rec.timestamps.length;
}

export async function getEventCount(key: string, now = Date.now(), windowMs = DEFAULT_WINDOW_MS) {
  if (redisEnabled && redisClient) {
    const redisKey = `telemetry:${key}:${Math.floor(now / 1000 / (windowMs / 1000))}`;
    const val = await redisClient.get(redisKey);
    return val ? parseInt(val, 10) : 0;
  }

  const rec = STORE.get(key);
  if (!rec) return 0;
  const cutoff = now - windowMs;
  return rec.timestamps.filter(ts => ts >= cutoff).length;
}

export function clearStore() {
  STORE.clear();
  if (redisClient) {
    try { redisClient.flushdb(); } catch (e) { /* ignore */ }
  }
}

export async function shouldForwardAlert({ key, severity = 'warning', threshold = 3, now = Date.now(), windowMs = DEFAULT_WINDOW_MS }: {
  key: string;
  severity?: 'warning' | 'critical' | string;
  threshold?: number; // number of events in window to trigger alert when severity is not critical
  now?: number;
  windowMs?: number;
}) {
  if (severity === 'critical') return true;
  const count = await getEventCount(key, now, windowMs);
  return count >= threshold;
}
