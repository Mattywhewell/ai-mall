import { TikTokAdapter } from '@/lib/channel-adapters/tiktok';

const originalFetch = global.fetch;

afterEach(() => {
  (global as any).fetch = originalFetch;
});

test('TikTokAdapter.fetchProducts returns products', async () => {
  const fakeResp = { data: { products: [{ id: 'P-1', name: 'T Product' }] } };
  (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => fakeResp });

  const adapter = new TikTokAdapter({ accessToken: 'fake-token', shopId: 'shop-123' });
  const products = await adapter.fetchProducts();
  expect(products).toEqual(fakeResp.data.products);
});

test('TikTokAdapter.fetchOrders returns orders', async () => {
  const fakeResp = { data: { orders: [{ id: 'O-1', total: 45.5 }] } };
  (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => fakeResp });

  const adapter = new TikTokAdapter({ accessToken: 'fake-token' });
  const orders = await adapter.fetchOrders();
  expect(orders).toEqual(fakeResp.data.orders);
});