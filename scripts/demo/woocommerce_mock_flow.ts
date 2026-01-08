import { WooCommerceAdapter } from '@/lib/channel-adapters/woocommerce';

async function run() {
  const adapter = new WooCommerceAdapter({ storeUrl: 'https://demo.example.com', consumerKey: 'CK', consumerSecret: 'CS' });
  const products = await adapter.fetchProducts();
  const orders = await adapter.fetchOrders();

  console.log('Products sample:', products.slice(0, 2));
  console.log('Orders sample:', orders.slice(0, 2));
}

run().catch(err => { console.error(err); process.exit(1); });
