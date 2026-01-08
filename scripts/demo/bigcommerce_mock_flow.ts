import { BigCommerceAdapter } from '@/lib/channel-adapters/bigcommerce';

async function run() {
  const adapter = new BigCommerceAdapter({ accessToken: 'AT', storeHash: 'store123' });
  const products = await adapter.fetchProducts();
  const orders = await adapter.fetchOrders();

  console.log('Products sample:', products.slice(0, 2));
  console.log('Orders sample:', orders.slice(0, 2));
}

run().catch(err => { console.error(err); process.exit(1); });
