import { describe, test, expect, vi } from 'vitest';
import { ReverbAdapter } from '@/lib/channel-adapters/reverb';

describe('ReverbAdapter', () => {
  test('fetchProducts returns products', async () => {
    const adapter = new ReverbAdapter({
      accessToken: 'fake-token',
      refreshToken: 'fake-refresh-token'
    });

    (global as any).fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          listings: [{
            id: 'RB123',
            title: 'Reverb Product',
            description: 'Guitar from Reverb',
            price: { amount: '899.99', currency: 'USD' },
            sku: 'RB-SKU',
            _links: { self: { href: 'https://reverb.com/item/RB123' } },
            photos: [{ _links: { large_crop: { href: 'https://reverb.com/image.jpg' } } }],
            inventory: 5,
            categories: [{ name: 'Guitars > Electric Guitars' }],
            make: 'Fender',
            model: 'Stratocaster'
          }]
        })
      })
    );

    const products = await adapter.fetchProducts();
    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      id: 'RB123',
      name: 'Reverb Product',
      price: 899.99,
      currency: 'USD',
      sku: 'RB-SKU'
    });
  });

  test('fetchOrders returns orders', async () => {
    const adapter = new ReverbAdapter({
      accessToken: 'fake-token',
      refreshToken: 'fake-refresh-token'
    });

    (global as any).fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          orders: [{
            id: 'ORD789',
            status: 'shipped',
            total: { amount: '924.99', currency: 'USD' },
            created_at: '2024-01-01T10:00:00Z',
            updated_at: '2024-01-02T10:00:00Z',
            buyer: { email: 'buyer@reverb.com' },
            shipping_address: {
              name: 'John Guitar',
              street_address: '789 Music Ave',
              unit_number: '',
              city: 'Nashville',
              state: 'TN',
              postal_code: '37201',
              country_code: 'US'
            },
            line_items: [{
              listing_id: 'RB123',
              quantity: 1,
              amount: { amount: '899.99', currency: 'USD' },
              title: 'Reverb Product'
            }]
          }]
        })
      })
    );

    const orders = await adapter.fetchOrders();
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({
      id: 'ORD789',
      status: 'shipped',
      total: 924.99,
      currency: 'USD'
    });
  });

  test('ReverbAdapter requires accessToken and refreshToken', () => {
    expect(() => new ReverbAdapter({ accessToken: 'token' })).toThrow('ReverbAdapter requires a refreshToken');
    expect(() => new ReverbAdapter({ refreshToken: 'refresh' })).toThrow('ReverbAdapter requires an accessToken');
  });
});