import { FacebookShopsAdapter } from '@/lib/channel-adapters/facebook-shops';

const originalFetch = global.fetch;

afterEach(() => {
  (global as any).fetch = originalFetch;
});

test('FacebookShopsAdapter.fetchProducts returns products', async () => {
  const adapter = new FacebookShopsAdapter({ accessToken: 'fake-token', catalogId: 'catalog123' });

  (global as any).fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        data: [{
          id: 'prod123',
          name: 'Facebook Product',
          description: 'Great product',
          price: { amount: '29.99', currency: 'USD' },
          availability: 'in stock',
          retailer_product_group_id: 'FB-SKU',
          image_url: 'https://facebook.com/image.jpg',
          url: 'https://facebook.com/product/123',
          category: 'Electronics',
          brand: 'FacebookBrand',
          variants: [{
            id: 'var456',
            name: 'Color: Blue',
            price: { amount: '29.99', currency: 'USD' },
            retailer_product_group_id: 'FB-SKU-BLUE',
            availability: 'in stock'
          }]
        }]
      })
    })
  );

  const products = await adapter.fetchProducts();
  expect(products).toHaveLength(1);
  expect(products[0]).toMatchObject({
    id: 'prod123',
    name: 'Facebook Product',
    price: 29.99,
    currency: 'USD',
    sku: 'FB-SKU'
  });
});

test('FacebookShopsAdapter.fetchOrders returns orders', async () => {
  const adapter = new FacebookShopsAdapter({ accessToken: 'fake-token', catalogId: 'catalog123' });

  (global as any).fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        data: [{
          id: 'ord789',
          status: 'completed',
          total_amount: { amount: '59.98', currency: 'USD' },
          created_date: '2024-01-01T10:00:00Z',
          last_modified_date: '2024-01-02T10:00:00Z',
          customer_email: 'buyer@facebook.com',
          shipping_address: {
            first_name: 'Jane',
            last_name: 'Doe',
            address_line_1: '456 Facebook Ave',
            address_line_2: '',
            city: 'Facebook City',
            state: 'CA',
            postal_code: '90401',
            country: 'US'
          },
          line_items: [{
            product_id: 'prod123',
            quantity: 2,
            unit_price: { amount: '29.99', currency: 'USD' },
            retailer_id: 'FB-SKU',
            product_name: 'Facebook Product'
          }]
        }]
      })
    })
  );

  const orders = await adapter.fetchOrders();
  expect(orders).toHaveLength(1);
  expect(orders[0]).toMatchObject({
    id: 'ord789',
    status: 'completed',
    total: 59.98,
    currency: 'USD'
  });
});

test('FacebookShopsAdapter requires accessToken and catalogId', () => {
  expect(() => new FacebookShopsAdapter({ accessToken: 'token' })).toThrow('FacebookShopsAdapter requires a catalogId');
  expect(() => new FacebookShopsAdapter({ catalogId: 'catalog' })).toThrow('FacebookShopsAdapter requires an accessToken');
});