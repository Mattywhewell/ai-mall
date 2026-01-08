import { EbayAdapter } from '@/lib/channel-adapters/ebay';

const originalFetch = global.fetch;

afterEach(() => {
  (global as any).fetch = originalFetch;
});

test('EbayAdapter pagination collects multiple pages', async () => {
  (global as any).fetch = jest.fn().mockImplementation(async (url: string) => {
    const u = new URL(String(url));
    const offset = parseInt(u.searchParams.get('offset') || '0', 10);
    if (offset === 0) return { ok: true, json: async () => ({ inventoryItems: new Array(50).fill(0).map((_, i) => ({ sku: `E-${i}` })) }) };
    if (offset === 50) return { ok: true, json: async () => ({ inventoryItems: new Array(10).fill(0).map((_, i) => ({ sku: `E-${50 + i}` })) }) };
    return { ok: true, json: async () => ({ inventoryItems: [] }) };
  });

  const adapter = new EbayAdapter({ accessToken: 'fake', marketplaceId: 'EBAY_US' });
  const products = await adapter.fetchProducts();
  expect(products.length).toBe(60);
});

test('EbayAdapter retries on transient failure', async () => {
  let called = 0;
  (global as any).fetch = jest.fn().mockImplementation(async () => {
    called++;
    if (called < 2) return Promise.reject(new Error('network error'));
    return { ok: true, json: async () => ({ inventoryItems: [{ sku: 'E-1' }] }) };
  });

  const adapter = new EbayAdapter({ accessToken: 'fake' });
  const products = await adapter.fetchProducts();
  expect(products.length).toBeGreaterThan(0);
  expect(called).toBeGreaterThanOrEqual(2);
});