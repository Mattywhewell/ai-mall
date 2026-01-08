import { describe, test, expect, vi } from 'vitest';
import { ZenCartAdapter } from '@/lib/channel-adapters/zencart';

describe('ZenCartAdapter', () => {
  test('fetchProducts returns products', async () => {
    const adapter = new ZenCartAdapter({
      storeUrl: 'https://zencart.example.com',
      apiKey: 'fake-api-key',
      username: 'admin',
      password: 'password'
    });

    (global as any).fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          products: [{
            products_id: '12345',
            products_name: 'Zen Cart Product',
            products_description: 'Great product from Zen Cart',
            products_price: '69.99',
            products_price_special: '59.99',
            currency: 'USD',
            products_model: 'ZC-SKU',
            products_image: 'https://zencart.com/image.jpg',
            products_quantity: 35,
            categories_name: 'Books & Media',
            manufacturers_name: 'ZenCartBrand'
          }]
        })
      })
    );

    const products = await adapter.fetchProducts();
    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      id: '12345',
      name: 'Zen Cart Product',
      price: 69.99,
      currency: 'USD',
      sku: 'ZC-SKU'
    });
  });

  test('fetchOrders returns orders', async () => {
    const adapter = new ZenCartAdapter({
      storeUrl: 'https://zencart.example.com',
      apiKey: 'fake-api-key',
      username: 'admin',
      password: 'password'
    });

    (global as any).fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          orders: [{
            orders_id: '67890',
            orders_status_name: 'Shipped',
            order_total: '69.99',
            currency: 'USD',
            date_purchased: '2024-01-01T10:00:00Z',
            last_modified: '2024-01-02T10:00:00Z',
            customers_email_address: 'customer@zencart.com',
            delivery_address: {
              delivery_name: 'Eve Foster',
              delivery_street_address: '147 Zen St',
              delivery_suburb: '',
              delivery_city: 'Boston',
              delivery_state: 'MA',
              delivery_postcode: '02101',
              delivery_country: 'United States'
            },
            products: [{
              products_id: '12345',
              products_quantity: 1,
              products_price: '69.99',
              products_sku: 'ZC-SKU',
              products_name: 'Zen Cart Product'
            }]
          }]
        })
      })
    );

    const orders = await adapter.fetchOrders();
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({
      id: '67890',
      status: 'Shipped',
      total: 69.99,
      currency: 'USD'
    });
  });

  test('ZenCartAdapter requires storeUrl, username, password and apiKey', () => {
    expect(() => new ZenCartAdapter({ storeUrl: 'url', username: 'user', password: 'pass' })).toThrow('ZenCartAdapter requires an apiKey');
    expect(() => new ZenCartAdapter({ apiKey: 'key', username: 'user', password: 'pass' })).toThrow('ZenCartAdapter requires a storeUrl');
    expect(() => new ZenCartAdapter({ apiKey: 'key', storeUrl: 'url', password: 'pass' })).toThrow('ZenCartAdapter requires a username');
    expect(() => new ZenCartAdapter({ apiKey: 'key', storeUrl: 'url', username: 'user' })).toThrow('ZenCartAdapter requires a password');
  });
});