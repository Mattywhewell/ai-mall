import { encryptText, decryptText } from '@/lib/encryption';

test('encrypt/decrypt roundtrip', () => {
  const plaintext = 'my-secret-token-123';
  const encrypted = encryptText(plaintext);
  const decrypted = decryptText(encrypted);
  expect(decrypted).toBe(plaintext);
});
