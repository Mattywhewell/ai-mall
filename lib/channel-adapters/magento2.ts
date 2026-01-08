import { ChannelAdapter, Product, Order } from './types';

export interface Magento2AdapterConfig {
  consumerKey?: string;
  consumerSecret?: string;
  accessToken?: string;
  accessTokenSecret?: string;
  storeUrl?: string;
}

export class Magento2Adapter implements ChannelAdapter {
  private consumerKey: string;
  private consumerSecret: string;
  private accessToken: string;
  private accessTokenSecret: string;
  private storeUrl: string;

  constructor(config: Magento2AdapterConfig) {
    if (!config.consumerKey || !config.consumerSecret) {
      throw new Error('Magento2Adapter requires consumerKey and consumerSecret');
    }
    if (!config.accessToken || !config.accessTokenSecret) {
      throw new Error('Magento2Adapter requires accessToken and accessTokenSecret');
    }
    if (!config.storeUrl) {
      throw new Error('Magento2Adapter requires a storeUrl');
    }
    this.consumerKey = config.consumerKey;
    this.consumerSecret = config.consumerSecret;
    this.accessToken = config.accessToken;
    this.accessTokenSecret = config.accessTokenSecret;
    this.storeUrl = config.storeUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  async fetchProducts(): Promise<Product[]> {
    const response = await fetch(`${this.storeUrl}/rest/V1/products?searchCriteria[pageSize]=100&searchCriteria[currentPage]=1`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Magento 2 API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.items.map((item: any) => ({
      id: item.id.toString(),
      name: item.name,
      description: item.description?.[0]?.html || item.description,
      price: parseFloat(item.price),
      currency: item.currency || 'USD',
      sku: item.sku,
      url: item.custom_attributes?.find((attr: any) => attr.attribute_code === 'url_key')?.value ?
           `${this.storeUrl}/${item.custom_attributes.find((attr: any) => attr.attribute_code === 'url_key').value}` :
           `${this.storeUrl}/catalog/product/view/id/${item.id}`,
      image_url: item.media_gallery_entries?.[0]?.file ? `${this.storeUrl}/media/catalog/product${item.media_gallery_entries[0].file}` : undefined,
      stock_quantity: item.extension_attributes?.stock_item?.qty || 0,
      categories: item.category_ids || [],
      brand: item.custom_attributes?.find((attr: any) => attr.attribute_code === 'manufacturer')?.value,
      variants: item.configurable_product_options?.map((option: any) => ({
        id: option.id.toString(),
        name: option.label,
        price: parseFloat(item.price),
        sku: item.sku,
        stock: item.extension_attributes?.stock_item?.qty || 0,
      })) || [],
    }));
  }

  async fetchOrders(): Promise<Order[]> {
    const response = await fetch(`${this.storeUrl}/rest/V1/orders?searchCriteria[pageSize]=50&searchCriteria[currentPage]=1`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Magento 2 API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.items.map((order: any) => ({
      id: order.increment_id,
      status: order.status,
      total: parseFloat(order.grand_total),
      currency: order.order_currency_code,
      created_at: order.created_at,
      updated_at: order.updated_at,
      customer_email: order.customer_email,
      shipping_address: order.extension_attributes?.shipping_assignments?.[0]?.shipping?.address ? {
        first_name: order.extension_attributes.shipping_assignments[0].shipping.address.firstname,
        last_name: order.extension_attributes.shipping_assignments[0].shipping.address.lastname,
        address1: order.extension_attributes.shipping_assignments[0].shipping.address.street[0],
        address2: order.extension_attributes.shipping_assignments[0].shipping.address.street[1],
        city: order.extension_attributes.shipping_assignments[0].shipping.address.city,
        state: order.extension_attributes.shipping_assignments[0].shipping.address.region?.region,
        zip: order.extension_attributes.shipping_assignments[0].shipping.address.postcode,
        country: order.extension_attributes.shipping_assignments[0].shipping.address.country_id,
      } : undefined,
      items: order.items?.map((item: any) => ({
        product_id: item.product_id?.toString(),
        quantity: item.qty_ordered,
        price: parseFloat(item.price),
        sku: item.sku,
        name: item.name,
      })) || [],
    }));
  }
}