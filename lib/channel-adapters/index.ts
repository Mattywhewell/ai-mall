import { ChannelAdapter, ChannelConnectionRecord } from './types';
import { ShopifyAdapter } from './shopify';
import { EbayAdapter } from './ebay';
import { TikTokAdapter } from './tiktok';
import { AmazonAdapter } from './amazon';
import { MockAdapter } from './mock';
import { WooCommerceAdapter } from './woocommerce';
import { BigCommerceAdapter } from './bigcommerce';

export function createAdapter(connection: ChannelConnectionRecord): ChannelAdapter {
  switch (connection.channel_type) {
    case 'shopify':
      return new ShopifyAdapter({ shop: connection.channel_name || (connection.store_url || ''), accessToken: connection.access_token || '' });
    case 'ebay':
      return new EbayAdapter({ accessToken: connection.access_token || '', marketplaceId: connection.marketplace_id || undefined });
    case 'tiktok_shop':
      return new TikTokAdapter({ accessToken: connection.access_token || '', shopId: connection.store_id || undefined });
    case 'amazon':
      return new AmazonAdapter({ accessKey: connection.api_key || undefined, secretKey: connection.api_secret || undefined, sellerId: connection.store_id || undefined });
    case 'woocommerce':
      return new WooCommerceAdapter({ consumerKey: connection.api_key || undefined, consumerSecret: connection.api_secret || undefined, accessToken: connection.access_token || undefined, storeUrl: connection.store_url || undefined });
    case 'bigcommerce':
      return new BigCommerceAdapter({ accessToken: connection.access_token || undefined, storeHash: connection.store_id || undefined });
    case 'mock':
      return new MockAdapter({ storeName: connection.channel_name || connection.store_url || 'Mock Store' });
    default:
      throw new Error(`Unsupported channel type: ${connection.channel_type}`);
  }
}
