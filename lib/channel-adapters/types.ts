export interface ChannelConnectionRecord {
  id: string;
  seller_id: string;
  channel_type: string;
  channel_name: string;
  store_url?: string;
  api_key?: string;
  api_secret?: string;
  access_token?: string;
}

export interface ChannelAdapter {
  fetchProducts(): Promise<any[]>;
  fetchOrders(): Promise<any[]>;
  // pushInventory? pushPrice? etc. to be added as needed
}
