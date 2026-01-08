import { describe, test, expect, vi } from 'vitest';
import { PrestaShopAdapter } from '@/lib/channel-adapters/prestashop';

describe('PrestaShopAdapter', () => {
  test('fetchProducts returns products', async () => {
    const adapter = new PrestaShopAdapter({
      apiKey: 'fake-key',
      storeUrl: 'https://prestashop.shop'
    });

    (global as any).fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(`<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <products>
    <product>
      <id>123</id>
      <name><language>PrestaShop Product</language></name>
      <description><language>Premium product</language></description>
      <price>49.99</price>
      <reference>PS-SKU</reference>
      <id_default_image>123</id_default_image>
      <associations>
        <categories>
          <category><id>1</id></category>
          <category><id>2</id></category>
        </categories>
      </associations>
      <manufacturer_name>PrestaShopBrand</manufacturer_name>
      <quantity>20</quantity>
    </product>
  </products>
</prestashop>`)
      })
    );
    const products = await adapter.fetchProducts();
    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      id: '123',
      name: 'PrestaShop Product',
      price: 49.99,
      currency: 'EUR',
      sku: 'PS-SKU'
    });
  });

  test('fetchOrders returns orders', async () => {
    const adapter = new PrestaShopAdapter({
      apiKey: 'fake-key',
      storeUrl: 'https://prestashop.shop'
    });

    (global as any).fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(`<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <orders>
    <order>
      <id>456</id>
      <current_state>2</current_state>
      <total_paid>99.98</total_paid>
      <date_add>2024-01-01 10:00:00</date_add>
      <date_upd>2024-01-02 10:00:00</date_upd>
      <id_customer>789</id_customer>
      <associations>
        <order_rows>
          <order_row>
            <product_id>123</product_id>
            <product_quantity>2</product_quantity>
            <unit_price_tax_incl>49.99</unit_price_tax_incl>
            <product_reference>PS-SKU</product_reference>
            <product_name>PrestaShop Product</product_name>
          </order_row>
        </order_rows>
      </associations>
    </order>
  </orders>
</prestashop>`)
      })
    );

    const orders = await adapter.fetchOrders();
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({
      id: '456',
      status: 'processing',
      total: 99.98,
      currency: 'EUR'
    });
  });

  test('PrestaShopAdapter requires apiKey and storeUrl', () => {
    expect(() => new PrestaShopAdapter({ apiKey: 'key' })).toThrow('PrestaShopAdapter requires a storeUrl');
    expect(() => new PrestaShopAdapter({ storeUrl: 'url' })).toThrow('PrestaShopAdapter requires an apiKey');
  });
});