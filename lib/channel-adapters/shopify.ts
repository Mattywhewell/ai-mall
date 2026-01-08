import { ChannelAdapter } from './types';

export class ShopifyAdapter implements ChannelAdapter {
  shop: string; // domain like 'your-store.myshopify.com'
  accessToken: string;

  constructor(opts: { shop: string; accessToken: string }) {
    this.shop = opts.shop.replace(/^https?:\/\//, '').replace(/\/$/, '');
    this.accessToken = opts.accessToken;
  }

  async fetchProducts(): Promise<any[]> {
    try {
      const url = `https://${this.shop}/admin/api/2023-10/products.json?limit=50`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': this.accessToken
        }
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Shopify fetchProducts failed: ${res.status} ${text}`);
      }

      const data = await res.json();
      return data.products || [];
    } catch (err) {
      console.error('ShopifyAdapter.fetchProducts error', err);
      throw err;
    }
  }

  async fetchOrders(): Promise<any[]> {
    try {
      const url = `https://${this.shop}/admin/api/2023-10/orders.json?status=any&limit=50`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': this.accessToken
        }
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Shopify fetchOrders failed: ${res.status} ${text}`);
      }

      const data = await res.json();
      return data.orders || [];
    } catch (err) {
      console.error('ShopifyAdapter.fetchOrders error', err);
      throw err;
    }
  }
}
