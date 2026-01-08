import { OnBuyAdapter } from '@/lib/channel-adapters/onbuy';

const originalFetch = global.fetch;

afterEach(() => {
  (global as any).fetch = originalFetch;
});

test('OnBuyAdapter.fetchProducts returns products', async () => {
  const adapter = new OnBuyAdapter({ apiKey: 'fake-key', siteId: '2000' });

  // Mock fetch
  (global as any).fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        results: [{
          product_id: 123,
          name: 'Test Product',
          description: 'Test description',
          price: { current_price: '29.99', currency: 'GBP' },
          sku: 'TEST-SKU',
          images: [{ url: 'https://example.com/image.jpg' }],
          product_url: 'https://example.com/product/123',
          stock: { quantity: 10 },
          category: { name: 'Test Category' },
          brand: { name: 'Test Brand' },
          variations: [{
            variation_id: 456,
            name: 'Size M',
            price: { current_price: '29.99' },
            sku: 'TEST-SKU-M',
            stock: { quantity: 5 }
          }]
        }]
      })
    })
  );

  const products = await adapter.fetchProducts();
  expect(products).toHaveLength(1);
  expect(products[0]).toMatchObject({
    id: '123',
    name: 'Test Product',
    price: 29.99,
    currency: 'GBP',
    sku: 'TEST-SKU'
  });
});

test('OnBuyAdapter.fetchOrders returns orders', async () => {
  const adapter = new OnBuyAdapter({ apiKey: 'fake-key' });

  (global as any).fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        results: [{
          order_id: 789,
          status: 'processing',
          total: '59.98',
          currency: 'GBP',
          date_added: '2024-01-01T10:00:00Z',
          customer: { email: 'test@example.com' },
          delivery_address: {
            address_line_1: '123 Test St',
            town_city: 'Test City',
            county: 'Test County',
            postcode: 'TE1 2ST',
            country: 'GB'
          },
          order_items: [{
            product_id: 123,
            quantity: 2,
            price: '29.99',
            sku: 'TEST-SKU'
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
    total: 59.98,
    currency: 'GBP',
    customer_email: 'test@example.com'
  });
});

test('OnBuyAdapter requires apiKey', () => {
  expect(() => new OnBuyAdapter({})).toThrow('OnBuyAdapter requires an apiKey');
});