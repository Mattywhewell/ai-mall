import { ChannelAdapter, Product, Order } from './types';

export interface EtsyAdapterConfig {
  apiKey?: string;
  shopId?: string;
}

export class EtsyAdapter implements ChannelAdapter {
  private apiKey: string;
  private shopId: string;

  constructor(config: EtsyAdapterConfig) {
    if (!config.apiKey) {
      throw new Error('EtsyAdapter requires an apiKey');
    }
    if (!config.shopId) {
      throw new Error('EtsyAdapter requires a shopId');
    }
    this.apiKey = config.apiKey;
    this.shopId = config.shopId;
  }

  async fetchProducts(): Promise<Product[]> {
    const response = await fetch(`https://openapi.etsy.com/v3/application/shops/${this.shopId}/listings/active`, {
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Etsy API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.results.map((item: any) => ({
      id: item.listing_id.toString(),
      name: item.title,
      description: item.description,
      price: parseFloat(item.price.amount) / parseFloat(item.price.divisor),
      currency: item.price.currency_code,
      sku: item.sku?.[0] || item.listing_id.toString(),
      url: item.url,
      image_url: item.images?.[0]?.url_570xN,
      stock_quantity: item.quantity,
      categories: item.tags || [],
      brand: item.user_id?.toString(),
      variants: item.variations?.map((v: any) => ({
        id: v.property_id.toString(),
        name: v.formatted_name,
        price: parseFloat(v.price?.amount || item.price.amount) / parseFloat(v.price?.divisor || item.price.divisor),
        sku: v.sku || `${item.listing_id}-${v.property_id}`,
        stock: v.quantity || item.quantity,
      })) || [],
    }));
  }

  async fetchOrders(): Promise<Order[]> {
    const response = await fetch(`https://openapi.etsy.com/v3/application/shops/${this.shopId}/receipts`, {
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Etsy API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.results.map((receipt: any) => ({
      id: receipt.receipt_id.toString(),
      status: receipt.status,
      total: parseFloat(receipt.grandtotal.amount) / parseFloat(receipt.grandtotal.divisor),
      currency: receipt.grandtotal.currency_code,
      created_at: receipt.created_timestamp,
      updated_at: receipt.updated_timestamp,
      customer_email: receipt.buyer_email,
      shipping_address: {
        first_name: receipt.name,
        last_name: '',
        address1: receipt.first_line,
        address2: receipt.second_line,
        city: receipt.city,
        state: receipt.state,
        zip: receipt.zip,
        country: receipt.country_iso,
      },
      items: receipt.transactions?.map((transaction: any) => ({
        product_id: transaction.listing_id?.toString(),
        quantity: transaction.quantity,
        price: parseFloat(transaction.price.amount) / parseFloat(transaction.price.divisor),
        sku: transaction.sku || transaction.listing_id?.toString(),
        name: transaction.title,
      })) || [],
    }));
  }
}