import { ChannelAdapter, Product, Order } from './types';

export interface OpenCartAdapterConfig {
  apiKey?: string;
  storeUrl?: string;
  username?: string;
  password?: string;
}

export class OpenCartAdapter implements ChannelAdapter {
  private apiKey: string;
  private storeUrl: string;
  private username: string;
  private password: string;
  private sessionToken: string | null = null;

  constructor(config: OpenCartAdapterConfig) {
    if (!config.apiKey) {
      throw new Error('OpenCartAdapter requires an apiKey');
    }
    if (!config.storeUrl) {
      throw new Error('OpenCartAdapter requires a storeUrl');
    }
    if (!config.username) {
      throw new Error('OpenCartAdapter requires a username');
    }
    if (!config.password) {
      throw new Error('OpenCartAdapter requires a password');
    }
    this.apiKey = config.apiKey;
    this.storeUrl = config.storeUrl.replace(/\/$/, '');
    this.username = config.username;
    this.password = config.password;
  }

  private async getSessionToken(): Promise<string> {
    if (this.sessionToken) return this.sessionToken;

    const response = await fetch(`${this.storeUrl}/index.php?route=api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `key=${this.apiKey}&username=${this.username}&password=${this.password}`,
    });

    if (!response.ok) {
      throw new Error(`OpenCart login error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(`OpenCart authentication failed: ${data.error}`);
    }

    this.sessionToken = data.token;
    return this.sessionToken;
  }

  async fetchProducts(): Promise<Product[]> {
    const token = await this.getSessionToken();

    const response = await fetch(`${this.storeUrl}/index.php?route=api/product&token=${token}&limit=100`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`OpenCart API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.products?.map((product: any) => ({
      id: product.product_id,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price),
      currency: 'USD', // OpenCart typically uses USD, but could be configurable
      sku: product.sku || product.model,
      url: `${this.storeUrl}/index.php?route=product/product&product_id=${product.product_id}`,
      image_url: product.image ? `${this.storeUrl}/image/${product.image}` : undefined,
      stock_quantity: parseInt(product.quantity),
      categories: product.category_name ? [product.category_name] : [],
      brand: product.manufacturer,
      variants: product.options?.map((option: any) => ({
        id: option.product_option_id,
        name: option.name,
        price: parseFloat(product.price), // Simplified - actual variants would need separate handling
        sku: product.sku || product.model,
        stock: parseInt(product.quantity),
      })) || [],
    })) || [];
  }

  async fetchOrders(): Promise<Order[]> {
    const token = await this.getSessionToken();

    const response = await fetch(`${this.storeUrl}/index.php?route=api/order&token=${token}&limit=50`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`OpenCart API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.orders?.map((order: any) => ({
      id: order.order_id,
      status: order.status,
      total: parseFloat(order.total),
      currency: 'USD',
      created_at: order.date_added,
      updated_at: order.date_modified,
      customer_email: order.email,
      shipping_address: order.shipping_address ? {
        first_name: order.shipping_firstname,
        last_name: order.shipping_lastname,
        address1: order.shipping_address_1,
        address2: order.shipping_address_2,
        city: order.shipping_city,
        state: order.shipping_zone,
        zip: order.shipping_postcode,
        country: order.shipping_country,
      } : undefined,
      items: order.products?.map((item: any) => ({
        product_id: item.product_id,
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price),
        sku: item.sku || item.model,
        name: item.name,
      })) || [],
    })) || [];
  }
}