import { Magento2Adapter } from '@/lib/channel-adapters/magento2';

const originalFetch = global.fetch;

afterEach(() => {
  (global as any).fetch = originalFetch;
});

test('Magento2Adapter.fetchProducts returns products', async () => {
  const adapter = new Magento2Adapter({
    consumerKey: 'consumer-key',
    consumerSecret: 'consumer-secret',
    accessToken: 'access-token',
    accessTokenSecret: 'access-secret',
    storeUrl: 'https://magento2.store'
  });

  (global as any).fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        items: [{
          id: 123,
          name: 'Magento 2 Product',
          description: [{ html: 'Premium product description' }],
          price: 44.99,
          currency: 'USD',
          sku: 'MAGENTO2-SKU',
          custom_attributes: [
            { attribute_code: 'url_key', value: 'magento2-product' },
            { attribute_code: 'manufacturer', value: 'Magento2Brand' }
          ],
          media_gallery_entries: [{ file: '/m/a/magento2-image.jpg' }],
          extension_attributes: {
            stock_item: { qty: 20 }
          },
          category_ids: [1, 2],
          configurable_product_options: [{
            id: 456,
            label: 'Size',
            values: [{ value_index: 1 }]
          }]
        }]
      })
    })
  );

  const products = await adapter.fetchProducts();
  expect(products).toHaveLength(1);
  expect(products[0]).toMatchObject({
    id: '123',
    name: 'Magento 2 Product',
    price: 44.99,
    currency: 'USD',
    sku: 'MAGENTO2-SKU'
  });
});

test('Magento2Adapter.fetchOrders returns orders', async () => {
  const adapter = new Magento2Adapter({
    consumerKey: 'consumer-key',
    consumerSecret: 'consumer-secret',
    accessToken: 'access-token',
    accessTokenSecret: 'access-secret',
    storeUrl: 'https://magento2.store'
  });

  (global as any).fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        items: [{
          increment_id: '000000456',
          status: 'pending',
          grand_total: '89.98',
          order_currency_code: 'USD',
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-02T10:00:00Z',
          customer_email: 'customer@magento2.com',
          extension_attributes: {
            shipping_assignments: [{
              shipping: {
                address: {
                  firstname: 'Jane',
                  lastname: 'Smith',
                  street: ['456 Magento2 Ave', 'Suite 200'],
                  city: 'Magento2 City',
                  region: { region: 'NY' },
                  postcode: '10001',
                  country_id: 'US'
                }
              }
            }]
          },
          items: [{
            product_id: 123,
            qty_ordered: 2,
            price: '44.99',
            sku: 'MAGENTO2-SKU',
            name: 'Magento 2 Product'
          }]
        }]
      })
    })
  );

  const orders = await adapter.fetchOrders();
  expect(orders).toHaveLength(1);
  expect(orders[0]).toMatchObject({
    id: '000000456',
    status: 'pending',
    total: 89.98,
    currency: 'USD'
  });
});

test('Magento2Adapter requires all credentials', () => {
  expect(() => new Magento2Adapter({ consumerKey: 'key', storeUrl: 'url' })).toThrow('Magento2Adapter requires consumerKey and consumerSecret');
});