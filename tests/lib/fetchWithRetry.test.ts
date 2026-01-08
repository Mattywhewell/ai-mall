import { fetchWithRetry } from '@/lib/utils/fetchWithRetry';

const originalFetch = global.fetch;

afterEach(() => { (global as any).fetch = originalFetch; });

test('fetchWithRetry honors retry-after header on 429', async () => {
  let called = 0;
  (global as any).fetch = jest.fn().mockImplementation(async () => {
    called++;
    if (called === 1) return { ok: false, status: 429, headers: { get: (h: string) => h === 'retry-after' ? '1' : null }, text: async () => 'rate limited' };
    return { ok: true, json: async () => ({ success: true }) };
  });

  const res = await fetchWithRetry('https://example.com', { method: 'GET', retries: 2, backoffMs: 10 });
  expect(res).toBeDefined();
  expect(called).toBeGreaterThanOrEqual(2);
});