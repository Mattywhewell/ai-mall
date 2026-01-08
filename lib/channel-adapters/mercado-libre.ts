import { ChannelAdapter, Product, Order } from './types';

export interface MercadoLibreAdapterConfig {
  accessToken?: string;
  sellerId?: string;
}

export class MercadoLibreAdapter implements ChannelAdapter {
  private accessToken: string;
  private sellerId: string;

  constructor(config: MercadoLibreAdapterConfig) {
    if (!config.accessToken) {
      throw new Error('MercadoLibreAdapter requires an accessToken');
    }
    if (!config.sellerId) {
      throw new Error('MercadoLibreAdapter requires a sellerId');
    }
    this.accessToken = config.accessToken;
    this.sellerId = config.sellerId;
  }

  async fetchProducts(): Promise<Product[]> {
    const response = await fetch(`https://api.mercadolibre.com/users/${this.sellerId}/items/search?status=active&limit=50`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Mercado Libre API error: ${response.status} ${response.statusText}`);
    }

    const searchData = await response.json();

    // Fetch detailed product information
    const productPromises = searchData.results.map(async (itemId: string) => {
      const itemResponse = await fetch(`https://api.mercadolibre.com/items/${itemId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!itemResponse.ok) return null;

      const item = await itemResponse.json();
      return {
        id: item.id,
        name: item.title,
        description: item.description || item.title,
        price: parseFloat(item.price),
        currency: item.currency_id,
        sku: item.seller_custom_field || item.id,
        url: item.permalink,
        image_url: item.pictures?.[0]?.url,
        stock_quantity: item.available_quantity,
        categories: item.category_id ? [item.category_id] : [],
        brand: item.attributes?.find((attr: any) => attr.id === 'BRAND')?.value_name,
        variants: item.variations?.map((variation: any) => ({
          id: variation.id.toString(),
          name: variation.attribute_combinations?.map((combo: any) => combo.value_name).join(' - ') || variation.id,
          price: parseFloat(variation.price),
          sku: variation.seller_custom_field || variation.id.toString(),
          stock: variation.available_quantity,
        })) || [],
      };
    });

    const products = await Promise.all(productPromises);
    return products.filter(product => product !== null);
  }

  async fetchOrders(): Promise<Order[]> {
    const response = await fetch(`https://api.mercadolibre.com/orders/search?seller=${this.sellerId}&limit=50`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Mercado Libre API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.results.map((order: any) => ({
      id: order.id.toString(),
      status: order.status,
      total: parseFloat(order.total_amount),
      currency: order.currency_id,
      created_at: order.date_created,
      updated_at: order.date_closed || order.last_updated,
      customer_email: order.buyer?.email,
      shipping_address: order.shipping?.receiver_address ? {
        first_name: order.shipping.receiver_address.receiver_name?.split(' ')[0] || '',
        last_name: order.shipping.receiver_address.receiver_name?.split(' ').slice(1).join(' ') || '',
        address1: order.shipping.receiver_address.address_line,
        address2: order.shipping.receiver_address.comment,
        city: order.shipping.receiver_address.city?.name,
        state: order.shipping.receiver_address.state?.name,
        zip: order.shipping.receiver_address.zip_code,
        country: order.shipping.receiver_address.country?.id,
      } : undefined,
      items: order.order_items?.map((item: any) => ({
        product_id: item.item?.id,
        quantity: item.quantity,
        price: parseFloat(item.unit_price),
        sku: item.item?.seller_custom_field || item.item?.id,
        name: item.item?.title,
      })) || [],
    }));
  }
}