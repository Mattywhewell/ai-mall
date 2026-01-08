import { describe, test, expect, vi } from 'vitest';
import { LazadaAdapter } from '@/lib/channel-adapters/lazada';

describe('LazadaAdapter', () => {
  test('fetchProducts returns products', async () => {
    const adapter = new LazadaAdapter({
      appKey: 'fake-key',
      appSecret: 'fake-secret',
      accessToken: 'fake-token'
    });

    (global as any).fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          data: {
            products: [{
              item_id: 123,
              attributes: {
                name: 'Lazada Product',
                short_description: 'Quality product',
                price: '29.99',
                original_price: '39.99'
              },
              skus: [{
                sku_id: 456,
                SellerSku: 'LZ-SKU',
                price: '29.99',
                quantity: 30,
                Images: ['https://lazada.com/image.jpg']
              }],
              category_id: 789,
              brand: 'LazadaBrand'
            }]
          }
        })
      })
    );

    const products = await adapter.fetchProducts();
    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      id: '123',
      name: 'Lazada Product',
      price: 29.99,
      currency: 'USD',
      sku: 'LZ-SKU'
    });
  });

  test('fetchOrders returns orders', async () => {
    const adapter = new LazadaAdapter({
      appKey: 'fake-key',
      appSecret: 'fake-secret',
      accessToken: 'fake-token'
    });

    (global as any).fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          data: {
            orders: [{
              order_id: 789,
              statuses: ['ready_to_ship'],
              price: '59.98',
              created_at: '2024-01-01T10:00:00+08:00',
              updated_at: '2024-01-02T10:00:00+08:00',
              customer_email: 'buyer@lazada.com',
              address_billing: {
                first_name: 'Jane',
                last_name: 'Doe',
                address1: '123 Orchard Road',
                address2: '',
                city: 'Singapore',
                postcode: '238823',
                country: 'Singapore'
              },
              order_items: [{
                order_item_id: 101,
                sku: 'LZ-SKU',
                name: 'Lazada Product',
                item_price: '29.99',
                quantity: 2
              }]
            }]
          }
        })
      })
    );

    const orders = await adapter.fetchOrders();
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({
      id: '789',
      status: 'ready_to_ship',
      total: 59.98,
      currency: 'USD'
    });
  });

  test('LazadaAdapter requires appKey, appSecret and accessToken', () => {
    expect(() => new LazadaAdapter({ appKey: 'key', appSecret: 'secret' })).toThrow('LazadaAdapter requires an accessToken');
    expect(() => new LazadaAdapter({ appKey: 'key', accessToken: 'token' })).toThrow('LazadaAdapter requires an appSecret');
    expect(() => new LazadaAdapter({ appSecret: 'secret', accessToken: 'token' })).toThrow('LazadaAdapter requires an appKey');
  });
});