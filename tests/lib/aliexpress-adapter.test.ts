import { describe, test, expect, vi } from 'vitest';
import { AliExpressAdapter } from '@/lib/channel-adapters/aliexpress';

describe('AliExpressAdapter', () => {
  test('fetchProducts returns products', async () => {
    const adapter = new AliExpressAdapter({
      appKey: 'fake-key',
      appSecret: 'fake-secret',
      accessToken: 'fake-token'
    });

    (global as any).fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          result: {
            products: [{
              product_id: 123,
              subject: 'AliExpress Product',
              detail: 'Quality product from China',
              price: { amount: '19.99', currency: 'USD' },
              sku_code: 'AE-SKU',
              product_url: 'https://aliexpress.com/item/123',
              image_url: 'https://ae.com/image.jpg',
              quantity: 50,
              category_name: 'Electronics',
              brand_name: 'AliExpressBrand',
              sku_list: [{
                sku_id: 456,
                property_value_definition_name: 'Color: Red',
                price: { amount: '19.99', currency: 'USD' },
                sku_code: 'AE-SKU-RED',
                quantity: 25
              }]
            }]
          }
        })
      })
    );

    const products = await adapter.fetchProducts();
    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      id: '123',
      name: 'AliExpress Product',
      price: 19.99,
      currency: 'USD',
      sku: 'AE-SKU'
    });
  });

  test('fetchOrders returns orders', async () => {
    const adapter = new AliExpressAdapter({
      appKey: 'fake-key',
      appSecret: 'fake-secret',
      accessToken: 'fake-token'
    });

    (global as any).fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          result: {
            orders: [{
              order_id: 789,
              order_status: 'PAYMENT_COMPLETED',
              total_amount: { amount: '39.98', currency: 'USD' },
              gmt_create: '2024-01-01T10:00:00Z',
              gmt_modified: '2024-01-02T10:00:00Z',
              buyer_info: { email: 'buyer@ae.com' },
              delivery_address: {
                contact_person: 'Jane Doe',
                address_line1: '123 Main St',
                address_line2: '',
                city: 'Los Angeles',
                province: 'California',
                postal_code: '90001',
                country: 'United States'
              },
              product_list: [{
                product_id: 123,
                quantity: 2,
                unit_price: { amount: '19.99', currency: 'USD' },
                sku_code: 'AE-SKU',
                subject: 'AliExpress Product'
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
      status: 'PAYMENT_COMPLETED',
      total: 39.98,
      currency: 'USD'
    });
  });

  test('AliExpressAdapter requires appKey, appSecret and accessToken', () => {
    expect(() => new AliExpressAdapter({ appKey: 'key', appSecret: 'secret' })).toThrow('AliExpressAdapter requires an accessToken');
    expect(() => new AliExpressAdapter({ appKey: 'key', accessToken: 'token' })).toThrow('AliExpressAdapter requires an appSecret');
    expect(() => new AliExpressAdapter({ appSecret: 'secret', accessToken: 'token' })).toThrow('AliExpressAdapter requires an appKey');
  });
});