import { ChannelAdapter } from './types';
import { fetchWithRetry } from '@/lib/utils/fetchWithRetry';
import { signAwsRequest } from '@/lib/awsSigV4';

// Amazon adapter (basic Selling Partner API wrapper)
// NOTE: A production implementation must implement AWS SigV4 signing and LWA token exchange.
// This lightweight adapter supports using a pre-obtained access token (LWA) via `accessToken` field.
export class AmazonAdapter implements ChannelAdapter {
  accessKey?: string;
  secretKey?: string;
  sellerId?: string;
  accessToken?: string;
  sessionToken?: string;
  region: string = 'us-east-1';
  service: string = 'execute-api';
  baseUrl?: string;

  constructor(opts: { accessKey?: string; secretKey?: string; sellerId?: string; accessToken?: string; sessionToken?: string; region?: string; service?: string; baseUrl?: string }) {
    this.accessKey = opts.accessKey;
    this.secretKey = opts.secretKey;
    this.sellerId = opts.sellerId;
    this.accessToken = opts.accessToken;
    this.sessionToken = opts.sessionToken;
    this.baseUrl = opts.baseUrl;
    if (opts.region) this.region = opts.region;
    if (opts.service) this.service = opts.service;
  }

  private getHeaders() {
    if (this.accessToken) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`
      };
    }
    // If no access token provided, throw - signing not implemented here
    throw new Error('AmazonAdapter requires an accessToken (LWA) for API access or accessKey/secretKey for SigV4');
  }

  private async signedFetch(url: string, opts: { method?: string; body?: any } = {}) {
    const method = opts.method || 'GET';
    const body = opts.body ? (typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body)) : '';

    // Build initial headers
    const headers: Record<string, string> = {
      'content-type': 'application/json'
    };

    // If LWA access token present (x-amz-access-token), include it
    if (this.accessToken) {
      headers['x-amz-access-token'] = this.accessToken;
    }

    // If AWS keys available, use SigV4 signing; otherwise require accessToken
    if (this.accessKey && this.secretKey) {
      const sigHeaders = signAwsRequest({
        method,
        url,
        headers,
        body,
        accessKey: this.accessKey,
        secretKey: this.secretKey,
        sessionToken: this.sessionToken,
        region: this.region,
        service: this.service
      });

      // merge headers
      Object.assign(headers, sigHeaders);
    } else if (!this.accessToken) {
      throw new Error('AmazonAdapter requires either accessToken (LWA) or accessKey/secretKey for SigV4');
    }

    const res = await fetchWithRetry(url, { method, headers, body: body || undefined, retries: 3, backoffMs: 300 });
    return res;
  }

  // Paginate using nextToken for Orders API
  async fetchOrders(marketplaceIds?: string[]): Promise<any[]> {
    try {
      const orders: any[] = [];
      let nextToken: string | undefined = undefined;
      const marketplaceParam = marketplaceIds && marketplaceIds.length ? `&MarketplaceIds=${encodeURIComponent(marketplaceIds.join(','))}` : '';

      while (true) {
        const base = this.baseUrl || 'https://sellingpartnerapi-na.amazon.com';
        const url = `${base}/orders/v0/orders?MaxResultsPerPage=50${marketplaceParam}${nextToken ? `&NextToken=${encodeURIComponent(nextToken)}` : ''}`;
        const res = await this.signedFetch(url, { method: 'GET' });
        const data = await res.json();
        const page = data.orders || data.Orders || data.payload?.orders || [];
        orders.push(...page);
        nextToken = data.NextToken || data.nextToken || data.payload?.nextToken || undefined;
        if (!nextToken || (page && page.length < 50)) break;
      }

      return orders;
    } catch (err) {
      console.error('AmazonAdapter.fetchOrders error', err);
      throw err;
    }
  }

  // Fetch products via Catalog API (simple pagination if supported)
  async fetchProducts(): Promise<any[]> {
    try {
      const items: any[] = [];
      let nextToken: string | undefined = undefined;

      while (true) {
        const base = this.baseUrl || 'https://sellingpartnerapi-na.amazon.com';
        const url = `${base}/catalog/2020-12-01/items?MarketplaceId=ATVPDKIKX0DER&Query=*&MaxResultsPerPage=50${nextToken ? `&NextToken=${encodeURIComponent(nextToken)}` : ''}`;
        const res = await this.signedFetch(url, { method: 'GET' });
        const data = await res.json();
        const page = data.items || data.Items || data.payload?.items || [];
        items.push(...page);
        nextToken = data.NextToken || data.nextToken || data.payload?.nextToken || undefined;
        if (!nextToken || (page && page.length < 50)) break;
      }

      return items;
    } catch (err) {
      console.error('AmazonAdapter.fetchProducts error', err);
      throw err;
    }
  }
}
