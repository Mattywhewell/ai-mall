import { ChannelAdapter, Product, Order } from './types';

export interface OSCommerceAdapterConfig {
  apiKey?: string;
  storeUrl?: string;
  username?: string;
  password?: string;
}

export class OSCommerceAdapter implements ChannelAdapter {
  private apiKey: string;
  private storeUrl: string;
  private username: string;
  private password: string;

  constructor(config: OSCommerceAdapterConfig) {
    if (!config.apiKey) {
      throw new Error('OSCommerceAdapter requires an apiKey');
    }
    if (!config.storeUrl) {
      throw new Error('OSCommerceAdapter requires a storeUrl');
    }
    if (!config.username) {
      throw new Error('OSCommerceAdapter requires a username');
    }
    if (!config.password) {
      throw new Error('OSCommerceAdapter requires a password');
    }
    this.apiKey = config.apiKey;
    this.storeUrl = config.storeUrl.replace(/\/$/, '');
    this.username = config.username;
    this.password = config.password;
  }

  async fetchProducts(): Promise<Product[]> {
    // OSCommerce typically uses database access or custom API endpoints
    // This is a simplified implementation assuming a REST API extension
    const response = await fetch(`${this.storeUrl}/api/products.php?limit=100`, {
      headers: {
        'Authorization': `Basic ${btoa(`${this.username}:${this.password}`)}`,
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`OSCommerce API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.products?.map((product: any) => ({
      id: product.products_id,
      name: product.products_name,
      description: product.products_description,
      price: parseFloat(product.products_price),
      currency: 'USD', // OSCommerce typically uses USD
      sku: product.products_model,
      url: `${this.storeUrl}/product_info.php?products_id=${product.products_id}`,
      image_url: product.products_image ? `${this.storeUrl}/images/${product.products_image}` : undefined,
      stock_quantity: parseInt(product.products_quantity),
      categories: product.categories_name ? [product.categories_name] : [],
      brand: product.manufacturers_name,
      variants: [], // OSCommerce typically doesn't have built-in variants
    })) || [];
  }

  async fetchOrders(): Promise<Order[]> {
    const response = await fetch(`${this.storeUrl}/api/orders.php?limit=50`, {
      headers: {
        'Authorization': `Basic ${btoa(`${this.username}:${this.password}`)}`,
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`OSCommerce API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.orders?.map((order: any) => ({
      id: order.orders_id,
      status: order.orders_status_name,
      total: parseFloat(order.order_total),
      currency: 'USD',
      created_at: order.date_purchased,
      updated_at: order.last_modified,
      customer_email: order.customers_email_address,
      shipping_address: order.delivery ? {
        first_name: order.delivery_name.split(' ')[0],
        last_name: order.delivery_name.split(' ').slice(1).join(' '),
        address1: order.delivery_street_address,
        address2: order.delivery_suburb,
        city: order.delivery_city,
        state: order.delivery_state,
        zip: order.delivery_postcode,
        country: order.delivery_country,
      } : undefined,
      items: order.products?.map((item: any) => ({
        product_id: item.products_id,
        quantity: parseInt(item.products_quantity),
        price: parseFloat(item.products_price),
        sku: item.products_model,
        name: item.products_name,
      })) || [],
    })) || [];
  }
}