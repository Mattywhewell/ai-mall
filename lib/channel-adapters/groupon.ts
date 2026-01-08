import { ChannelAdapter, Product, Order } from './types';

export interface GrouponAdapterConfig {
  apiKey?: string;
  merchantId?: string;
}

export class GrouponAdapter implements ChannelAdapter {
  private apiKey: string;
  private merchantId: string;

  constructor(config: GrouponAdapterConfig) {
    if (!config.apiKey) {
      throw new Error('GrouponAdapter requires an apiKey');
    }
    if (!config.merchantId) {
      throw new Error('GrouponAdapter requires a merchantId');
    }
    this.apiKey = config.apiKey;
    this.merchantId = config.merchantId;
  }

  async fetchProducts(): Promise<Product[]> {
    const response = await fetch(`https://partner-api.groupon.com/deals.json?merchant_id=${this.merchantId}&limit=50`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Groupon API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.deals?.map((deal: any) => ({
      id: deal.id.toString(),
      name: deal.title,
      description: deal.highlightsHtml || deal.description,
      price: parseFloat(deal.price?.amount || '0'),
      currency: deal.price?.currency_code || 'USD',
      sku: deal.uuid,
      url: deal.dealUrl,
      image_url: deal.grid4ImageUrl,
      stock_quantity: deal.quantity || 999, // Groupon deals often have unlimited stock
      categories: deal.division?.name ? [deal.division.name] : [],
      brand: deal.merchant?.name,
      variants: [], // Groupon deals are typically single offerings
    })) || [];
  }

  async fetchOrders(): Promise<Order[]> {
    const response = await fetch(`https://partner-api.groupon.com/orders.json?merchant_id=${this.merchantId}&limit=50`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Groupon API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.orders?.map((order: any) => ({
      id: order.id.toString(),
      status: order.status,
      total: parseFloat(order.total?.amount || '0'),
      currency: order.total?.currency_code || 'USD',
      created_at: order.created,
      updated_at: order.updated,
      customer_email: order.customer?.email,
      shipping_address: order.delivery_address ? {
        first_name: order.delivery_address.first_name,
        last_name: order.delivery_address.last_name,
        address1: order.delivery_address.address1,
        address2: order.delivery_address.address2,
        city: order.delivery_address.city,
        state: order.delivery_address.state,
        zip: order.delivery_address.zip,
        country: order.delivery_address.country,
      } : undefined,
      items: order.line_items?.map((item: any) => ({
        product_id: item.deal_id?.toString(),
        quantity: item.quantity,
        price: parseFloat(item.unit_price?.amount || '0'),
        sku: item.deal_uuid,
        name: item.deal_title,
      })) || [],
    })) || [];
  }
}