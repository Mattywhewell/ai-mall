import { ChannelAdapter, Product, Order } from './types';

export interface FlipkartAdapterConfig {
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
}

export class FlipkartAdapter implements ChannelAdapter {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string;

  constructor(config: FlipkartAdapterConfig) {
    if (!config.clientId) {
      throw new Error('FlipkartAdapter requires a clientId');
    }
    if (!config.clientSecret) {
      throw new Error('FlipkartAdapter requires a clientSecret');
    }
    if (!config.accessToken) {
      throw new Error('FlipkartAdapter requires an accessToken');
    }
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.accessToken = config.accessToken;
  }

  async fetchProducts(): Promise<Product[]> {
    const response = await fetch('https://api.flipkart.net/sellers/listings/v2', {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'FK-App-Id': this.clientId,
      },
    });

    if (!response.ok) {
      throw new Error(`Flipkart API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.listings?.map((item: any) => ({
      id: item.listing_id,
      name: item.product_name,
      description: item.description,
      price: parseFloat(item.mrp),
      currency: 'INR',
      sku: item.sku_id,
      url: item.product_url,
      image_url: item.image_url,
      stock_quantity: item.available_quantity,
      categories: item.category ? [item.category] : [],
      brand: item.brand,
      variants: item.variants?.map((variant: any) => ({
        id: variant.variant_id,
        name: variant.variant_name,
        price: parseFloat(variant.price),
        sku: variant.sku_id,
        stock: variant.quantity,
      })) || [],
    })) || [];
  }

  async fetchOrders(): Promise<Order[]> {
    const response = await fetch('https://api.flipkart.net/sellers/orders/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'FK-App-Id': this.clientId,
      },
      body: JSON.stringify({
        pagination: {
          page: 1,
          size: 50
        },
        filters: {
          order_date: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 30 days
            end: new Date().toISOString().split('T')[0]
          }
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Flipkart API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.orders?.map((order: any) => ({
      id: order.order_id,
      status: order.order_status,
      total: parseFloat(order.order_total),
      currency: 'INR',
      created_at: order.order_date,
      updated_at: order.last_updated_date,
      customer_email: order.customer_details?.email,
      shipping_address: order.shipping_address ? {
        first_name: order.shipping_address.name,
        last_name: '',
        address1: order.shipping_address.address_line_1,
        address2: order.shipping_address.address_line_2,
        city: order.shipping_address.city,
        state: order.shipping_address.state,
        zip: order.shipping_address.pincode,
        country: 'IN',
      } : undefined,
      items: order.order_items?.map((item: any) => ({
        product_id: item.listing_id,
        quantity: item.quantity,
        price: parseFloat(item.price),
        sku: item.sku_id,
        name: item.product_name,
      })) || [],
    })) || [];
  }
}