import { describe, test, expect, vi } from 'vitest';
import { WayfairAdapter } from '@/lib/channel-adapters/wayfair';

describe('WayfairAdapter', () => {
  test('fetchProducts returns products', async () => {
    const adapter = new WayfairAdapter({
      clientId: 'fake-client-id',
      clientSecret: 'fake-client-secret',
      supplierId: 'supplier123',
      accessToken: 'fake-access-token'
    });

    (global as any).fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          products: [{
            product_id: 'WF123',
            name: 'Wayfair Product',
            description: 'Furniture from Wayfair',
            price: '299.99',
            currency: 'USD',
            supplier_part_number: 'WF-SKU',
            product_url: 'https://wayfair.com/product/WF123',
            image_url: 'https://wayfair.com/image.jpg',
            quantity_available: 100,
            category_hierarchy: ['Furniture'],
            brand: 'WayfairBrand',
            variants: [{
              variant_id: 'VAR456',
              name: 'Color: Brown',
              price: '299.99',
              supplier_part_number: 'WF-SKU-BRN',
              quantity_available: 50
            }]
          }]
        })
      })
    );

    const products = await adapter.fetchProducts();
    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      id: 'WF123',
      name: 'Wayfair Product',
      price: 299.99,
      currency: 'USD',
      sku: 'WF-SKU'
    });
  });

  test('fetchOrders returns orders', async () => {
    const adapter = new WayfairAdapter({
      clientId: 'fake-client-id',
      clientSecret: 'fake-client-secret',
      supplierId: 'supplier123',
      accessToken: 'fake-access-token'
    });

    (global as any).fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          orders: [{
            order_id: 'ORD789',
            status: 'shipped',
            total_amount: '599.98',
            currency: 'USD',
            created_date: '2024-01-01T10:00:00Z',
            last_modified_date: '2024-01-02T10:00:00Z',
            customer_email: 'customer@wayfair.com',
            shipping_address: {
              first_name: 'Jane',
              last_name: 'Smith',
              address_line_1: '456 Oak Street',
              address_line_2: 'Apt 2B',
              city: 'Boston',
              state: 'MA',
              postal_code: '02101',
              country: 'US'
            },
            line_items: [{
              product_id: 'WF123',
              quantity: 2,
              unit_price: '299.99',
              sku: 'WF-SKU',
              product_name: 'Wayfair Product'
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
      total: 599.98,
      currency: 'USD'
    });
  });

  test('WayfairAdapter requires clientId, clientSecret and accessToken', () => {
    expect(() => new WayfairAdapter({ clientId: 'id', clientSecret: 'secret' })).toThrow('WayfairAdapter requires an accessToken');
    expect(() => new WayfairAdapter({ clientId: 'id', accessToken: 'token' })).toThrow('WayfairAdapter requires a clientSecret');
    expect(() => new WayfairAdapter({ clientSecret: 'secret', accessToken: 'token' })).toThrow('WayfairAdapter requires a clientId');
  });
});