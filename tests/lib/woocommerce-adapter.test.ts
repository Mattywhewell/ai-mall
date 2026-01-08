import { WooCommerceAdapter } from '@/lib/channel-adapters/woocommerce';

const originalFetch = global.fetch;

afterEach(() => {
  (global as any).fetch = originalFetch;
});

test('WooCommerceAdapter.fetchProducts pagination', async () => {
  let called = 0;
  (global as any).fetch = vi.fn().mockImplementation(async (url: string) => {
    called++;
    if (called === 1) return { ok: true, json: async () => new Array(100).fill(0).map((_, i) => ({ id: `P-${i}` })) };
    if (called === 2) return { ok: true, json: async () => new Array(10).fill(0).map((_, i) => ({ id: `P-${100 + i}` })) };
    return { ok: true, json: async () => [] };
  });

  const adapter = new WooCommerceAdapter({ consumerKey: 'CK', consumerSecret: 'CS', storeUrl: 'https://example.com' });
  const products = await adapter.fetchProducts();
  expect(products.length).toBe(110);
});

test('WooCommerceAdapter.fetchOrders retries on failure', async () => {
  let called = 0;
  (global as any).fetch = vi.fn().mockImplementation(async () => {
    called++;
    if (called < 3) return { ok: false, status: 500, text: async () => 'server error' };
    return { ok: true, json: async () => [] };
  });

  const adapter = new WooCommerceAdapter({ consumerKey: 'CK', consumerSecret: 'CS', storeUrl: 'https://example.com' });
  const orders = await adapter.fetchOrders();
  expect(Array.isArray(orders)).toBe(true);
  expect(called).toBeGreaterThanOrEqual(3);
});