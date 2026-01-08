import { ChannelAdapter } from './types';
import { fetchWithRetry } from '@/lib/utils/fetchWithRetry';

// BigCommerce adapter (supports store hash + X-Auth-Token)
export class BigCommerceAdapter implements ChannelAdapter {
  accessToken?: string;
  storeHash?: string;

  constructor(opts: { accessToken?: string; storeHash?: string } = {}) {
    this.accessToken = opts.accessToken;
    this.storeHash = opts.storeHash;
  }

  private baseUrl() {
    if (!this.storeHash) return 'https://api.bigcommerce.com';
    return `https://api.bigcommerce.com/stores/${this.storeHash}`;
  }

  private getHeaders() {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.accessToken) headers['X-Auth-Token'] = this.accessToken;
    return headers;
  }

  async fetchProducts(): Promise<any[]> {
    const products: any[] = [];
    const limit = 50;
    let page = 1;

    while (true) {
      const url = `${this.baseUrl()}/v3/catalog/products?limit=${limit}&page=${page}`;
      const res = await fetchWithRetry(url, { method: 'GET', headers: this.getHeaders(), retries: 3 });
      const data = await res.json();
      const pageItems = data.data || data.products || [];
      if (!Array.isArray(pageItems)) break;
      products.push(...pageItems);
      if (pageItems.length < limit) break;
      page++;
    }

    return products;
  }

  async fetchOrders(): Promise<any[]> {
    const orders: any[] = [];
    const limit = 50;
    let page = 1;

    while (true) {
      const url = `${this.baseUrl()}/v2/orders?limit=${limit}&page=${page}`;
      const res = await fetchWithRetry(url, { method: 'GET', headers: this.getHeaders(), retries: 3 });
      const pageItems = await res.json();
      if (!Array.isArray(pageItems)) break;
      orders.push(...pageItems);
      if (pageItems.length < limit) break;
      page++;
    }

    return orders;
  }
}
