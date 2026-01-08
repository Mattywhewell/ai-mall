import { describe, test, expect, vi } from 'vitest';
import { MercadoLibreAdapter } from '@/lib/channel-adapters/mercado-libre';

describe('MercadoLibreAdapter', () => {
  test('fetchProducts returns products', async () => {
    const adapter = new MercadoLibreAdapter({
      accessToken: 'fake-token',
      sellerId: 'seller123'
    });

    (global as any).fetch = vi.fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            results: ['MLA123']
          })
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'MLA123',
            title: 'Mercado Libre Product',
            description: 'Product from Mercado Libre',
            price: 1499.99,
            currency_id: 'ARS',
            seller_custom_field: 'ML-SKU',
            permalink: 'https://mercadolibre.com.ar/MLA123',
            pictures: [{ url: 'https://mla.com/image.jpg' }],
            available_quantity: 25,
            category_id: 'MLA1234',
            attributes: [{ id: 'BRAND', value_name: 'MercadoLibreBrand' }],
            variations: [{
              id: 456,
              price: 1499.99,
              attribute_combinations: [{ name: 'Color', value_name: 'Rojo' }],
              seller_custom_field: 'ML-SKU-RED',
              available_quantity: 10
            }]
          })
        })
      );

    const products = await adapter.fetchProducts();
    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      id: 'MLA123',
      name: 'Mercado Libre Product',
      price: 1499.99,
      currency: 'ARS',
      sku: 'ML-SKU'
    });
  });

  test('fetchOrders returns orders', async () => {
    const adapter = new MercadoLibreAdapter({
      accessToken: 'fake-token',
      sellerId: 'seller123'
    });

    (global as any).fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          results: [{
            id: 789,
            status: 'paid',
            total_amount: 2999.98,
            currency_id: 'ARS',
            date_created: '2024-01-01T10:00:00.000-03:00',
            date_closed: '2024-01-02T10:00:00.000-03:00',
            buyer: { email: 'buyer@ml.com' },
            shipping: {
              receiver_address: {
                receiver_name: 'Jane Doe',
                address_line: 'Calle Falsa 123',
                city: { name: 'Buenos Aires' },
                state: { name: 'Capital Federal' },
                zip_code: '1000',
                country: { name: 'Argentina' }
              }
            },
            order_items: [{
              item: { id: 'MLA123', title: 'Mercado Libre Product' },
              quantity: 2,
              unit_price: 1499.99,
              sale_fee: 0
            }]
          }]
        })
      })
    );

    const orders = await adapter.fetchOrders();
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({
      id: '789',
      status: 'paid',
      total: 2999.98,
      currency: 'ARS'
    });
  });

  test('MercadoLibreAdapter requires accessToken and sellerId', () => {
    expect(() => new MercadoLibreAdapter({ accessToken: 'token' })).toThrow('MercadoLibreAdapter requires a sellerId');
    expect(() => new MercadoLibreAdapter({ sellerId: 'seller' })).toThrow('MercadoLibreAdapter requires an accessToken');
  });
});