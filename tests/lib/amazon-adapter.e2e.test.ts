import http from 'http';
import { AmazonAdapter } from '@/lib/channel-adapters/amazon';

// Note: this is an e2e-style test that starts a local mock server and verifies
// the adapter's signed request includes AWS SigV4 headers (Authorization, x-amz-date)

describe('AmazonAdapter e2e (mock SP-API)', () => {
  let server: http.Server;
  let port: number;

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      const headers = Object.fromEntries(Object.entries(req.headers || {}).map(([k, v]) => [k.toLowerCase(), v]));
      const hasAuth = !!headers['authorization'];
      const hasDate = !!headers['x-amz-date'];
      const hasSession = !!headers['x-amz-security-token'] || !!headers['x-amz-access-token'];

      // For catalog/items path, return a small items payload
      if (req.url && req.url.startsWith('/catalog/2020-12-01/items')) {
        res.setHeader('content-type', 'application/json');
        res.statusCode = (hasAuth && hasDate) ? 200 : 400;
        res.end(JSON.stringify({ items: [{ id: 'P-1' }], received: { authorization: !!headers['authorization'], xAmzDate: !!headers['x-amz-date'], sessionToken: hasSession } }));
        return;
      }

      // For orders path, return small orders payload
      if (req.url && req.url.startsWith('/orders/v0/orders')) {
        res.setHeader('content-type', 'application/json');
        res.statusCode = (hasAuth && hasDate) ? 200 : 400;
        res.end(JSON.stringify({ orders: [{ id: 'O-1' }], received: { authorization: !!headers['authorization'], xAmzDate: !!headers['x-amz-date'], sessionToken: hasSession } }));
        return;
      }

      res.statusCode = 404;
      res.end('not found');
    });

    await new Promise<void>((resolve, reject) => {
      server.listen(0, '127.0.0.1', () => resolve());
      server.on('error', reject);
    });

    const addr = server.address();
    if (!addr || typeof addr === 'string') throw new Error('failed to start mock server');
    port = addr.port;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  test('fetchProducts sends signed headers', async () => {
    const baseUrl = `http://127.0.0.1:${port}`;
    const adapter = new AmazonAdapter({ accessKey: 'AK', secretKey: 'SK', sessionToken: 'ST', baseUrl });

    const products = await adapter.fetchProducts();
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBe(1);
  });

  test('fetchOrders sends signed headers', async () => {
    const baseUrl = `http://127.0.0.1:${port}`;
    const adapter = new AmazonAdapter({ accessKey: 'AK', secretKey: 'SK', sessionToken: 'ST', baseUrl });

    const orders = await adapter.fetchOrders();
    expect(Array.isArray(orders)).toBe(true);
    expect(orders.length).toBe(1);
  });
});
