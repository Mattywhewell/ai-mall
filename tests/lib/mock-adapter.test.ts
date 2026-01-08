import { MockAdapter } from '@/lib/channel-adapters/mock';

test('MockAdapter returns products and orders', async () => {
  const adapter = new MockAdapter({ storeName: 'Test Store' });
  const products = await adapter.fetchProducts();
  const orders = await adapter.fetchOrders();

  expect(Array.isArray(products)).toBe(true);
  expect(products.length).toBeGreaterThan(0);
  expect(products[0].sku).toBeDefined();

  expect(Array.isArray(orders)).toBe(true);
  expect(orders.length).toBeGreaterThan(0);
  expect(orders[0].order_number).toBeDefined();
});
