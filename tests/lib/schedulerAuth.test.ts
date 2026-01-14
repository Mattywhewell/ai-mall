import { computeHmacSignature, verifyHmacSignature, checkIpAllowlist } from '@/lib/security/schedulerAuth';

test('HMAC compute and verify', () => {
  const secret = 'mysecret';
  const body = 'hello-world';
  const sig = computeHmacSignature(secret, body);
  expect(sig).toBeDefined();
  expect(verifyHmacSignature(secret, body, sig)).toBe(true);
  expect(verifyHmacSignature('wrong', body, sig)).toBe(false);
});

test('IP allowlist checks', () => {
  expect(checkIpAllowlist('1.2.3.4', '1.2.3.4')).toBe(true);
  expect(checkIpAllowlist('192.168.0.12', '192.168.0.*')).toBe(true);
  expect(checkIpAllowlist('10.0.0.5', '192.168.0.*')).toBe(false);
});
