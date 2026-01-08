import { describe, test, expect, vi } from 'vitest';
import { OpenCartAdapter } from '@/lib/channel-adapters/opencart';

describe('OpenCartAdapter', () => {
  test('fetchProducts returns products', async () => {
    const adapter = new OpenCartAdapter({
      storeUrl: 'https://opencart.example.com',
      apiKey: 'fake-api-key',
      username: 'admin',
      password: 'password'
    });

    (global as any).fetch = vi.fn()
      .mockImplementationOnce(() => // Login call
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            token: 'fake-session-token'
          })
        })
      )
      .mockImplementationOnce(() => // Products call
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            products: [{
              product_id: '12345',
              name: 'OpenCart Product',
              description: 'Great product from OpenCart',
              price: '79.99',
              special: '69.99',
              currency: 'USD',
              sku: 'OC-SKU',
              images: [{ image: 'https://opencart.com/image.jpg' }],
              quantity: 25,
              category: 'Fashion',
              manufacturer: 'OpenCartBrand'
            }]
          })
        })
      );

    const products = await adapter.fetchProducts();
    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      id: '12345',
      name: 'OpenCart Product',
      price: 79.99,
      currency: 'USD',
      sku: 'OC-SKU'
    });
  });

  test('fetchOrders returns orders', async () => {
    const adapter = new OpenCartAdapter({
      storeUrl: 'https://opencart.example.com',
      apiKey: 'fake-api-key',
      username: 'admin',
      password: 'password'
    });

    (global as any).fetch = vi.fn()
      .mockImplementationOnce(() => // Login call
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            token: 'fake-session-token'
          })
        })
      )
      .mockImplementationOnce(() => // Orders call
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            orders: [{
              order_id: '67890',
              status: 'Complete',
              total: '79.99',
              currency_code: 'USD',
              date_added: '2024-01-01T10:00:00Z',
              date_modified: '2024-01-02T10:00:00Z',
              email: 'customer@opencart.com',
              shipping_address: {
                firstname: 'Bob',
                lastname: 'Wilson',
                address_1: '789 Cart St',
                address_2: '',
                city: 'London',
                zone: 'London',
                postcode: 'SW1A 1AA',
                country: 'United Kingdom'
              },
              products: [{
                product_id: '12345',
                quantity: 1,
                price: '79.99',
                sku: 'OC-SKU',
                name: 'OpenCart Product'
              }]
            }]
          })
        })
      );

    const orders = await adapter.fetchOrders();
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({
      id: '67890',
      status: 'Complete',
      total: 79.99,
      currency: 'USD'
    });
  });

  test('OpenCartAdapter requires storeUrl, username, password and apiKey', () => {
    expect(() => new OpenCartAdapter({ storeUrl: 'url', username: 'user', password: 'pass' })).toThrow('OpenCartAdapter requires an apiKey');
    expect(() => new OpenCartAdapter({ apiKey: 'key', username: 'user', password: 'pass' })).toThrow('OpenCartAdapter requires a storeUrl');
    expect(() => new OpenCartAdapter({ apiKey: 'key', storeUrl: 'url', password: 'pass' })).toThrow('OpenCartAdapter requires a username');
    expect(() => new OpenCartAdapter({ apiKey: 'key', storeUrl: 'url', username: 'user' })).toThrow('OpenCartAdapter requires a password');
  });
});