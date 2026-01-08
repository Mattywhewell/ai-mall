import { ChannelAdapter } from './types';
import { fetchWithRetry } from '@/lib/utils/fetchWithRetry';

// WooCommerce adapter (supports consumer key/secret query auth or bearer token)
export class WooCommerceAdapter implements ChannelAdapter {
  consumerKey?: string;
  consumerSecret?: string;
  accessToken?: string;
  storeUrl?: string;

  constructor(opts: { consumerKey?: string; consumerSecret?: string; accessToken?: string; storeUrl?: string } = {}) {
    this.consumerKey = opts.consumerKey;
    this.consumerSecret = opts.consumerSecret;
    this.accessToken = opts.accessToken;
    this.storeUrl = opts.storeUrl;
  }

  private buildUrl(path: string, params: Record<string, any> = {}) {
    const base = (this.storeUrl || '').replace(/\/$/, '');
    const url = new URL(path, base || 'https://example.com');

    Object.keys(params).forEach(k => url.searchParams.append(k, String(params[k])));

    if (this.consumerKey && this.consumerSecret) {
      url.searchParams.append('consumer_key', this.consumerKey);
      url.searchParams.append('consumer_secret', this.consumerSecret);
    }

    return url.toString();
  }

  private getHeaders() {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.accessToken) headers['Authorization'] = `Bearer ${this.accessToken}`;
    return headers;
  }

  async fetchProducts(): Promise<any[]> {
    const products: any[] = [];
    const perPage = 100;
    let page = 1;

    while (true) {
      const url = this.buildUrl('/wp-json/wc/v3/products', { per_page: perPage, page });
      const res = await fetchWithRetry(url, { method: 'GET', headers: this.getHeaders(), retries: 3 });
      const data = await res.json();
      if (!Array.isArray(data)) break;
      products.push(...data);
      if (data.length < perPage) break;
      page++;
    }

    return products;
  }

  async fetchOrders(): Promise<any[]> {
    const orders: any[] = [];
    const perPage = 100;
    let page = 1;

    while (true) {
      const url = this.buildUrl('/wp-json/wc/v3/orders', { per_page: perPage, page });
      const res = await fetchWithRetry(url, { method: 'GET', headers: this.getHeaders(), retries: 3 });
      const data = await res.json();
      if (!Array.isArray(data)) break;
      orders.push(...data);
      if (data.length < perPage) break;
      page++;
    }

    return orders;
  }
}
