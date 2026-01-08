import { exchangeLwaRefreshToken } from '@/lib/amazonAuth';

const originalFetch = global.fetch;

afterEach(() => { (global as any).fetch = originalFetch; });

test('exchangeLwaRefreshToken returns access token data', async () => {
  (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ access_token: 'AT-123', expires_in: 3600 }) });
  process.env.AMAZON_LWA_CLIENT_ID = 'client';
  process.env.AMAZON_LWA_CLIENT_SECRET = 'secret';

  const data = await exchangeLwaRefreshToken('refresh-123');
  expect(data.accessToken).toBe('AT-123');
});