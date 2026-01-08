import { ChannelAdapter, Product, Order } from './types';

export interface ReverbAdapterConfig {
  accessToken?: string;
  refreshToken?: string;
}

export class ReverbAdapter implements ChannelAdapter {
  private accessToken: string;
  private refreshToken: string;

  constructor(config: ReverbAdapterConfig) {
    if (!config.accessToken) {
      throw new Error('ReverbAdapter requires an accessToken');
    }
    if (!config.refreshToken) {
      throw new Error('ReverbAdapter requires a refreshToken');
    }
    this.accessToken = config.accessToken;
    this.refreshToken = config.refreshToken;
  }

  async fetchProducts(): Promise<Product[]> {
    const response = await fetch('https://api.reverb.com/api/my/listings?per_page=50&page=1', {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'Accept-Version': '3.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Reverb API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.listings?.map((item: any) => ({
      id: item.id.toString(),
      name: item.title,
      description: item.description,
      price: parseFloat(item.price?.amount || '0'),
      currency: item.price?.currency || 'USD',
      sku: item.sku || item.id.toString(),
      url: item._links?.self?.href,
      image_url: item.photos?.[0]?._links?.large_crop?.href,
      stock_quantity: item.inventory,
      categories: item.categories?.map((cat: any) => cat.name) || [],
      brand: item.make,
      variants: [], // Reverb typically doesn't have variants like other platforms
    })) || [];
  }

  async fetchOrders(): Promise<Order[]> {
    const response = await fetch('https://api.reverb.com/api/my/orders?per_page=50&page=1', {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'Accept-Version': '3.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Reverb API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.orders?.map((order: any) => ({
      id: order.id.toString(),
      status: order.status,
      total: parseFloat(order.total?.amount || '0'),
      currency: order.total?.currency || 'USD',
      created_at: order.created_at,
      updated_at: order.updated_at,
      customer_email: order.buyer?.email,
      shipping_address: order.shipping_address ? {
        first_name: order.shipping_address.name,
        last_name: '',
        address1: order.shipping_address.street_address,
        address2: order.shipping_address.unit_number,
        city: order.shipping_address.city,
        state: order.shipping_address.state,
        zip: order.shipping_address.postal_code,
        country: order.shipping_address.country_code,
      } : undefined,
      items: order.line_items?.map((item: any) => ({
        product_id: item.listing?.id?.toString(),
        quantity: item.quantity,
        price: parseFloat(item.price?.amount || '0'),
        sku: item.listing?.sku || item.listing?.id?.toString(),
        name: item.listing?.title,
      })) || [],
    })) || [];
  }
}