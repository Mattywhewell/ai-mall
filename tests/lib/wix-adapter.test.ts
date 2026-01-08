import { WixAdapter } from '@/lib/channel-adapters/wix';

const originalFetch = global.fetch;

afterEach(() => {
  (global as any).fetch = originalFetch;
});

test('WixAdapter.fetchProducts returns products', async () => {
  const adapter = new WixAdapter({ apiKey: 'fake-key', siteId: 'site123' });

  (global as any).fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        products: [{
          id: 'prod123',
          name: 'Wix Product',
          description: 'Premium product',
          price: { price: '34.99', currency: 'USD' },
          sku: 'WIX-SKU',
          media: { mainMedia: { image: { url: 'https://wix.com/image.jpg' } } },
          productPageUrl: { base: 'https://store.wix.com/product/prod123' },
          stock: { quantity: 20 },
          collectionIds: ['col456'],
          brand: 'WixBrand',
          variants: [{
            id: 'var789',
            choices: [{ description: 'Size: XL' }],
            price: { price: '34.99' },
            sku: 'WIX-SKU-XL',
            stock: { quantity: 10 }
          }]
        }]
      })
    })
  );

  const products = await adapter.fetchProducts();
  expect(products).toHaveLength(1);
  expect(products[0]).toMatchObject({
    id: 'prod123',
    name: 'Wix Product',
    price: 34.99,
    currency: 'USD',
    sku: 'WIX-SKU'
  });
});

test('WixAdapter.fetchOrders returns orders', async () => {
  const adapter = new WixAdapter({ apiKey: 'fake-key', siteId: 'site123' });

  (global as any).fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        orders: [{
          id: 'ord456',
          status: 'APPROVED',
          priceSummary: { totalPrice: { amount: '69.98', currency: 'USD' } },
          createdDate: '2024-01-01T10:00:00Z',
          updatedDate: '2024-01-02T10:00:00Z',
          buyerInfo: { email: 'buyer@wix.com' },
          shippingInfo: {
            shippingDestination: {
              address: {
                addressLine1: '789 Wix Ave',
                city: 'Wix City',
                subdivision: 'CA',
                postalCode: '90401',
                country: 'US'
              }
            }
          },
          lineItems: [{
            productId: 'prod123',
            quantity: 2,
            price: { amount: '34.99' },
            sku: 'WIX-SKU'
          }]
        }]
      })
    })
  );

  const orders = await adapter.fetchOrders();
  expect(orders).toHaveLength(1);
  expect(orders[0]).toMatchObject({
    id: 'ord456',
    status: 'APPROVED',
    total: 69.98,
    currency: 'USD',
    customer_email: 'buyer@wix.com'
  });
});

test('WixAdapter requires apiKey and siteId', () => {
  expect(() => new WixAdapter({ apiKey: 'key' })).toThrow('WixAdapter requires a siteId');
  expect(() => new WixAdapter({ siteId: 'site' })).toThrow('WixAdapter requires an apiKey');
});