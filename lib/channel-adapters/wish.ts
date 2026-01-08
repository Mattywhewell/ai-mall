// Wish adapter (supports API key authentication)
export class WishAdapter implements ChannelAdapter {
  constructor(private config: { accessToken?: string; merchantId?: string }) {
    if (!this.config.accessToken) {
      throw new Error('WishAdapter requires an accessToken');
    }
  }

  async fetchProducts(limit: number = 50, offset: number = 0): Promise<Product[]> {
    try {
      const response = await fetch(`https://merchant.wish.com/api/v2/product/multi-get?access_token=${this.config.accessToken}&limit=${limit}&start=${offset}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Wish fetchProducts failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Transform Wish product format to our standard format
      return (data.data || []).map((item: any) => ({
        id: item.Product.id || '',
        name: item.Product.name || '',
        description: item.Product.description || '',
        price: parseFloat(item.Product.price) || 0,
        currency: item.Product.currency_code || 'USD',
        sku: item.Product.parent_sku || '',
        image_url: item.Product.main_image || '',
        url: `https://www.wish.com/product/${item.Product.id}` || '',
        stock_quantity: item.Product.number_sold || 0, // Wish doesn't provide stock, using sold count as proxy
        category: item.Product.tags?.[0] || '',
        brand: item.Product.brand || '',
        variants: (item.Product.variants || []).map((v: any) => ({
          id: v.variant_id || '',
          name: v.size || v.color || '',
          price: parseFloat(v.price) || 0,
          sku: v.sku || '',
          stock_quantity: v.quantity || 0
        }))
      }));
    } catch (err) {
      console.error('WishAdapter.fetchProducts error', err);
      throw err;
    }
  }

  async fetchOrders(limit: number = 50, offset: number = 0): Promise<Order[]> {
    try {
      const response = await fetch(`https://merchant.wish.com/api/v2/order/multi-get?access_token=${this.config.accessToken}&limit=${limit}&start=${offset}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Wish fetchOrders failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Transform Wish order format to our standard format
      return (data.data || []).map((item: any) => ({
        id: item.Order.order_id || '',
        status: item.Order.state || 'unknown',
        total: parseFloat(item.Order.price) || 0,
        currency: item.Order.currency_code || 'USD',
        created_at: item.Order.order_time || new Date().toISOString(),
        updated_at: item.Order.last_updated || new Date().toISOString(),
        customer_email: '', // Wish doesn't provide customer email in merchant API
        shipping_address: item.Order.shipping_detail ? {
          street: item.Order.shipping_detail.street_address1 || '',
          city: item.Order.shipping_detail.city || '',
          state: item.Order.shipping_detail.state || '',
          postal_code: item.Order.shipping_detail.zipcode || '',
          country: item.Order.shipping_detail.country || ''
        } : undefined,
        items: (item.Order.OrderItem || []).map((orderItem: any) => ({
          product_id: orderItem.product_id || '',
          quantity: orderItem.quantity || 0,
          price: parseFloat(orderItem.price) || 0,
          sku: orderItem.product_variant?.sku || ''
        }))
      }));
    } catch (err) {
      console.error('WishAdapter.fetchOrders error', err);
      throw err;
    }
  }
}