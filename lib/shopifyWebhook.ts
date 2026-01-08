import crypto from 'crypto';

export function verifyShopifyWebhook(rawBody: string | Buffer, hmacHeader: string, secret: string) {
  if (!hmacHeader || !secret) return false;
  const hmac = crypto.createHmac('sha256', secret).update(typeof rawBody === 'string' ? rawBody : rawBody).digest('base64');
  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(hmacHeader));
  } catch (err) {
    return false;
  }
}
