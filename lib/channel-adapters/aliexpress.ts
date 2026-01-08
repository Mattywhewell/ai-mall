import { ChannelAdapter, Product, Order } from './types';

export interface AliExpressAdapterConfig {
  appKey?: string;
  appSecret?: string;
  accessToken?: string;
}

export class AliExpressAdapter implements ChannelAdapter {
  private appKey: string;
  private appSecret: string;
  private accessToken: string;

  constructor(config: AliExpressAdapterConfig) {
    if (!config.appKey) {
      throw new Error('AliExpressAdapter requires an appKey');
    }
    if (!config.appSecret) {
      throw new Error('AliExpressAdapter requires an appSecret');
    }
    if (!config.accessToken) {
      throw new Error('AliExpressAdapter requires an accessToken');
    }
    this.appKey = config.appKey;
    this.appSecret = config.appSecret;
    this.accessToken = config.accessToken;
  }

  async fetchProducts(): Promise<Product[]> {
    // AliExpress API requires specific signature generation
    const timestamp = Date.now();
    const method = 'aliexpress.logistics.buyer.freight.get'; // Using a basic method for demo

    const response = await fetch(`https://api-sg.aliexpress.com/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        app_key: this.appKey,
        access_token: this.accessToken,
        timestamp: timestamp.toString(),
        method: 'aliexpress.merchant.product.list',
        sign_method: 'md5',
        format: 'json',
        v: '2.0',
        // Note: In production, signature would need to be calculated
      }),
    });

    if (!response.ok) {
      throw new Error(`AliExpress API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Mock data structure for demonstration
    return (data.result?.products || []).map((item: any) => ({
      id: item.product_id?.toString(),
      name: item.subject,
      description: item.detail,
      price: parseFloat(item.price?.amount || '0'),
      currency: item.price?.currency || 'USD',
      sku: item.sku_code || item.product_id?.toString(),
      url: item.product_url,
      image_url: item.image_url,
      stock_quantity: item.quantity || 0,
      categories: item.category_name ? [item.category_name] : [],
      brand: item.brand_name,
      variants: item.sku_list?.map((sku: any) => ({
        id: sku.sku_id?.toString(),
        name: sku.property_value_definition_name,
        price: parseFloat(sku.price?.amount || item.price?.amount || '0'),
        sku: sku.sku_code,
        stock: sku.quantity || 0,
      })) || [],
    }));
  }

  async fetchOrders(): Promise<Order[]> {
    const timestamp = Date.now();

    const response = await fetch(`https://api-sg.aliexpress.com/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        app_key: this.appKey,
        access_token: this.accessToken,
        timestamp: timestamp.toString(),
        method: 'aliexpress.trade.seller.order.list',
        sign_method: 'md5',
        format: 'json',
        v: '2.0',
      }),
    });

    if (!response.ok) {
      throw new Error(`AliExpress API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return (data.result?.orders || []).map((order: any) => ({
      id: order.order_id?.toString(),
      status: order.order_status,
      total: parseFloat(order.total_amount?.amount || '0'),
      currency: order.total_amount?.currency || 'USD',
      created_at: order.gmt_create,
      updated_at: order.gmt_modified,
      customer_email: order.buyer_info?.email,
      shipping_address: order.delivery_address ? {
        first_name: order.delivery_address.contact_person,
        last_name: '',
        address1: order.delivery_address.address_line1,
        address2: order.delivery_address.address_line2,
        city: order.delivery_address.city,
        state: order.delivery_address.province,
        zip: order.delivery_address.postal_code,
        country: order.delivery_address.country_code,
      } : undefined,
      items: order.product_list?.map((item: any) => ({
        product_id: item.product_id?.toString(),
        quantity: item.quantity,
        price: parseFloat(item.price?.amount || '0'),
        sku: item.sku_code,
        name: item.product_name,
      })) || [],
    }));
  }
}