import { describe, test, expect, vi } from 'vitest';
import { TrademeAdapter } from '@/lib/channel-adapters/trademe';

describe('TrademeAdapter', () => {
  test('fetchProducts returns products', async () => {
    const adapter = new TrademeAdapter({
      consumerKey: 'fake-consumer',
      consumerSecret: 'fake-secret',
      accessToken: 'fake-token',
      accessTokenSecret: 'fake-token-secret'
    });

    (global as any).fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          List: [{
            ListingId: 12345,
            Title: 'Trademe Listing',
            Description: 'Great item from Trademe',
            PriceDisplay: '$99.99',
            BuyNowPrice: 99.99,
            SKU: 'TM-SKU',
            Photos: [{ Value: { FullSize: 'https://trademe.co.nz/photo.jpg' } }],
            Quantity: 50,
            Category: 'Home & Garden',
            Seller: { Nickname: 'TrademeSeller' }
          }]
        })
      })
    );

    const products = await adapter.fetchProducts();
    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      id: '12345',
      name: 'Trademe Listing',
      price: 99.99,
      currency: 'NZD',
      sku: 'TM-SKU'
    });
  });

  test('fetchOrders returns orders', async () => {
    const adapter = new TrademeAdapter({
      consumerKey: 'fake-consumer',
      consumerSecret: 'fake-secret',
      accessToken: 'fake-token',
      accessTokenSecret: 'fake-token-secret'
    });

    (global as any).fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          List: [{
            SaleId: 67890,
            ListingId: 12345,
            Status: 'Sold',
            SalePrice: 99.99,
            SaleDate: '2024-01-01T10:00:00Z',
            Title: 'Trademe Listing'
          }]
        })
      })
    );

    const orders = await adapter.fetchOrders();
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({
      id: '67890',
      status: 'Sold',
      total: 99.99,
      currency: 'NZD'
    });
  });

  test('TrademeAdapter requires OAuth credentials', () => {
    expect(() => new TrademeAdapter({
      consumerKey: 'key',
      consumerSecret: 'secret',
      accessToken: 'token'
    })).toThrow('TrademeAdapter requires an accessTokenSecret');
    expect(() => new TrademeAdapter({
      consumerKey: 'key',
      consumerSecret: 'secret',
      accessTokenSecret: 'secret'
    })).toThrow('TrademeAdapter requires an accessToken');
    expect(() => new TrademeAdapter({
      consumerKey: 'key',
      accessToken: 'token',
      accessTokenSecret: 'secret'
    })).toThrow('TrademeAdapter requires a consumerSecret');
    expect(() => new TrademeAdapter({
      consumerSecret: 'secret',
      accessToken: 'token',
      accessTokenSecret: 'secret'
    })).toThrow('TrademeAdapter requires a consumerKey');
  });
});