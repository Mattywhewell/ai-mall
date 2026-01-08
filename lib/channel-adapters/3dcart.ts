import { ChannelAdapter, Product, Order } from './types';

export interface ThreeDCartAdapterConfig {
  apiKey?: string;
  storeUrl?: string;
}

export class ThreeDCartAdapter implements ChannelAdapter {
  private apiKey: string;
  private storeUrl: string;

  constructor(config: ThreeDCartAdapterConfig) {
    if (!config.apiKey) {
      throw new Error('ThreeDCartAdapter requires an apiKey');
    }
    if (!config.storeUrl) {
      throw new Error('ThreeDCartAdapter requires a storeUrl');
    }
    this.apiKey = config.apiKey;
    this.storeUrl = config.storeUrl.replace(/\/$/, '');
  }

  async fetchProducts(): Promise<Product[]> {
    const response = await fetch(`${this.storeUrl}/api/v1/products?limit=100`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`3DCart API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data?.map((product: any) => ({
      id: product.catalogid.toString(),
      name: product.name,
      description: product.description,
      price: parseFloat(product.price),
      currency: product.currency || 'USD',
      sku: product.sku,
      url: `${this.storeUrl}/product.asp?itemid=${product.catalogid}`,
      image_url: product.thumbnail,
      stock_quantity: parseInt(product.stock),
      categories: product.categories?.map((cat: any) => cat.name) || [],
      brand: product.brand,
      variants: product.options?.map((option: any) => ({
        id: option.id.toString(),
        name: option.name,
        price: parseFloat(product.price), // Simplified
        sku: product.sku,
        stock: parseInt(product.stock),
      })) || [],
    })) || [];
  }

  async fetchOrders(): Promise<Order[]> {
    const response = await fetch(`${this.storeUrl}/api/v1/orders?limit=50`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`3DCart API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data?.map((order: any) => ({
      id: order.invoice.toString(),
      status: order.status,
      total: parseFloat(order.total),
      currency: order.currency || 'USD',
      created_at: order.date,
      updated_at: order.date,
      customer_email: order.customer?.email,
      shipping_address: order.shipping ? {
        first_name: order.shipping.firstname,
        last_name: order.shipping.lastname,
        address1: order.shipping.address,
        address2: order.shipping.address2,
        city: order.shipping.city,
        state: order.shipping.state,
        zip: order.shipping.zip,
        country: order.shipping.country,
      } : undefined,
      items: order.items?.map((item: any) => ({
        product_id: item.catalogid?.toString(),
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price),
        sku: item.sku,
        name: item.name,
      })) || [],
    })) || [];
  }
}