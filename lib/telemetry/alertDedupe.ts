type EventRecord = {
  timestamps: number[];
};

// Simple in-memory dedupe/counting store. Not durable across processes - suitable for small projects
// or as a first-pass implementation. Keyed by fingerprint (e.g., event name + host). TTL window measured in ms.

const STORE = new Map<string, EventRecord>();
const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute

export function recordEvent(key: string, now = Date.now(), windowMs = DEFAULT_WINDOW_MS) {
  const rec = STORE.get(key) ?? { timestamps: [] };
  // keep only timestamps within the window
  const cutoff = now - windowMs;
  rec.timestamps = rec.timestamps.filter(ts => ts >= cutoff);
  rec.timestamps.push(now);
  STORE.set(key, rec);
  return rec.timestamps.length;
}

export function getEventCount(key: string, now = Date.now(), windowMs = DEFAULT_WINDOW_MS) {
  const rec = STORE.get(key);
  if (!rec) return 0;
  const cutoff = now - windowMs;
  return rec.timestamps.filter(ts => ts >= cutoff).length;
}

export function clearStore() {
  STORE.clear();
}

export function shouldForwardAlert({ key, severity = 'warning', threshold = 3, now = Date.now(), windowMs = DEFAULT_WINDOW_MS }: {
  key: string;
  severity?: 'warning' | 'critical' | string;
  threshold?: number; // number of events in window to trigger alert when severity is not critical
  now?: number;
  windowMs?: number;
}) {
  if (severity === 'critical') return true;
  const count = getEventCount(key, now, windowMs);
  return count >= threshold;
}
