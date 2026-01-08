import { BigCommerceAdapter } from '@/lib/channel-adapters/bigcommerce';

const originalFetch = global.fetch;

afterEach(() => {
  (global as any).fetch = originalFetch;
});

test('BigCommerceAdapter.fetchProducts pagination', async () => {
  let called = 0;
  (global as any).fetch = vi.fn().mockImplementation(async (url: string) => {
    called++;
    if (called === 1) return { ok: true, json: async () => ({ data: new Array(50).fill(0).map((_, i) => ({ id: `P-${i}` })) }) };
    if (called === 2) return { ok: true, json: async () => ({ data: new Array(2).fill(0).map((_, i) => ({ id: `P-${50 + i}` })) }) };
    return { ok: true, json: async () => ({ data: [] }) };
  });

  const adapter = new BigCommerceAdapter({ accessToken: 'AT', storeHash: 'store123' });
  const products = await adapter.fetchProducts();
  expect(products.length).toBe(52);
});

test('BigCommerceAdapter.fetchOrders pagination', async () => {
  let called = 0;
  (global as any).fetch = jest.fn().mockImplementation(async (url: string) => {
    called++;
    if (called === 1) return { ok: true, json: async () => new Array(50).fill(0).map((_, i) => ({ id: `O-${i}` })) };
    if (called === 2) return { ok: true, json: async () => new Array(1).fill(0).map((_, i) => ({ id: `O-${50 + i}` })) };
    return { ok: true, json: async () => [] };
  });

  const adapter = new BigCommerceAdapter({ accessToken: 'AT', storeHash: 'store123' });
  const orders = await adapter.fetchOrders();
  expect(orders.length).toBe(51);
});