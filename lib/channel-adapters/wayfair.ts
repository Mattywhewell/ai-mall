import { ChannelAdapter, Product, Order } from './types';

export interface WayfairAdapterConfig {
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
}

export class WayfairAdapter implements ChannelAdapter {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string;

  constructor(config: WayfairAdapterConfig) {
    if (!config.clientId) {
      throw new Error('WayfairAdapter requires a clientId');
    }
    if (!config.clientSecret) {
      throw new Error('WayfairAdapter requires a clientSecret');
    }
    if (!config.accessToken) {
      throw new Error('WayfairAdapter requires an accessToken');
    }
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.accessToken = this.accessToken;
  }

  async fetchProducts(): Promise<Product[]> {
    const response = await fetch('https://api.wayfair.com/v1/products', {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'X-Wayfair-Client-Id': this.clientId,
      },
    });

    if (!response.ok) {
      throw new Error(`Wayfair API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.products?.map((item: any) => ({
      id: item.product_id,
      name: item.name,
      description: item.description,
      price: parseFloat(item.price),
      currency: item.currency || 'USD',
      sku: item.supplier_part_number,
      url: item.product_url,
      image_url: item.image_url,
      stock_quantity: item.quantity_available,
      categories: item.category_hierarchy || [],
      brand: item.brand,
      variants: item.variants?.map((variant: any) => ({
        id: variant.variant_id,
        name: variant.variant_name,
        price: parseFloat(variant.price),
        sku: variant.supplier_part_number,
        stock: variant.quantity_available,
      })) || [],
    })) || [];
  }

  async fetchOrders(): Promise<Order[]> {
    const response = await fetch('https://api.wayfair.com/v1/orders', {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'X-Wayfair-Client-Id': this.clientId,
      },
    });

    if (!response.ok) {
      throw new Error(`Wayfair API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.orders?.map((order: any) => ({
      id: order.order_id,
      status: order.status,
      total: parseFloat(order.total_amount),
      currency: order.currency || 'USD',
      created_at: order.created_date,
      updated_at: order.last_modified_date,
      customer_email: order.customer_email,
      shipping_address: order.shipping_address ? {
        first_name: order.shipping_address.first_name,
        last_name: order.shipping_address.last_name,
        address1: order.shipping_address.address_line_1,
        address2: order.shipping_address.address_line_2,
        city: order.shipping_address.city,
        state: order.shipping_address.state,
        zip: order.shipping_address.postal_code,
        country: order.shipping_address.country,
      } : undefined,
      items: order.line_items?.map((item: any) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: parseFloat(item.unit_price),
        sku: item.supplier_part_number,
        name: item.product_name,
      })) || [],
    })) || [];
  }
}