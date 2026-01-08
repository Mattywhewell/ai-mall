export type FetchOptions = RequestInit & { retries?: number; backoffMs?: number };

export async function fetchWithRetry(input: RequestInfo, init: FetchOptions = {}) {
  const retries = init.retries ?? 3;
  const backoffMs = init.backoffMs ?? 300;

  let attempt = 0;
  let lastError: any = null;

  while (attempt <= retries) {
    try {
      const res = await fetch(input, init);
      if (res.ok) return res;
      // check for retry-after header
      const retryAfter = res.headers && (res.headers.get ? res.headers.get('retry-after') : null);
      const body = await res.text().catch(() => '');
      const err = new Error(`HTTP ${res.status}: ${body}`);
      lastError = err;
      if (res.status === 429 && retryAfter) {
        // parse retry-after value (seconds)
        const waitSec = parseInt(String(retryAfter), 10);
        if (!isNaN(waitSec)) {
          await new Promise((r) => setTimeout(r, waitSec * 1000));
        }
        throw err;
      }
      // treat 5xx and 429 as retriable
      if (res.status >= 500 || res.status === 429) {
        throw err;
      } else {
        // non-retriable - throw immediately
        throw err;
      }
    } catch (err) {
      lastError = err;
      if (attempt === retries) break;
      // exponential backoff with jitter
      const delay = Math.round(backoffMs * Math.pow(2, attempt) * (0.75 + Math.random() * 0.5));
      await new Promise((r) => setTimeout(r, delay));
      attempt++;
    }
  }

  throw lastError;
}
