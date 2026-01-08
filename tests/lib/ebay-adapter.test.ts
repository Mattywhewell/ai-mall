import { EbayAdapter } from '@/lib/channel-adapters/ebay';

// Mock global fetch
const originalFetch = global.fetch;

afterEach(() => {
  (global as any).fetch = originalFetch;
});

test('EbayAdapter.fetchProducts returns items', async () => {
  const fakeResp = { inventoryItems: [{ sku: 'EB-1', product: { title: 'EB Product 1' } }] };
  (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => fakeResp });

  const adapter = new EbayAdapter({ accessToken: 'fake-token', marketplaceId: 'EBAY_US' });
  const products = await adapter.fetchProducts();
  expect(products).toEqual(fakeResp.inventoryItems);
});

test('EbayAdapter.fetchOrders returns orders', async () => {
  const fakeResp = { orders: [{ orderId: 'O-1', total: 12.3 }] };
  (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => fakeResp });

  const adapter = new EbayAdapter({ accessToken: 'fake-token' });
  const orders = await adapter.fetchOrders();
  expect(orders).toEqual(fakeResp.orders);
});