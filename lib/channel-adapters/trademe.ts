import { ChannelAdapter, Product, Order } from './types';

export interface TrademeAdapterConfig {
  consumerKey?: string;
  consumerSecret?: string;
  accessToken?: string;
  accessTokenSecret?: string;
}

export class TrademeAdapter implements ChannelAdapter {
  private consumerKey: string;
  private consumerSecret: string;
  private accessToken: string;
  private accessTokenSecret: string;

  constructor(config: TrademeAdapterConfig) {
    if (!config.consumerKey) {
      throw new Error('TrademeAdapter requires a consumerKey');
    }
    if (!config.consumerSecret) {
      throw new Error('TrademeAdapter requires a consumerSecret');
    }
    if (!config.accessToken) {
      throw new Error('TrademeAdapter requires an accessToken');
    }
    if (!config.accessTokenSecret) {
      throw new Error('TrademeAdapter requires an accessTokenSecret');
    }
    this.consumerKey = config.consumerKey;
    this.consumerSecret = config.consumerSecret;
    this.accessToken = config.accessToken;
    this.accessTokenSecret = config.accessTokenSecret;
  }

  async fetchProducts(): Promise<Product[]> {
    const response = await fetch('https://api.trademe.co.nz/v1/Listings.json?rows=50', {
      headers: {
        'Authorization': `OAuth oauth_consumer_key="${this.consumerKey}", oauth_token="${this.accessToken}", oauth_signature_method="PLAINTEXT", oauth_signature="${this.consumerSecret}&${this.accessTokenSecret}"`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Trade Me API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.List?.map((item: any) => ({
      id: item.ListingId.toString(),
      name: item.Title,
      description: item.Body || item.Title,
      price: parseFloat(item.StartPrice || item.BuyNowPrice || '0'),
      currency: 'NZD',
      sku: item.SKU || item.ListingId.toString(),
      url: `https://www.trademe.co.nz/a.aspx?id=${item.ListingId}`,
      image_url: item.PictureHref,
      stock_quantity: item.Quantity || 1,
      categories: item.CategoryName ? [item.CategoryName] : [],
      brand: item.Brand,
      variants: [], // Trade Me listings are typically single items
    })) || [];
  }

  async fetchOrders(): Promise<Order[]> {
    // Trade Me doesn't have a direct orders API for sellers in the same way
    // This would typically require using the member API or watching for sales
    const response = await fetch('https://api.trademe.co.nz/v1/MyTradeMe/SoldItems.json', {
      headers: {
        'Authorization': `OAuth oauth_consumer_key="${this.consumerKey}", oauth_token="${this.accessToken}", oauth_signature_method="PLAINTEXT", oauth_signature="${this.consumerSecret}&${this.accessTokenSecret}"`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Trade Me API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.List?.map((sale: any) => ({
      id: sale.SaleId?.toString() || sale.ListingId?.toString(),
      status: sale.Status || 'sold',
      total: parseFloat(sale.SalePrice || '0'),
      currency: 'NZD',
      created_at: sale.SaleDate,
      updated_at: sale.SaleDate,
      customer_email: '', // Trade Me doesn't expose buyer emails directly
      shipping_address: undefined, // Would need additional API calls
      items: [{
        product_id: sale.ListingId?.toString(),
        quantity: 1,
        price: parseFloat(sale.SalePrice || '0'),
        sku: sale.ListingId?.toString(),
        name: sale.Title,
      }],
    })) || [];
  }
}