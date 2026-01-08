import { describe, test, expect, vi } from 'vitest';
import { OzonAdapter } from '@/lib/channel-adapters/ozon';

describe('OzonAdapter', () => {
  test('fetchProducts returns products', async () => {
    const adapter = new OzonAdapter({
      clientId: 'fake-client-id',
      apiKey: 'fake-api-key'
    });

    (global as any).fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          result: {
            items: [{
              product_id: 12345,
              name: 'Ozon Product',
              description: 'Great product from Ozon',
              price: '1499.00',
              old_price: '1999.00',
              currency_code: 'RUB',
              sku: 'OZ-SKU',
              images: ['https://ozon.ru/image.jpg'],
              stocks: { present: 75, reserved: 0 },
              category_id: 123,
              category_name: 'Electronics',
              seller_id: 67890,
              seller_name: 'OzonSeller'
            }]
          }
        })
      })
    );

    const products = await adapter.fetchProducts();
    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      id: '12345',
      name: 'Ozon Product',
      price: 1499.00,
      currency: 'RUB',
      sku: 'OZ-SKU'
    });
  });

  test('fetchOrders returns orders', async () => {
    const adapter = new OzonAdapter({
      clientId: 'fake-client-id',
      apiKey: 'fake-api-key'
    });

    (global as any).fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          result: {
            postings: [{
              posting_number: '67890',
              status: 'delivered',
              analytics_data: { revenue: '1499.00' },
              created_at: '2024-01-01T10:00:00Z',
              updated_at: '2024-01-02T10:00:00Z',
              products: [{
                sku: 12345,
                quantity: 1,
                price: '1499.00',
                name: 'Ozon Product'
              }]
            }]
          }
        })
      })
    );

    const orders = await adapter.fetchOrders();
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({
      id: '67890',
      status: 'delivered',
      total: 1499.00,
      currency: 'RUB'
    });
  });

  test('OzonAdapter requires clientId and apiKey', () => {
    expect(() => new OzonAdapter({ clientId: 'client' })).toThrow('OzonAdapter requires an apiKey');
    expect(() => new OzonAdapter({ apiKey: 'key' })).toThrow('OzonAdapter requires a clientId');
  });
});