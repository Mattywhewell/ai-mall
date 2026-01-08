import { ChannelAdapter } from './types';

// TikTok Shop adapter (basic) - uses Open Platform API endpoints. Exact endpoints and response
// shapes can vary by region; this is a conservative, generic implementation.
export class TikTokAdapter implements ChannelAdapter {
  accessToken: string;
  shopId?: string;

  constructor(opts: { accessToken: string; shopId?: string }) {
    this.accessToken = opts.accessToken;
    this.shopId = opts.shopId;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.accessToken}`
    };
  }

  async fetchProducts(): Promise<any[]> {
    try {
      // Placeholder endpoint - TikTok Shop product listing
      // cursor-based pagination
      const limit = 50;
      let cursor: string | undefined = undefined;
      const items: any[] = [];

      while (true) {
        const url = `https://open-api.tiktokglobalshop.com/api/products/list?limit=${limit}${this.shopId ? `&shop_id=${encodeURIComponent(this.shopId)}` : ''}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
        const res = await fetchWithRetry(url, { method: 'GET', headers: this.getHeaders(), retries: 3, backoffMs: 300 });
        const data = await res.json();
        const page = data.data?.products || data.products || data.data || [];
        items.push(...page);
        // try to find next cursor
        cursor = data.data?.next_cursor || data.next_cursor || data.cursor || undefined;
        if (!cursor || (page && page.length < limit)) break;
      }

      return items;
    } catch (err) {
      console.error('TikTokAdapter.fetchProducts error', err);
      throw err;
    }
  }

  async fetchOrders(): Promise<any[]> {
    try {
      // Placeholder endpoint - TikTok Shop orders
      const limit = 50;
      let cursor: string | undefined = undefined;
      const orders: any[] = [];

      while (true) {
        const url = `https://open-api.tiktokglobalshop.com/api/orders/list?limit=${limit}${this.shopId ? `&shop_id=${encodeURIComponent(this.shopId)}` : ''}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
        const res = await fetchWithRetry(url, { method: 'GET', headers: this.getHeaders(), retries: 3, backoffMs: 300 });
        const data = await res.json();
        const page = data.data?.orders || data.orders || data.data || [];
        orders.push(...page);
        cursor = data.data?.next_cursor || data.next_cursor || data.cursor || undefined;
        if (!cursor || (page && page.length < limit)) break;
      }

      return orders;
    } catch (err) {
      console.error('TikTokAdapter.fetchOrders error', err);
      throw err;
    }
  }
}
