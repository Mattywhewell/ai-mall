import { describe, test, expect, vi } from 'vitest';
import { XCartAdapter } from '@/lib/channel-adapters/x-cart';

describe('XCartAdapter', () => {
  test('fetchProducts returns products', async () => {
    const adapter = new XCartAdapter({
      storeUrl: 'https://xcart.example.com',
      apiKey: 'fake-api-key'
    });

    (global as any).fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          products: [{
            product_id: '12345',
            product_name: 'X-Cart Product',
            product_description: 'Great product from X-Cart',
            product_price: '119.99',
            list_price: '139.99',
            currency: 'USD',
            product_sku: 'XC-SKU',
            product_image: 'https://xcart.com/image.jpg',
            product_quantity: 20,
            category: 'Sports & Outdoors',
            brand: 'XCartBrand'
          }]
        })
      })
    );

    const products = await adapter.fetchProducts();
    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      id: '12345',
      name: 'X-Cart Product',
      price: 119.99,
      currency: 'USD',
      sku: 'XC-SKU'
    });
  });

  test('fetchOrders returns orders', async () => {
    const adapter = new XCartAdapter({
      storeUrl: 'https://xcart.example.com',
      apiKey: 'fake-api-key'
    });

    (global as any).fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          orders: [{
            order_id: '67890',
            order_status: 'Complete',
            order_total: '119.99',
            currency: 'USD',
            order_date: '2024-01-01T10:00:00Z',
            update_date: '2024-01-02T10:00:00Z',
            email: 'customer@xcart.com',
            shipping_address: {
              firstname: 'Diana',
              lastname: 'Evans',
              address: '987 Cart Blvd',
              address2: '',
              city: 'Seattle',
              state: 'WA',
              zipcode: '98101',
              country: 'United States'
            },
            products: [{
              product_id: '12345',
              amount: 1,
              price: '119.99',
              productcode: 'XC-SKU',
              product_name: 'X-Cart Product'
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
      total: 119.99,
      currency: 'USD'
    });
  });

  test('XCartAdapter requires storeUrl and apiKey', () => {
    expect(() => new XCartAdapter({ storeUrl: 'url' })).toThrow('XCartAdapter requires an apiKey');
    expect(() => new XCartAdapter({ apiKey: 'key' })).toThrow('XCartAdapter requires a storeUrl');
  });
});