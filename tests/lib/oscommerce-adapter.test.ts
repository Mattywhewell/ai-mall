import { describe, test, expect, vi } from 'vitest';
import { OSCommerceAdapter } from '@/lib/channel-adapters/oscommerce';

describe('OSCommerceAdapter', () => {
  test('fetchProducts returns products', async () => {
    const adapter = new OSCommerceAdapter({
      storeUrl: 'https://oscommerce.example.com',
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
            products_name: 'OSCommerce Product',
            products_description: 'Great product from OSCommerce',
            products_price: '89.99',
            products_special_price: '79.99',
            currency: 'USD',
            products_model: 'OSC-SKU',
            products_image: 'https://oscommerce.com/image.jpg',
            products_quantity: 30,
            categories_name: 'Home & Garden',
            manufacturers_name: 'OSCommerceBrand'
          }]
        })
      })
    );

    const products = await adapter.fetchProducts();
    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      id: '12345',
      name: 'OSCommerce Product',
      price: 89.99,
      currency: 'USD',
      sku: 'OSC-SKU'
    });
  });

  test('fetchOrders returns orders', async () => {
    const adapter = new OSCommerceAdapter({
      storeUrl: 'https://oscommerce.example.com',
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
            orders_status_name: 'Delivered',
            order_total: '89.99',
            currency: 'USD',
            date_purchased: '2024-01-01T10:00:00Z',
            last_modified: '2024-01-02T10:00:00Z',
            customers_email_address: 'customer@oscommerce.com',
            delivery_address: {
              delivery_name: 'Charlie Davis',
              delivery_street_address: '654 Commerce Ave',
              delivery_suburb: '',
              delivery_city: 'Los Angeles',
              delivery_state: 'CA',
              delivery_postcode: '90210',
              delivery_country: 'United States'
            },
            products: [{
              products_id: '12345',
              products_quantity: 1,
              products_price: '89.99',
              products_sku: 'OSC-SKU',
              products_name: 'OSCommerce Product'
            }]
          }]
        })
      })
    );

    const orders = await adapter.fetchOrders();
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({
      id: '67890',
      status: 'Delivered',
      total: 89.99,
      currency: 'USD'
    });
  });

  test('OSCommerceAdapter requires storeUrl, username, password and apiKey', () => {
    expect(() => new OSCommerceAdapter({ storeUrl: 'url', username: 'user', password: 'pass' })).toThrow('OSCommerceAdapter requires an apiKey');
    expect(() => new OSCommerceAdapter({ apiKey: 'key', username: 'user', password: 'pass' })).toThrow('OSCommerceAdapter requires a storeUrl');
    expect(() => new OSCommerceAdapter({ apiKey: 'key', storeUrl: 'url', password: 'pass' })).toThrow('OSCommerceAdapter requires a username');
    expect(() => new OSCommerceAdapter({ apiKey: 'key', storeUrl: 'url', username: 'user' })).toThrow('OSCommerceAdapter requires a password');
  });
});