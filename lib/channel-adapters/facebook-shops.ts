import { ChannelAdapter, Product, Order } from './types';

export interface FacebookShopsAdapterConfig {
  accessToken?: string;
  catalogId?: string;
}

export class FacebookShopsAdapter implements ChannelAdapter {
  private accessToken: string;
  private catalogId: string;

  constructor(config: FacebookShopsAdapterConfig) {
    if (!config.accessToken) {
      throw new Error('FacebookShopsAdapter requires an accessToken');
    }
    if (!config.catalogId) {
      throw new Error('FacebookShopsAdapter requires a catalogId');
    }
    this.accessToken = config.accessToken;
    this.catalogId = config.catalogId;
  }

  async fetchProducts(): Promise<Product[]> {
    const response = await fetch(`https://graph.facebook.com/v18.0/${this.catalogId}/products?access_token=${this.accessToken}&fields=id,name,description,price,availability,currency,image_url,url,category,brand,retailer_product_group_id,variants`);

    if (!response.ok) {
      throw new Error(`Facebook Shops API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: parseFloat(item.price?.amount || '0'),
      currency: item.price?.currency,
      sku: item.retailer_product_group_id || item.id,
      url: item.url,
      image_url: item.image_url,
      stock_quantity: item.availability === 'in stock' ? 999 : 0,
      categories: item.category ? [item.category] : [],
      brand: item.brand,
      variants: item.variants?.data?.map((v: any) => ({
        id: v.id,
        name: v.name,
        price: parseFloat(v.price?.amount || item.price?.amount || '0'),
        sku: v.retailer_product_group_id || v.id,
        stock: v.availability === 'in stock' ? 999 : 0,
      })) || [],
    }));
  }

  async fetchOrders(): Promise<Order[]> {
    // Facebook Shops orders are accessed through Business Manager API
    const response = await fetch(`https://graph.facebook.com/v18.0/me/orders?access_token=${this.accessToken}&fields=id,status,total_amount,currency,created_time,updated_time,shipping_address,buyer_details,line_items`);

    if (!response.ok) {
      throw new Error(`Facebook Shops API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.map((order: any) => ({
      id: order.id,
      status: order.status,
      total: parseFloat(order.total_amount?.amount || '0'),
      currency: order.total_amount?.currency,
      created_at: order.created_time,
      updated_at: order.updated_time,
      customer_email: order.buyer_details?.email,
      shipping_address: order.shipping_address ? {
        first_name: order.shipping_address.first_name,
        last_name: order.shipping_address.last_name,
        address1: order.shipping_address.street1,
        address2: order.shipping_address.street2,
        city: order.shipping_address.city,
        state: order.shipping_address.state,
        zip: order.shipping_address.postal_code,
        country: order.shipping_address.country,
      } : undefined,
      items: order.line_items?.data?.map((item: any) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: parseFloat(item.price?.amount || '0'),
        sku: item.retailer_id,
        name: item.name,
      })) || [],
    }));
  }
}