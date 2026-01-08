import { WishAdapter } from '@/lib/channel-adapters/wish';

const originalFetch = global.fetch;

afterEach(() => {
  (global as any).fetch = originalFetch;
});

test('WishAdapter.fetchProducts returns products', async () => {
  const adapter = new WishAdapter({ accessToken: 'fake-token' });

  (global as any).fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        data: [{
          Product: {
            id: 'prod123',
            name: 'Wish Product',
            description: 'Amazing product',
            price: '19.99',
            currency_code: 'USD',
            parent_sku: 'WISH-SKU',
            main_image: 'https://wish.com/image.jpg',
            number_sold: 100,
            tags: ['Electronics'],
            brand: 'WishBrand',
            variants: [{
              variant_id: 'var456',
              size: 'L',
              price: '19.99',
              sku: 'WISH-SKU-L',
              quantity: 50
            }]
          }
        }]
      })
    })
  );

  const products = await adapter.fetchProducts();
  expect(products).toHaveLength(1);
  expect(products[0]).toMatchObject({
    id: 'prod123',
    name: 'Wish Product',
    price: 19.99,
    currency: 'USD',
    sku: 'WISH-SKU'
  });
});

test('WishAdapter.fetchOrders returns orders', async () => {
  const adapter = new WishAdapter({ accessToken: 'fake-token' });

  (global as any).fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        data: [{
          Order: {
            order_id: 'ord789',
            state: 'APPROVED',
            price: '39.98',
            currency_code: 'USD',
            order_time: '2024-01-01T10:00:00Z',
            last_updated: '2024-01-02T10:00:00Z',
            shipping_detail: {
              street_address1: '123 Wish St',
              city: 'Wish City',
              state: 'CA',
              zipcode: '90210',
              country: 'US'
            },
            OrderItem: [{
              product_id: 'prod123',
              quantity: 2,
              price: '19.99',
              product_variant: { sku: 'WISH-SKU-L' }
            }]
          }
        }]
      })
    })
  );

  const orders = await adapter.fetchOrders();
  expect(orders).toHaveLength(1);
  expect(orders[0]).toMatchObject({
    id: 'ord789',
    status: 'APPROVED',
    total: 39.98,
    currency: 'USD'
  });
});

test('WishAdapter requires accessToken', () => {
  expect(() => new WishAdapter({})).toThrow('WishAdapter requires an accessToken');
});