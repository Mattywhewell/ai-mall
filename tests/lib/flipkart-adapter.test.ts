import { describe, test, expect, vi } from 'vitest';
import { FlipkartAdapter } from '@/lib/channel-adapters/flipkart';

describe('FlipkartAdapter', () => {
  test('fetchProducts returns products', async () => {
    const adapter = new FlipkartAdapter({
      clientId: 'fake-client-id',
      clientSecret: 'fake-client-secret',
      accessToken: 'fake-access-token'
    });

    (global as any).fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          listings: [{
            listing_id: 'FK123',
            product_name: 'Flipkart Product',
            description: 'Quality product from Flipkart',
            mrp: '1499.00',
            sku_id: 'FK-SKU',
            product_url: 'https://flipkart.com/item/FK123',
            image_url: 'https://fk.com/image.jpg',
            available_quantity: 50,
            category: 'Electronics',
            brand: 'FlipkartBrand',
            variants: [{
              variant_id: 'VAR456',
              variant_name: 'Color: Black',
              price: '1299.00',
              sku_id: 'FK-SKU-BLK',
              quantity: 25
            }]
          }]
        })
      })
    );

    const products = await adapter.fetchProducts();
    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      id: 'FK123',
      name: 'Flipkart Product',
      price: 1499,
      currency: 'INR',
      sku: 'FK-SKU'
    });
  });

  test('fetchOrders returns orders', async () => {
    const adapter = new FlipkartAdapter({
      clientId: 'fake-client-id',
      clientSecret: 'fake-client-secret',
      accessToken: 'fake-access-token'
    });

    (global as any).fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          orders: [{
            order_id: 'ORD789',
            order_status: 'DELIVERED',
            order_total: '2598.00',
            order_date: '2024-01-01T10:00:00Z',
            last_updated_date: '2024-01-02T10:00:00Z',
            customer_details: { email: 'customer@flipkart.com' },
            shipping_address: {
              name: 'John Doe',
              address_line_1: '123 MG Road',
              address_line_2: '',
              city: 'Bangalore',
              state: 'Karnataka',
              pincode: '560001'
            },
            order_items: [{
              item_id: 'FK123',
              quantity: 2,
              selling_price: '1299.00',
              sku: 'FK-SKU',
              product_name: 'Flipkart Product'
            }]
          }]
        })
      })
    );

    const orders = await adapter.fetchOrders();
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({
      id: 'ORD789',
      status: 'DELIVERED',
      total: 2598.00,
      currency: 'INR'
    });
  });

  test('FlipkartAdapter requires clientId, clientSecret and accessToken', () => {
    expect(() => new FlipkartAdapter({ clientId: 'id', clientSecret: 'secret' })).toThrow('FlipkartAdapter requires an accessToken');
    expect(() => new FlipkartAdapter({ clientId: 'id', accessToken: 'token' })).toThrow('FlipkartAdapter requires a clientSecret');
    expect(() => new FlipkartAdapter({ clientSecret: 'secret', accessToken: 'token' })).toThrow('FlipkartAdapter requires a clientId');
  });
});