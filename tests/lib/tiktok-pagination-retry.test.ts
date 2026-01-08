import { TikTokAdapter } from '@/lib/channel-adapters/tiktok';

const originalFetch = global.fetch;

afterEach(() => {
  (global as any).fetch = originalFetch;
});

test('TikTokAdapter pagination collects multiple pages', async () => {
  (global as any).fetch = jest.fn().mockImplementation(async (url: string) => {
    const u = new URL(String(url));
    const cursor = u.searchParams.get('cursor');
    if (!cursor) return { ok: true, json: async () => ({ data: { products: new Array(50).fill(0).map((_, i) => ({ id: `T-${i}` })), next_cursor: 'cursor1' } }) };
    if (cursor === 'cursor1') return { ok: true, json: async () => ({ data: { products: new Array(5).fill(0).map((_, i) => ({ id: `T-${50 + i}` })) } }) };
    return { ok: true, json: async () => ({ data: { products: [] } }) };
  });

  const adapter = new TikTokAdapter({ accessToken: 'fake', shopId: 'shop-1' });
  const products = await adapter.fetchProducts();
  expect(products.length).toBe(55);
});

test('TikTokAdapter retries on transient non-ok', async () => {
  let called = 0;
  (global as any).fetch = jest.fn().mockImplementation(async () => {
    called++;
    if (called < 3) return { ok: false, status: 500, text: async () => 'server error' };
    return { ok: true, json: async () => ({ data: { products: [{ id: 'T-1' }] } }) };
  });

  const adapter = new TikTokAdapter({ accessToken: 'fake' });
  const products = await adapter.fetchProducts();
  expect(products.length).toBeGreaterThan(0);
  expect(called).toBeGreaterThanOrEqual(3);
});