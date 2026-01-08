// Wix adapter (supports API key authentication)
export class WixAdapter implements ChannelAdapter {
  constructor(private config: { apiKey?: string; siteId?: string }) {
    if (!this.config.apiKey) {
      throw new Error('WixAdapter requires an apiKey');
    }
    if (!this.config.siteId) {
      throw new Error('WixAdapter requires a siteId');
    }
  }

  async fetchProducts(limit: number = 50, offset: number = 0): Promise<Product[]> {
    try {
      const response = await fetch(`https://www.wixapis.com/stores/v1/products/query?api_key=${this.config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.config.apiKey
        },
        body: JSON.stringify({
          query: {
            paging: {
              limit,
              offset
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Wix fetchProducts failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Transform Wix product format to our standard format
      return (data.products || []).map((item: any) => ({
        id: item.id || '',
        name: item.name || '',
        description: item.description || '',
        price: parseFloat(item.price?.price) || 0,
        currency: item.price?.currency || 'USD',
        sku: item.sku || '',
        image_url: item.media?.mainMedia?.image?.url || '',
        url: item.productPageUrl?.base || '',
        stock_quantity: item.stock?.quantity || 0,
        category: item.collectionIds?.[0] || '', // Would need to resolve collection name separately
        brand: item.brand || '',
        variants: (item.variants || []).map((v: any) => ({
          id: v.id || '',
          name: v.choices?.[0]?.description || '',
          price: parseFloat(v.price?.price) || 0,
          sku: v.sku || '',
          stock_quantity: v.stock?.quantity || 0
        }))
      }));
    } catch (err) {
      console.error('WixAdapter.fetchProducts error', err);
      throw err;
    }
  }

  async fetchOrders(limit: number = 50, offset: number = 0): Promise<Order[]> {
    try {
      const response = await fetch(`https://www.wixapis.com/stores/v1/orders/query?api_key=${this.config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.config.apiKey
        },
        body: JSON.stringify({
          query: {
            paging: {
              limit,
              offset
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Wix fetchOrders failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Transform Wix order format to our standard format
      return (data.orders || []).map((item: any) => ({
        id: item.id || '',
        status: item.status || 'unknown',
        total: parseFloat(item.priceSummary?.totalPrice?.amount) || 0,
        currency: item.priceSummary?.totalPrice?.currency || 'USD',
        created_at: item.createdDate || new Date().toISOString(),
        updated_at: item.updatedDate || new Date().toISOString(),
        customer_email: item.buyerInfo?.email || '',
        shipping_address: item.shippingInfo?.shippingDestination ? {
          street: item.shippingInfo.shippingDestination.address?.addressLine1 || '',
          city: item.shippingInfo.shippingDestination.address?.city || '',
          state: item.shippingInfo.shippingDestination.address?.subdivision || '',
          postal_code: item.shippingInfo.shippingDestination.address?.postalCode || '',
          country: item.shippingInfo.shippingDestination.address?.country || ''
        } : undefined,
        items: (item.lineItems || []).map((orderItem: any) => ({
          product_id: orderItem.productId || '',
          quantity: orderItem.quantity || 0,
          price: parseFloat(orderItem.price?.amount) || 0,
          sku: orderItem.sku || ''
        }))
      }));
    } catch (err) {
      console.error('WixAdapter.fetchOrders error', err);
      throw err;
    }
  }
}