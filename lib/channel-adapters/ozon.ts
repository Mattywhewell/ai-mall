import { ChannelAdapter, Product, Order } from './types';

export interface OzonAdapterConfig {
  clientId?: string;
  apiKey?: string;
}

export class OzonAdapter implements ChannelAdapter {
  private clientId: string;
  private apiKey: string;

  constructor(config: OzonAdapterConfig) {
    if (!config.clientId) {
      throw new Error('OzonAdapter requires a clientId');
    }
    if (!config.apiKey) {
      throw new Error('OzonAdapter requires an apiKey');
    }
    this.clientId = config.clientId;
    this.apiKey = config.apiKey;
  }

  async fetchProducts(): Promise<Product[]> {
    const response = await fetch('https://api-seller.ozon.ru/v2/product/list', {
      method: 'POST',
      headers: {
        'Client-Id': this.clientId,
        'Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: {
          visibility: 'ALL'
        },
        last_id: '',
        limit: 100
      }),
    });

    if (!response.ok) {
      throw new Error(`Ozon API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.result?.items?.map((item: any) => ({
      id: item.product_id.toString(),
      name: item.name,
      description: item.description || item.name,
      price: parseFloat(item.price || '0'),
      currency: 'RUB',
      sku: item.sku || item.product_id.toString(),
      url: `https://www.ozon.ru/product/${item.product_id}`,
      image_url: item.images?.[0]?.url,
      stock_quantity: item.stocks?.[0]?.present || 0,
      categories: item.category_name ? [item.category_name] : [],
      brand: item.brand,
      variants: item.sources?.map((source: any) => ({
        id: source.sku.toString(),
        name: source.name,
        price: parseFloat(source.price || '0'),
        sku: source.sku.toString(),
        stock: source.stocks?.present || 0,
      })) || [],
    })) || [];
  }

  async fetchOrders(): Promise<Order[]> {
    const response = await fetch('https://api-seller.ozon.ru/v3/posting/fbs/list', {
      method: 'POST',
      headers: {
        'Client-Id': this.clientId,
        'Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: {
          since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
          to: new Date().toISOString()
        },
        limit: 50
      }),
    });

    if (!response.ok) {
      throw new Error(`Ozon API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.result?.postings?.map((posting: any) => ({
      id: posting.posting_number,
      status: posting.status,
      total: parseFloat(posting.analytics_data?.revenue || '0'),
      currency: 'RUB',
      created_at: posting.created_at,
      updated_at: posting.updated_at,
      customer_email: '', // Ozon doesn't expose customer emails
      shipping_address: undefined, // FBS orders don't include shipping details in this endpoint
      items: posting.products?.map((product: any) => ({
        product_id: product.sku?.toString(),
        quantity: product.quantity,
        price: parseFloat(product.price || '0'),
        sku: product.sku?.toString(),
        name: product.name,
      })) || [],
    })) || [];
  }
}