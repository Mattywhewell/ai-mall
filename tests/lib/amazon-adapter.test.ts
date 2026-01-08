import { AmazonAdapter } from '@/lib/channel-adapters/amazon';

const originalFetch = global.fetch;

afterEach(() => {
  (global as any).fetch = originalFetch;
});

test('AmazonAdapter.fetchOrders pagination with NextToken', async () => {
  let called = 0;
  (global as any).fetch = jest.fn().mockImplementation(async (url: string) => {
    called++;
    if (called === 1) return { ok: true, json: async () => ({ orders: new Array(50).fill(0).map((_, i) => ({ id: `A-${i}` })), NextToken: 'token1' }) };
    if (called === 2) return { ok: true, json: async () => ({ orders: new Array(5).fill(0).map((_, i) => ({ id: `A-${50 + i}` })) }) };
    return { ok: true, json: async () => ({ orders: [] }) };
  });

  const adapter = new AmazonAdapter({ accessToken: 'fake-token' });
  const orders = await adapter.fetchOrders(['ATVPDKIKX0DER']);
  expect(orders.length).toBe(55);
});

test('AmazonAdapter.fetchProducts pagination with NextToken', async () => {
  let called = 0;
  (global as any).fetch = jest.fn().mockImplementation(async (url: string) => {
    called++;
    if (called === 1) return { ok: true, json: async () => ({ items: new Array(50).fill(0).map((_, i) => ({ id: `P-${i}` })), NextToken: 'p1' }) };
    if (called === 2) return { ok: true, json: async () => ({ items: new Array(2).fill(0).map((_, i) => ({ id: `P-${50 + i}` })) }) };
    return { ok: true, json: async () => ({ items: [] }) };
  });

  const adapter = new AmazonAdapter({ accessToken: 'fake-token' });
  const products = await adapter.fetchProducts();
  expect(products.length).toBe(52);
});

test('AmazonAdapter retries on transient failure', async () => {
  let called = 0;
  (global as any).fetch = jest.fn().mockImplementation(async () => {
    called++;
    if (called < 3) return { ok: false, status: 500, text: async () => 'server error' };
    return { ok: true, json: async () => ({ orders: [{ id: 'A-1' }] }) };
  });

  const adapter = new AmazonAdapter({ accessToken: 'fake-token' });
  const orders = await adapter.fetchOrders();
  expect(orders.length).toBeGreaterThan(0);
  expect(called).toBeGreaterThanOrEqual(3);
});

test('AmazonAdapter uses SigV4 signing when accessKey/secretKey provided', async () => {
  const aws = await import('@/lib/awsSigV4');
  const spy = jest.spyOn(aws, 'signAwsRequest').mockReturnValue({ Authorization: 'Signed test', 'x-amz-date': '20200101T000000Z' } as any);

  (global as any).fetch = jest.fn().mockImplementation(async (url: string, opts: any) => {
    expect(opts.headers['Authorization']).toBe('Signed test');
    return { ok: true, json: async () => ({ items: [] }) };
  });

  const adapter = new AmazonAdapter({ accessKey: 'AK', secretKey: 'SK', sessionToken: 'ST' });
  const products = await adapter.fetchProducts();
  expect(spy).toHaveBeenCalled();
  expect(spy.mock.calls[0][0].sessionToken).toBe('ST');
  spy.mockRestore();
});