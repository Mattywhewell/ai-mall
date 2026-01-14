import crypto from 'crypto';

export function computeHmacSignature(secret: string, body: string | Buffer) {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

export function verifyHmacSignature(secret: string, body: string | Buffer, signature: string) {
  if (!secret) return false;
  const expected = computeHmacSignature(secret, body);
  // Use time-safe compare
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function checkIpAllowlist(forwardedForHeader: string | null | undefined, allowlistRaw: string | undefined) {
  if (!allowlistRaw) return true; // No allowlist set

  const allowlist = allowlistRaw.split(',').map(s => s.trim()).filter(Boolean);
  if (allowlist.length === 0) return true;

  // forwardedForHeader may be 'ip, ip2', take first
  const clientIp = (forwardedForHeader || '').split(',')[0].trim();
  if (!clientIp) return false;

  // Exact match against allowlist entries (support basic IP matching)
  if (allowlist.includes(clientIp)) return true;

  // Support CIDR is out-of-scope; simple prefix match for e.g. 192.168.*
  for (const entry of allowlist) {
    if (entry.endsWith('*')) {
      const prefix = entry.slice(0, -1);
      if (clientIp.startsWith(prefix)) return true;
    }
  }

  return false;
}
