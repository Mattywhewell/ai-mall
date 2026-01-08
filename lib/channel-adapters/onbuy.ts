// OnBuy adapter (supports API key authentication)
export class OnBuyAdapter implements ChannelAdapter {
  constructor(private config: { apiKey?: string; siteId?: string }) {
    if (!this.config.apiKey) {
      throw new Error('OnBuyAdapter requires an apiKey');
    }
  }

  async fetchProducts(limit: number = 50, offset: number = 0): Promise<Product[]> {
    try {
      const response = await fetch(`https://api.onbuy.com/v2/products?site_id=${this.config.siteId || 2000}&limit=${limit}&offset=${offset}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`OnBuy fetchProducts failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Transform OnBuy product format to our standard format
      return (data.results || []).map((item: any) => ({
        id: item.product_id?.toString() || '',
        name: item.name || '',
        description: item.description || '',
        price: parseFloat(item.price?.current_price) || 0,
        currency: item.price?.currency || 'GBP',
        sku: item.sku || '',
        image_url: item.images?.[0]?.url || '',
        url: item.product_url || '',
        stock_quantity: item.stock?.quantity || 0,
        category: item.category?.name || '',
        brand: item.brand?.name || '',
        variants: (item.variations || []).map((v: any) => ({
          id: v.variation_id?.toString() || '',
          name: v.name || '',
          price: parseFloat(v.price?.current_price) || 0,
          sku: v.sku || '',
          stock_quantity: v.stock?.quantity || 0
        }))
      }));
    } catch (err) {
      console.error('OnBuyAdapter.fetchProducts error', err);
      throw err;
    }
  }

  async fetchOrders(limit: number = 50, offset: number = 0): Promise<Order[]> {
    try {
      const response = await fetch(`https://api.onbuy.com/v2/orders?site_id=${this.config.siteId || 2000}&limit=${limit}&offset=${offset}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`OnBuy fetchOrders failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Transform OnBuy order format to our standard format
      return (data.results || []).map((item: any) => ({
        id: item.order_id?.toString() || '',
        status: item.status || 'unknown',
        total: parseFloat(item.total) || 0,
        currency: item.currency || 'GBP',
        created_at: item.date_added || new Date().toISOString(),
        updated_at: item.date_updated || new Date().toISOString(),
        customer_email: item.customer?.email || '',
        shipping_address: item.delivery_address ? {
          street: item.delivery_address.address_line_1 || '',
          city: item.delivery_address.town_city || '',
          state: item.delivery_address.county || '',
          postal_code: item.delivery_address.postcode || '',
          country: item.delivery_address.country || ''
        } : undefined,
        items: (item.order_items || []).map((orderItem: any) => ({
          product_id: orderItem.product_id?.toString() || '',
          quantity: orderItem.quantity || 0,
          price: parseFloat(orderItem.price) || 0,
          sku: orderItem.sku || ''
        }))
      }));
    } catch (err) {
      console.error('OnBuyAdapter.fetchOrders error', err);
      throw err;
    }
  }
}