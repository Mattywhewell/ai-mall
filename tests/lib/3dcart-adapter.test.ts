import { describe, test, expect, vi } from 'vitest';
import { ThreeDCartAdapter } from '@/lib/channel-adapters/3dcart';

describe('ThreeDCartAdapter', () => {
  test('fetchProducts returns products', async () => {
    const adapter = new ThreeDCartAdapter({
      storeUrl: 'https://3dcart.example.com',
      apiKey: 'fake-api-key'
    });

    (global as any).fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          {
            catalogid: '12345',
            name: '3D Cart Product',
            description: 'Great product from 3D Cart',
            price: '99.99',
            saleprice: '89.99',
            currency: 'USD',
            sku: '3DC-SKU',
            image1: 'https://3dcart.com/image.jpg',
            stock: 45,
            category: 'Toys & Games',
            manufacturer: '3DCartBrand'
          }
        ])
      })
    );

    const products = await adapter.fetchProducts();
    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      id: '12345',
      name: '3D Cart Product',
      price: 99.99,
      currency: 'USD',
      sku: '3DC-SKU'
    });
  });

  test('fetchOrders returns orders', async () => {
    const adapter = new ThreeDCartAdapter({
      storeUrl: 'https://3dcart.example.com',
      apiKey: 'fake-api-key'
    });

    (global as any).fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          {
            invoice: '67890',
            status: 'Shipped',
            total: '99.99',
            currency: 'USD',
            orderdate: '2024-01-01T10:00:00Z',
            lastupdate: '2024-01-02T10:00:00Z',
            email: 'customer@3dcart.com',
            shipaddress: {
              firstname: 'Frank',
              lastname: 'Garcia',
              address: '258 Cart Way',
              address2: '',
              city: 'Miami',
              state: 'FL',
              zip: '33101',
              country: 'United States'
            },
            items: [{
              catalogid: '12345',
              quantity: 1,
              price: '99.99',
              sku: '3DC-SKU',
              name: '3D Cart Product'
            }]
          }
        ])
      })
    );

    const orders = await adapter.fetchOrders();
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({
      id: '67890',
      status: 'Shipped',
      total: 99.99,
      currency: 'USD'
    });
  });

  test('ThreeDCartAdapter requires storeUrl and apiKey', () => {
    expect(() => new ThreeDCartAdapter({ storeUrl: 'url' })).toThrow('ThreeDCartAdapter requires an apiKey');
    expect(() => new ThreeDCartAdapter({ apiKey: 'key' })).toThrow('ThreeDCartAdapter requires a storeUrl');
  });
});