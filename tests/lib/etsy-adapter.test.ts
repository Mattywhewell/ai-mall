import { EtsyAdapter } from '@/lib/channel-adapters/etsy';

const originalFetch = global.fetch;

afterEach(() => {
  (global as any).fetch = originalFetch;
});

test('EtsyAdapter.fetchProducts returns products', async () => {
  const adapter = new EtsyAdapter({ apiKey: 'fake-key', shopId: 'shop123' });

  (global as any).fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        results: [{
          listing_id: 123,
          title: 'Etsy Product',
          description: 'Handmade item',
          price: { amount: '2599', divisor: 100, currency_code: 'USD' },
          sku: ['ETSY-SKU'],
          url: 'https://etsy.com/listing/123',
          images: [{ url_570xN: 'https://etsy.com/image.jpg' }],
          quantity: 10,
          tags: ['handmade'],
          user_id: 'seller123',
          variations: [{
            property_id: 456,
            formatted_name: 'Size: Large',
            price: { amount: '2599', divisor: 100 },
            sku: 'ETSY-SKU-L',
            quantity: 5
          }]
        }]
      })
    })
  );

  const products = await adapter.fetchProducts();
  expect(products).toHaveLength(1);
  expect(products[0]).toMatchObject({
    id: '123',
    name: 'Etsy Product',
    price: 25.99,
    currency: 'USD',
    sku: 'ETSY-SKU'
  });
});

test('EtsyAdapter.fetchOrders returns orders', async () => {
  const adapter = new EtsyAdapter({ apiKey: 'fake-key', shopId: 'shop123' });

  (global as any).fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        results: [{
          receipt_id: 789,
          status: 'paid',
          grandtotal: { amount: '5198', divisor: 100, currency_code: 'USD' },
          created_timestamp: '2024-01-01T10:00:00Z',
          updated_timestamp: '2024-01-02T10:00:00Z',
          buyer_email: 'buyer@etsy.com',
          name: 'John Doe',
          first_line: '123 Etsy St',
          second_line: '',
          city: 'Etsy City',
          state: 'CA',
          zip: '90210',
          country_iso: 'US',
          transactions: [{
            listing_id: 123,
            quantity: 2,
            price: { amount: '2599', divisor: 100 },
            sku: 'ETSY-SKU',
            title: 'Etsy Product'
          }]
        }]
      })
    })
  );

  const orders = await adapter.fetchOrders();
  expect(orders).toHaveLength(1);
  expect(orders[0]).toMatchObject({
    id: '789',
    status: 'paid',
    total: 51.98,
    currency: 'USD'
  });
});

test('EtsyAdapter requires apiKey and shopId', () => {
  expect(() => new EtsyAdapter({ apiKey: 'key' })).toThrow('EtsyAdapter requires a shopId');
  expect(() => new EtsyAdapter({ shopId: 'shop' })).toThrow('EtsyAdapter requires an apiKey');
});