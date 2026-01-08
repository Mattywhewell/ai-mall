import { describe, test, expect, vi } from 'vitest';
import { GrouponAdapter } from '@/lib/channel-adapters/groupon';

describe('GrouponAdapter', () => {
  test('fetchProducts returns products', async () => {
    const adapter = new GrouponAdapter({
      apiKey: 'fake-key',
      merchantId: 'merchant123'
    });

    (global as any).fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          deals: [{
            id: 'GRP123',
            title: 'Groupon Deal',
            description: 'Great deal from Groupon',
            price: { amount: '49.99', currency_code: 'USD' },
            value: { amount: '99.99', currency_code: 'USD' },
            uuid: 'GRP-SKU',
            dealUrl: 'https://groupon.com/deal/GRP123',
            grid4ImageUrl: 'https://groupon.com/image.jpg',
            quantity: 100,
            division: { name: 'Food & Drink' },
            merchant: { name: 'GrouponMerchant' }
          }]
        })
      })
    );

    const products = await adapter.fetchProducts();
    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      id: 'GRP123',
      name: 'Groupon Deal',
      price: 49.99,
      currency: 'USD',
      sku: 'GRP-SKU'
    });
  });

  test('fetchOrders returns orders', async () => {
    const adapter = new GrouponAdapter({
      apiKey: 'fake-key',
      merchantId: 'merchant123'
    });

    (global as any).fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          orders: [{
            id: 'ORD789',
            status: 'redeemed',
            total: { amount: '49.99', currency_code: 'USD' },
            created_at: '2024-01-01T10:00:00Z',
            updated_at: '2024-01-02T10:00:00Z',
            customer: { email: 'customer@groupon.com' },
            shipping_address: {
              first_name: 'John',
              last_name: 'Doe',
              address1: '123 Deal St',
              address2: '',
              city: 'Chicago',
              state: 'IL',
              zip: '60601',
              country: 'US'
            },
            line_items: [{
              deal_uuid: 'GRP123',
              quantity: 1,
              price: { amount: '49.99', currency_code: 'USD' },
              sku: 'GRP-SKU',
              title: 'Groupon Deal'
            }]
          }]
        })
      })
    );

    const orders = await adapter.fetchOrders();
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({
      id: 'ORD789',
      status: 'redeemed',
      total: 49.99,
      currency: 'USD'
    });
  });

  test('GrouponAdapter requires apiKey and merchantId', () => {
    expect(() => new GrouponAdapter({ apiKey: 'key' })).toThrow('GrouponAdapter requires a merchantId');
    expect(() => new GrouponAdapter({ merchantId: 'merchant' })).toThrow('GrouponAdapter requires an apiKey');
  });
});