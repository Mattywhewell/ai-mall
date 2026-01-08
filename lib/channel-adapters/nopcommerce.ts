import { ChannelAdapter, Product, Order } from './types';

export interface NopCommerceAdapterConfig {
  apiKey?: string;
  storeUrl?: string;
}

export class NopCommerceAdapter implements ChannelAdapter {
  private apiKey: string;
  private storeUrl: string;

  constructor(config: NopCommerceAdapterConfig) {
    if (!config.apiKey) {
      throw new Error('NopCommerceAdapter requires an apiKey');
    }
    if (!config.storeUrl) {
      throw new Error('NopCommerceAdapter requires a storeUrl');
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
      throw new Error(`nopCommerce API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data?.map((product: any) => ({
      id: product.Id.toString(),
      name: product.Name,
      description: product.ShortDescription || product.FullDescription,
      price: parseFloat(product.Price),
      currency: 'USD', // nopCommerce typically uses USD
      sku: product.Sku,
      url: `${this.storeUrl}/product/${product.SeName}`,
      image_url: product.DefaultPictureModel?.ImageUrl ? `${this.storeUrl}${product.DefaultPictureModel.ImageUrl}` : undefined,
      stock_quantity: product.StockQuantity,
      categories: product.CategoryModels?.map((cat: any) => cat.Name) || [],
      brand: product.ManufacturerModels?.[0]?.Name,
      variants: product.ProductAttributeModels?.map((attr: any) => ({
        id: attr.Id.toString(),
        name: attr.Name,
        price: parseFloat(product.Price), // Simplified
        sku: product.Sku,
        stock: product.StockQuantity,
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
      throw new Error(`nopCommerce API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data?.map((order: any) => ({
      id: order.Id.toString(),
      status: order.OrderStatus,
      total: parseFloat(order.OrderTotal),
      currency: 'USD',
      created_at: order.CreatedOnUtc,
      updated_at: order.UpdatedOnUtc,
      customer_email: order.CustomerEmail,
      shipping_address: order.ShippingAddress ? {
        first_name: order.ShippingAddress.FirstName,
        last_name: order.ShippingAddress.LastName,
        address1: order.ShippingAddress.Address1,
        address2: order.ShippingAddress.Address2,
        city: order.ShippingAddress.City,
        state: order.ShippingAddress.StateProvinceName,
        zip: order.ShippingAddress.ZipPostalCode,
        country: order.ShippingAddress.CountryName,
      } : undefined,
      items: order.OrderItems?.map((item: any) => ({
        product_id: item.ProductId?.toString(),
        quantity: item.Quantity,
        price: parseFloat(item.UnitPriceExclTax),
        sku: item.ProductSku,
        name: item.ProductName,
      })) || [],
    })) || [];
  }
}