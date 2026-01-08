// EKM adapter (supports API key authentication)
export class EKMAdapter implements ChannelAdapter {
  constructor(private config: { apiKey?: string; storeUrl?: string }) {
    if (!this.config.apiKey) {
      throw new Error('EKMAdapter requires an apiKey');
    }
    if (!this.config.storeUrl) {
      throw new Error('EKMAdapter requires a storeUrl');
    }
  }

  private getBaseUrl(): string {
    // EKM API uses different endpoints for different operations
    return this.config.storeUrl!.replace(/\/$/, ''); // Remove trailing slash
  }

  async fetchProducts(limit: number = 50, offset: number = 0): Promise<Product[]> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/products?api_key=${this.config.apiKey}&limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`EKM fetchProducts failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Transform EKM product format to our standard format
      return (data.products || []).map((item: any) => ({
        id: item.id?.toString() || '',
        name: item.title || '',
        description: item.description || '',
        price: parseFloat(item.price) || 0,
        currency: item.currency || 'GBP',
        sku: item.sku || '',
        image_url: item.images?.[0]?.url || '',
        url: item.url || '',
        stock_quantity: item.stock_level || 0,
        category: item.category?.name || '',
        brand: item.brand?.name || '',
        variants: (item.variants || []).map((v: any) => ({
          id: v.id?.toString() || '',
          name: v.name || '',
          price: parseFloat(v.price) || 0,
          sku: v.sku || '',
          stock_quantity: v.stock_level || 0
        }))
      }));
    } catch (err) {
      console.error('EKMAdapter.fetchProducts error', err);
      throw err;
    }
  }

  async fetchOrders(limit: number = 50, offset: number = 0): Promise<Order[]> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/orders?api_key=${this.config.apiKey}&limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`EKM fetchOrders failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Transform EKM order format to our standard format
      return (data.orders || []).map((item: any) => ({
        id: item.id?.toString() || '',
        status: item.status || 'unknown',
        total: parseFloat(item.total) || 0,
        currency: item.currency || 'GBP',
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString(),
        customer_email: item.customer?.email || '',
        shipping_address: item.shipping_address ? {
          street: item.shipping_address.line1 || '',
          city: item.shipping_address.city || '',
          state: item.shipping_address.county || '',
          postal_code: item.shipping_address.postcode || '',
          country: item.shipping_address.country || ''
        } : undefined,
        items: (item.items || []).map((orderItem: any) => ({
          product_id: orderItem.product_id?.toString() || '',
          quantity: orderItem.quantity || 0,
          price: parseFloat(orderItem.price) || 0,
          sku: orderItem.sku || ''
        }))
      }));
    } catch (err) {
      console.error('EKMAdapter.fetchOrders error', err);
      throw err;
    }
  }
}