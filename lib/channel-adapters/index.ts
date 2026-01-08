import { ChannelAdapter, ChannelConnectionRecord } from './types';
import { ShopifyAdapter } from './shopify';
import { EbayAdapter } from './ebay';
import { TikTokAdapter } from './tiktok';
import { AmazonAdapter } from './amazon';
import { MockAdapter } from './mock';
import { WooCommerceAdapter } from './woocommerce';
import { BigCommerceAdapter } from './bigcommerce';
import { OnBuyAdapter } from './onbuy';
import { WishAdapter } from './wish';
import { EKMAdapter } from './ekm';
import { WixAdapter } from './wix';
import { EtsyAdapter } from './etsy';
import { FacebookShopsAdapter } from './facebook-shops';
import { MagentoAdapter } from './magento';
import { Magento2Adapter } from './magento2';
import { PrestaShopAdapter } from './prestashop';
import { AliExpressAdapter } from './aliexpress';
import { MercadoLibreAdapter } from './mercado-libre';
import { LazadaAdapter } from './lazada';
import { FlipkartAdapter } from './flipkart';
import { WayfairAdapter } from './wayfair';
import { ReverbAdapter } from './reverb';
import { BolComAdapter } from './bol-com';
import { GrouponAdapter } from './groupon';
import { TrademeAdapter } from './trademe';
import { OzonAdapter } from './ozon';
import { OpenCartAdapter } from './opencart';
import { NopCommerceAdapter } from './nopcommerce';
import { OSCommerceAdapter } from './oscommerce';
import { XCartAdapter } from './x-cart';
import { ZenCartAdapter } from './zencart';
import { ThreeDCartAdapter } from './3dcart';

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
    case 'onbuy':
      return new OnBuyAdapter({ apiKey: connection.api_key || undefined, siteId: connection.store_id || undefined });
    case 'wish':
      return new WishAdapter({ accessToken: connection.access_token || undefined, merchantId: connection.store_id || undefined });
    case 'ekm':
      return new EKMAdapter({ apiKey: connection.api_key || undefined, storeUrl: connection.store_url || undefined });
    case 'wix':
      return new WixAdapter({ apiKey: connection.api_key || undefined, siteId: connection.store_id || undefined });
    case 'etsy':
      return new EtsyAdapter({ apiKey: connection.api_key || undefined, shopId: connection.store_id || undefined });
    case 'facebook_shops':
      return new FacebookShopsAdapter({ accessToken: connection.access_token || undefined, catalogId: connection.store_id || undefined });
    case 'magento':
      return new MagentoAdapter({ consumerKey: connection.api_key || undefined, consumerSecret: connection.api_secret || undefined, accessToken: connection.access_token || undefined, accessTokenSecret: connection.api_secret || undefined, storeUrl: connection.store_url || undefined });
    case 'magento2':
      return new Magento2Adapter({ consumerKey: connection.api_key || undefined, consumerSecret: connection.api_secret || undefined, accessToken: connection.access_token || undefined, accessTokenSecret: connection.api_secret || undefined, storeUrl: connection.store_url || undefined });
    case 'prestashop':
      return new PrestaShopAdapter({ apiKey: connection.api_key || undefined, storeUrl: connection.store_url || undefined });
    case 'aliexpress':
      return new AliExpressAdapter({ appKey: connection.api_key || undefined, appSecret: connection.api_secret || undefined, accessToken: connection.access_token || undefined });
    case 'mercado_libre':
      return new MercadoLibreAdapter({ accessToken: connection.access_token || undefined, sellerId: connection.store_id || undefined });
    case 'lazada':
      return new LazadaAdapter({ appKey: connection.api_key || undefined, appSecret: connection.api_secret || undefined, accessToken: connection.access_token || undefined });
    case 'flipkart':
      return new FlipkartAdapter({ clientId: connection.api_key || undefined, clientSecret: connection.api_secret || undefined, accessToken: connection.access_token || undefined });
    case 'wayfair':
      return new WayfairAdapter({ clientId: connection.api_key || undefined, clientSecret: connection.api_secret || undefined, accessToken: connection.access_token || undefined });
    case 'reverb':
      return new ReverbAdapter({ accessToken: connection.access_token || undefined, refreshToken: connection.api_secret || undefined });
    case 'bol_com':
      return new BolComAdapter({ clientId: connection.api_key || undefined, clientSecret: connection.api_secret || undefined });
    case 'groupon':
      return new GrouponAdapter({ apiKey: connection.api_key || undefined, merchantId: connection.store_id || undefined });
    case 'trademe':
      return new TrademeAdapter({ consumerKey: connection.api_key || undefined, consumerSecret: connection.api_secret || undefined, accessToken: connection.access_token || undefined, accessTokenSecret: connection.api_secret || undefined });
    case 'ozon':
      return new OzonAdapter({ clientId: connection.api_key || undefined, apiKey: connection.access_token || undefined });
    case 'opencart':
      return new OpenCartAdapter({ apiKey: connection.api_key || undefined, storeUrl: connection.store_url || undefined, username: connection.channel_name || undefined, password: connection.api_secret || undefined });
    case 'nopcommerce':
      return new NopCommerceAdapter({ apiKey: connection.api_key || undefined, storeUrl: connection.store_url || undefined });
    case 'oscommerce':
      return new OSCommerceAdapter({ apiKey: connection.api_key || undefined, storeUrl: connection.store_url || undefined, username: connection.channel_name || undefined, password: connection.api_secret || undefined });
    case 'x_cart':
      return new XCartAdapter({ apiKey: connection.api_key || undefined, storeUrl: connection.store_url || undefined });
    case 'zencart':
      return new ZenCartAdapter({ apiKey: connection.api_key || undefined, storeUrl: connection.store_url || undefined, username: connection.channel_name || undefined, password: connection.api_secret || undefined });
    case '3dcart':
      return new ThreeDCartAdapter({ apiKey: connection.api_key || undefined, storeUrl: connection.store_url || undefined });
    case 'mock':
      return new MockAdapter({ storeName: connection.channel_name || connection.store_url || 'Mock Store' });
    default:
      throw new Error(`Unsupported channel type: ${connection.channel_type}`);
  }
}
