import { verifyShopifyWebhook } from '@/lib/shopifyWebhook';
import crypto from 'crypto';

test('verifyShopifyWebhook returns true for valid signature', () => {
  const secret = 'testsecret';
  const payload = JSON.stringify({ id: 123, name: 'Order 123' });
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('base64');
  expect(verifyShopifyWebhook(payload, hmac, secret)).toBe(true);
});

test('verifyShopifyWebhook returns false for invalid signature', () => {
  const secret = 'testsecret';
  const payload = JSON.stringify({ id: 123 });
  const badHmac = 'invalidhmac';
  expect(verifyShopifyWebhook(payload, badHmac, secret)).toBe(false);
});
