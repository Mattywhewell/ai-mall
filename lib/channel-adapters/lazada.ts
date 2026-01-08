import { ChannelAdapter, Product, Order } from './types';

export interface LazadaAdapterConfig {
  appKey?: string;
  appSecret?: string;
  accessToken?: string;
}

export class LazadaAdapter implements ChannelAdapter {
  private appKey: string;
  private appSecret: string;
  private accessToken: string;

  constructor(config: LazadaAdapterConfig) {
    if (!config.appKey) {
      throw new Error('LazadaAdapter requires an appKey');
    }
    if (!config.appSecret) {
      throw new Error('LazadaAdapter requires an appSecret');
    }
    if (!config.accessToken) {
      throw new Error('LazadaAdapter requires an accessToken');
    }
    this.appKey = config.appKey;
    this.appSecret = config.appSecret;
    this.accessToken = config.accessToken;
  }

  async fetchProducts(): Promise<Product[]> {
    const timestamp = Date.now();
    const sign = this.generateSignature('GET', '/products/get', timestamp);

    const response = await fetch(`https://api.lazada.com/rest/products/get?app_key=${this.appKey}&access_token=${this.accessToken}&timestamp=${timestamp}&sign=${sign}&limit=50&offset=0`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Lazada API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data?.products?.map((item: any) => ({
      id: item.item_id?.toString(),
      name: item.attributes?.name,
      description: item.attributes?.description,
      price: parseFloat(item.skus?.[0]?.price || '0'),
      currency: item.currency || 'USD',
      sku: item.skus?.[0]?.SellerSku || item.item_id?.toString(),
      url: item.attributes?.url,
      image_url: item.images?.[0],
      stock_quantity: item.skus?.[0]?.quantity || 0,
      categories: item.primary_category_name ? [item.primary_category_name] : [],
      brand: item.attributes?.brand,
      variants: item.skus?.map((sku: any) => ({
        id: sku.sku_id?.toString(),
        name: sku.SellerSku,
        price: parseFloat(sku.price),
        sku: sku.SellerSku,
        stock: sku.quantity,
      })) || [],
    })) || [];
  }

  async fetchOrders(): Promise<Order[]> {
    const timestamp = Date.now();
    const sign = this.generateSignature('GET', '/orders/get', timestamp);

    const response = await fetch(`https://api.lazada.com/rest/orders/get?app_key=${this.appKey}&access_token=${this.accessToken}&timestamp=${timestamp}&sign=${sign}&limit=50&offset=0&status=pending`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Lazada API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data?.orders?.map((order: any) => ({
      id: order.order_id?.toString(),
      status: order.statuses?.[0] || 'pending',
      total: parseFloat(order.price),
      currency: order.currency || 'USD',
      created_at: order.created_at,
      updated_at: order.updated_at,
      customer_email: order.customer_email,
      shipping_address: order.address_billing ? {
        first_name: order.address_billing.first_name,
        last_name: order.address_billing.last_name,
        address1: order.address_billing.address1,
        address2: order.address_billing.address2,
        city: order.address_billing.city,
        state: order.address_billing.region,
        zip: order.address_billing.post_code,
        country: order.address_billing.country,
      } : undefined,
      items: order.items?.map((item: any) => ({
        product_id: item.item_id?.toString(),
        quantity: item.item_quantity,
        price: parseFloat(item.item_price),
        sku: item.sku,
        name: item.name,
      })) || [],
    })) || [];
  }

  private generateSignature(method: string, path: string, timestamp: number): string {
    // Simplified signature generation - in production this would use proper HMAC-SHA256
    const stringToSign = `${method}${path}${timestamp}`;
    return btoa(stringToSign).substring(0, 32); // Mock signature for demo
  }
}