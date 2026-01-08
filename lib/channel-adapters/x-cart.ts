import { ChannelAdapter, Product, Order } from './types';

export interface XCartAdapterConfig {
  apiKey?: string;
  storeUrl?: string;
}

export class XCartAdapter implements ChannelAdapter {
  private apiKey: string;
  private storeUrl: string;

  constructor(config: XCartAdapterConfig) {
    if (!config.apiKey) {
      throw new Error('XCartAdapter requires an apiKey');
    }
    if (!config.storeUrl) {
      throw new Error('XCartAdapter requires a storeUrl');
    }
    this.apiKey = config.apiKey;
    this.storeUrl = config.storeUrl.replace(/\/$/, '');
  }

  async fetchProducts(): Promise<Product[]> {
    const response = await fetch(`${this.storeUrl}/api/products?limit=100`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`X-Cart API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.products?.map((product: any) => ({
      id: product.product_id.toString(),
      name: product.product_name,
      description: product.product_description || product.product_name,
      price: parseFloat(product.product_price),
      currency: product.currency || 'USD',
      sku: product.product_sku,
      url: `${this.storeUrl}/product/${product.product_clean_url}`,
      image_url: product.product_image ? `${this.storeUrl}${product.product_image}` : undefined,
      stock_quantity: parseInt(product.product_quantity),
      categories: product.categories?.map((cat: any) => cat.category_name) || [],
      brand: product.brand_name,
      variants: product.variants?.map((variant: any) => ({
        id: variant.variant_id.toString(),
        name: variant.variant_name,
        price: parseFloat(variant.variant_price),
        sku: variant.variant_sku,
        stock: parseInt(variant.variant_quantity),
      })) || [],
    })) || [];
  }

  async fetchOrders(): Promise<Order[]> {
    const response = await fetch(`${this.storeUrl}/api/orders?limit=50`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`X-Cart API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.orders?.map((order: any) => ({
      id: order.order_id.toString(),
      status: order.order_status,
      total: parseFloat(order.order_total),
      currency: order.currency || 'USD',
      created_at: order.order_date,
      updated_at: order.order_date,
      customer_email: order.customer_email,
      shipping_address: order.shipping_address ? {
        first_name: order.shipping_address.firstname,
        last_name: order.shipping_address.lastname,
        address1: order.shipping_address.address,
        address2: order.shipping_address.address2,
        city: order.shipping_address.city,
        state: order.shipping_address.state,
        zip: order.shipping_address.zipcode,
        country: order.shipping_address.country,
      } : undefined,
      items: order.items?.map((item: any) => ({
        product_id: item.product_id?.toString(),
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price),
        sku: item.sku,
        name: item.product_name,
      })) || [],
    })) || [];
  }
}