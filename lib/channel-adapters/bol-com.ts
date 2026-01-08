import { ChannelAdapter, Product, Order } from './types';

export interface BolComAdapterConfig {
  clientId?: string;
  clientSecret?: string;
}

export class BolComAdapter implements ChannelAdapter {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;

  constructor(config: BolComAdapterConfig) {
    if (!config.clientId) {
      throw new Error('BolComAdapter requires a clientId');
    }
    if (!config.clientSecret) {
      throw new Error('BolComAdapter requires a clientSecret');
    }
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken) return this.accessToken;

    const response = await fetch('https://login.bol.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(`Bol.com auth error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    return this.accessToken;
  }

  async fetchProducts(): Promise<Product[]> {
    const token = await this.getAccessToken();

    const response = await fetch('https://api.bol.com/retailer/offers', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.retailer.v9+json',
      },
    });

    if (!response.ok) {
      throw new Error(`Bol.com API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.offers?.map((offer: any) => ({
      id: offer.ean || offer.id.toString(),
      name: offer.productTitle,
      description: offer.productTitle, // Bol.com doesn't provide full descriptions in offers
      price: parseFloat(offer.pricing?.bundlePrices?.[0]?.unitPrice || '0'),
      currency: 'EUR',
      sku: offer.ean,
      url: `https://www.bol.com/nl/p/${offer.productTitle.replace(/\s+/g, '-').toLowerCase()}/${offer.ean}`,
      image_url: undefined, // Would need separate product API call
      stock_quantity: offer.stock?.amount || 0,
      categories: offer.category?.name ? [offer.category.name] : [],
      brand: offer.brand?.name,
      variants: [], // Bol.com offers are typically single variants
    })) || [];
  }

  async fetchOrders(): Promise<Order[]> {
    const token = await this.getAccessToken();

    const response = await fetch('https://api.bol.com/retailer/orders', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.retailer.v9+json',
      },
    });

    if (!response.ok) {
      throw new Error(`Bol.com API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.orders?.map((order: any) => ({
      id: order.orderId,
      status: order.status,
      total: parseFloat(order.totalInclVat || '0'),
      currency: 'EUR',
      created_at: order.orderPlacedDateTime,
      updated_at: order.orderPlacedDateTime,
      customer_email: '', // Bol.com doesn't expose customer emails
      shipping_address: order.shipmentDetails?.[0]?.shipTo ? {
        first_name: order.shipmentDetails[0].shipTo.firstName,
        last_name: order.shipmentDetails[0].shipTo.surname,
        address1: order.shipmentDetails[0].shipTo.streetName + ' ' + (order.shipmentDetails[0].shipTo.houseNumber || ''),
        address2: order.shipmentDetails[0].shipTo.houseNumberExtension,
        city: order.shipmentDetails[0].shipTo.city,
        state: '',
        zip: order.shipmentDetails[0].shipTo.postalCode,
        country: order.shipmentDetails[0].shipTo.countryCode,
      } : undefined,
      items: order.orderItems?.map((item: any) => ({
        product_id: item.ean,
        quantity: item.quantity,
        price: parseFloat(item.unitPrice || '0'),
        sku: item.ean,
        name: item.productTitle,
      })) || [],
    })) || [];
  }
}