import { ChannelAdapter, Product, Order } from './types';

export interface PrestaShopAdapterConfig {
  apiKey?: string;
  storeUrl?: string;
}

export class PrestaShopAdapter implements ChannelAdapter {
  private apiKey: string;
  private storeUrl: string;

  constructor(config: PrestaShopAdapterConfig) {
    if (!config.apiKey) {
      throw new Error('PrestaShopAdapter requires an apiKey');
    }
    if (!config.storeUrl) {
      throw new Error('PrestaShopAdapter requires a storeUrl');
    }
    this.apiKey = config.apiKey;
    this.storeUrl = config.storeUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  async fetchProducts(): Promise<Product[]> {
    const response = await fetch(`${this.storeUrl}/api/products?display=[id,name,description,price,id_default_image,reference,quantity,manufacturer_name,id_category_default]&limit=100`, {
      headers: {
        'Authorization': `Basic ${btoa(`${this.apiKey}:`)}`,
        'Content-Type': 'application/xml',
      },
    });

    if (!response.ok) {
      throw new Error(`PrestaShop API error: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');
    const products = xmlDoc.querySelectorAll('product');

    return Array.from(products).map(product => {
      const id = product.querySelector('id')?.textContent || '';
      const name = product.querySelector('name > language')?.textContent || '';
      const description = product.querySelector('description > language')?.textContent || '';
      const price = product.querySelector('price')?.textContent || '0';
      const reference = product.querySelector('reference')?.textContent || '';
      const quantity = product.querySelector('quantity')?.textContent || '0';
      const manufacturer = product.querySelector('manufacturer_name')?.textContent || '';
      const imageId = product.querySelector('id_default_image')?.textContent || '';

      return {
        id,
        name,
        description,
        price: parseFloat(price),
        currency: 'EUR', // PrestaShop typically uses EUR, but this could be configurable
        sku: reference || id,
        url: `${this.storeUrl}/product.php?id_product=${id}`,
        image_url: imageId ? `${this.storeUrl}/api/images/products/${id}/${imageId}` : undefined,
        stock_quantity: parseInt(quantity),
        categories: [], // Would need separate API call to get categories
        brand: manufacturer,
        variants: [], // PrestaShop combinations would need separate handling
      };
    });
  }

  async fetchOrders(): Promise<Order[]> {
    const response = await fetch(`${this.storeUrl}/api/orders?display=[id,current_state,total_paid,currency,date_add,date_upd,id_customer,id_address_delivery]&limit=50`, {
      headers: {
        'Authorization': `Basic ${btoa(`${this.apiKey}:`)}`,
        'Content-Type': 'application/xml',
      },
    });

    if (!response.ok) {
      throw new Error(`PrestaShop API error: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');
    const orders = xmlDoc.querySelectorAll('order');

    return Array.from(orders).map(order => {
      const id = order.querySelector('id')?.textContent || '';
      const status = order.querySelector('current_state')?.textContent || '';
      const total = order.querySelector('total_paid')?.textContent || '0';
      const currency = order.querySelector('currency')?.textContent || 'EUR';
      const createdAt = order.querySelector('date_add')?.textContent || '';
      const updatedAt = order.querySelector('date_upd')?.textContent || '';

      return {
        id,
        status: this.mapOrderStatus(status),
        total: parseFloat(total),
        currency,
        created_at: createdAt,
        updated_at: updatedAt,
        customer_email: '', // Would need customer API call
        shipping_address: undefined, // Would need address API call
        items: [], // Would need order details API call
      };
    });
  }

  private mapOrderStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      '1': 'pending',
      '2': 'processing',
      '3': 'shipped',
      '4': 'delivered',
      '5': 'cancelled',
      '6': 'refunded',
    };
    return statusMap[status] || 'unknown';
  }
}