import { describe, test, expect, vi } from 'vitest';
import { NopCommerceAdapter } from '@/lib/channel-adapters/nopcommerce';

describe('NopCommerceAdapter', () => {
  test('fetchProducts returns products', async () => {
    const adapter = new NopCommerceAdapter({
      storeUrl: 'https://nopcommerce.example.com',
      apiKey: 'fake-api-key'
    });

    (global as any).fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          {
            Id: 12345,
            Name: 'NopCommerce Product',
            ShortDescription: 'Great product from NopCommerce',
            Price: 59.99,
            OldPrice: 79.99,
            Currency: 'USD',
            Sku: 'NC-SKU',
            Images: [{ Src: 'https://nopcommerce.com/image.jpg' }],
            StockQuantity: 40,
            Categories: [{ Name: 'Electronics' }],
            Manufacturer: { Name: 'NopCommerceBrand' }
          }
        ])
      })
    );

    const products = await adapter.fetchProducts();
    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      id: '12345',
      name: 'NopCommerce Product',
      price: 59.99,
      currency: 'USD',
      sku: 'NC-SKU'
    });
  });

  test('fetchOrders returns orders', async () => {
    const adapter = new NopCommerceAdapter({
      storeUrl: 'https://nopcommerce.example.com',
      apiKey: 'fake-api-key'
    });

    (global as any).fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          {
            Id: 67890,
            OrderStatus: 'Complete',
            OrderTotal: 59.99,
            Currency: 'USD',
            CreatedOnUtc: '2024-01-01T10:00:00Z',
            UpdatedOnUtc: '2024-01-02T10:00:00Z',
            CustomerEmail: 'customer@nopcommerce.com',
            ShippingAddress: {
              FirstName: 'Alice',
              LastName: 'Brown',
              Address1: '321 Commerce St',
              Address2: '',
              City: 'New York',
              StateProvince: 'NY',
              ZipPostalCode: '10001',
              Country: 'United States'
            },
            OrderItems: [{
              ProductId: 12345,
              Quantity: 1,
              Price: 59.99,
              Sku: 'NC-SKU',
              ProductName: 'NopCommerce Product'
            }]
          }
        ])
      })
    );

    const orders = await adapter.fetchOrders();
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({
      id: '67890',
      status: 'Complete',
      total: 59.99,
      currency: 'USD'
    });
  });

  test('NopCommerceAdapter requires storeUrl and apiKey', () => {
    expect(() => new NopCommerceAdapter({ storeUrl: 'url' })).toThrow('NopCommerceAdapter requires an apiKey');
    expect(() => new NopCommerceAdapter({ apiKey: 'key' })).toThrow('NopCommerceAdapter requires a storeUrl');
  });
});