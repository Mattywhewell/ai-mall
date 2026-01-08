import { describe, test, expect, vi } from 'vitest';
import { BolComAdapter } from '@/lib/channel-adapters/bol-com';

describe('BolComAdapter', () => {
  test('fetchProducts returns products', async () => {
    const adapter = new BolComAdapter({
      clientId: 'fake-client-id',
      clientSecret: 'fake-client-secret'
    });

    (global as any).fetch = vi.fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ access_token: 'fake-access-token' })
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            offers: [{
              ean: '1234567890123',
              productTitle: 'Bol.com Product',
              pricing: { bundlePrices: [{ unitPrice: '49.99' }] },
              stock: { amount: 75 },
              category: { name: 'Elektronica' }
            }]
          })
        })
      );

    const products = await adapter.fetchProducts();
    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      id: '1234567890123',
      name: 'Bol.com Product',
      price: 49.99,
      currency: 'EUR',
      sku: '1234567890123'
    });
  });

  test('fetchOrders returns orders', async () => {
    const adapter = new BolComAdapter({
      clientId: 'fake-client-id',
      clientSecret: 'fake-client-secret'
    });

    (global as any).fetch = vi.fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ access_token: 'fake-access-token' })
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            orders: [{
              orderId: 'ORD789',
              status: 'SHIPPED',
              totalInclVat: '99.98',
              orderPlacedDateTime: '2024-01-01T10:00:00Z',
              shipmentDetails: [{
                shipTo: {
                  firstName: 'Jan',
                  surname: 'Jansen',
                  streetName: 'Damstraat',
                  houseNumber: '1',
                  houseNumberExtension: '',
                  postalCode: '1012JS',
                  city: 'Amsterdam',
                  countryCode: 'NL'
                }
              }],
              orderItems: [{
                ean: '1234567890123',
                quantity: 2,
                offerPrice: '49.99',
                productTitle: 'Bol.com Product'
              }]
            }]
          })
        })
      );

    const orders = await adapter.fetchOrders();
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({
      id: 'ORD789',
      status: 'SHIPPED',
      total: 99.98,
      currency: 'EUR'
    });
  });

  test('BolComAdapter requires clientId and clientSecret', () => {
    expect(() => new BolComAdapter({ clientId: 'id' })).toThrow('BolComAdapter requires a clientSecret');
    expect(() => new BolComAdapter({ clientSecret: 'secret' })).toThrow('BolComAdapter requires a clientId');
  });
});