import { MagentoAdapter } from '@/lib/channel-adapters/magento';

const originalFetch = global.fetch;

afterEach(() => {
  (global as any).fetch = originalFetch;
});

test('MagentoAdapter.fetchProducts returns products', async () => {
  const adapter = new MagentoAdapter({
    consumerKey: 'consumer-key',
    consumerSecret: 'consumer-secret',
    accessToken: 'access-token',
    accessTokenSecret: 'access-secret',
    storeUrl: 'https://magento.store'
  });

  (global as any).fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        items: [{
          id: 123,
          name: 'Magento Product',
          description: 'Premium product',
          price: '39.99',
          sku: 'MAGENTO-SKU',
          url_key: 'magento-product',
          media_gallery_entries: [{ file: '/m/a/magento-image.jpg' }],
          extension_attributes: {
            stock_item: { qty: 15 }
          },
          category_ids: [1, 2],
          manufacturer: 'MagentoBrand'
        }]
      })
    })
  );

  const products = await adapter.fetchProducts();
  expect(products).toHaveLength(1);
  expect(products[0]).toMatchObject({
    id: '123',
    name: 'Magento Product',
    price: 39.99,
    currency: 'USD',
    sku: 'MAGENTO-SKU'
  });
});

test('MagentoAdapter.fetchOrders returns orders', async () => {
  const adapter = new MagentoAdapter({
    consumerKey: 'consumer-key',
    consumerSecret: 'consumer-secret',
    accessToken: 'access-token',
    accessTokenSecret: 'access-secret',
    storeUrl: 'https://magento.store'
  });

  (global as any).fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        items: [{
          increment_id: '000000123',
          status: 'processing',
          grand_total: '79.98',
          order_currency_code: 'USD',
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-02T10:00:00Z',
          customer_email: 'customer@magento.com',
          extension_attributes: {
            shipping_assignments: [{
              shipping: {
                address: {
                  firstname: 'John',
                  lastname: 'Doe',
                  street: ['123 Magento St'],
                  city: 'Magento City',
                  region: 'CA',
                  postcode: '90210',
                  country_id: 'US'
                }
              }
            }]
          },
          items: [{
            product_id: 123,
            qty_ordered: 2,
            price: '39.99',
            sku: 'MAGENTO-SKU',
            name: 'Magento Product'
          }]
        }]
      })
    })
  );

  const orders = await adapter.fetchOrders();
  expect(orders).toHaveLength(1);
  expect(orders[0]).toMatchObject({
    id: '000000123',
    status: 'processing',
    total: 79.98,
    currency: 'USD'
  });
});

test('MagentoAdapter requires all credentials', () => {
  expect(() => new MagentoAdapter({ consumerKey: 'key', storeUrl: 'url' })).toThrow('MagentoAdapter requires consumerKey and consumerSecret');
});