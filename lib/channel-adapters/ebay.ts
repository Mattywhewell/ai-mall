import { ChannelAdapter } from './types';

// eBay adapter implementation (basic)
// Uses eBay Sell APIs (Inventory API + Fulfillment API). This implementation is a light wrapper and
// does not yet implement pagination or retry/rate-limit handling — those should be added for production.
export class EbayAdapter implements ChannelAdapter {
  accessToken: string;
  marketplaceId?: string;

  constructor(opts: { accessToken: string; marketplaceId?: string }) {
    this.accessToken = opts.accessToken;
    this.marketplaceId = opts.marketplaceId;
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.accessToken}`
    };
    if (this.marketplaceId) headers['X-EBAY-C-MARKETPLACE-ID'] = this.marketplaceId;
    return headers;
  }

  async fetchProducts(): Promise<any[]> {
    try {
      // Inventory API - get a page of inventory items
      // paginated retrieval using offset & limit
      const limit = 50;
      let offset = 0;
      const items: any[] = [];

      while (true) {
        const url = `https://api.ebay.com/sell/inventory/v1/inventory_item?limit=${limit}&offset=${offset}`;
        const res = await fetchWithRetry(url, { method: 'GET', headers: this.getHeaders(), retries: 3, backoffMs: 300 });
        const data = await res.json();
        const pageItems = data.inventoryItems || data.items || [];
        items.push(...pageItems);
        if (!pageItems || pageItems.length < limit) break;
        offset += limit;
      }

      return items;
    } catch (err) {
      console.error('EbayAdapter.fetchProducts error', err);
      throw err;
    }
  }

  async fetchOrders(): Promise<any[]> {
    try {
      // Fulfillment API - get orders
      const limit = 50;
      let offset = 0;
      const orders: any[] = [];

      while (true) {
        const url = `https://api.ebay.com/sell/fulfillment/v1/order?limit=${limit}&offset=${offset}`;
        const res = await fetchWithRetry(url, { method: 'GET', headers: this.getHeaders(), retries: 3, backoffMs: 300 });
        const data = await res.json();
        const pageOrders = data.orders || data.orderSummaries || [];
        orders.push(...pageOrders);
        if (!pageOrders || pageOrders.length < limit) break;
        offset += limit;
      }

      return orders;
    } catch (err) {
      console.error('EbayAdapter.fetchOrders error', err);
      throw err;
    }
  }
}
