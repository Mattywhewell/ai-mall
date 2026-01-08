import { EKMAdapter } from '@/lib/channel-adapters/ekm';

const originalFetch = global.fetch;

afterEach(() => {
  (global as any).fetch = originalFetch;
});

test('EKMAdapter.fetchProducts returns products', async () => {
  const adapter = new EKMAdapter({ apiKey: 'fake-key', storeUrl: 'https://store.ekm.com' });

  (global as any).fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        products: [{
          id: 123,
          title: 'EKM Product',
          description: 'Great product',
          price: '24.99',
          currency: 'GBP',
          sku: 'EKM-SKU',
          images: [{ url: 'https://ekm.com/image.jpg' }],
          url: 'https://store.ekm.com/product/123',
          stock_level: 15,
          category: { name: 'Home & Garden' },
          brand: { name: 'EKM Brand' },
          variants: [{
            id: 456,
            name: 'Color: Blue',
            price: '24.99',
            sku: 'EKM-SKU-BLUE',
            stock_level: 8
          }]
        }]
      })
    })
  );

  const products = await adapter.fetchProducts();
  expect(products).toHaveLength(1);
  expect(products[0]).toMatchObject({
    id: '123',
    name: 'EKM Product',
    price: 24.99,
    currency: 'GBP',
    sku: 'EKM-SKU'
  });
});

test('EKMAdapter.fetchOrders returns orders', async () => {
  const adapter = new EKMAdapter({ apiKey: 'fake-key', storeUrl: 'https://store.ekm.com' });

  (global as any).fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        orders: [{
          id: 789,
          status: 'processing',
          total: '49.98',
          currency: 'GBP',
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-02T10:00:00Z',
          customer: { email: 'customer@ekm.com' },
          shipping_address: {
            line1: '456 EKM St',
            city: 'EKM City',
            county: 'EKM County',
            postcode: 'EK1 2MP',
            country: 'GB'
          },
          items: [{
            product_id: 123,
            quantity: 2,
            price: '24.99',
            sku: 'EKM-SKU'
          }]
        }]
      })
    })
  );

  const orders = await adapter.fetchOrders();
  expect(orders).toHaveLength(1);
  expect(orders[0]).toMatchObject({
    id: '789',
    status: 'processing',
    total: 49.98,
    currency: 'GBP',
    customer_email: 'customer@ekm.com'
  });
});

test('EKMAdapter requires apiKey and storeUrl', () => {
  expect(() => new EKMAdapter({ apiKey: 'key' })).toThrow('EKMAdapter requires a storeUrl');
  expect(() => new EKMAdapter({ storeUrl: 'url' })).toThrow('EKMAdapter requires an apiKey');
});