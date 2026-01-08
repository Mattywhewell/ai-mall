import assert from 'assert';
import { signAwsRequest, buildCanonicalQuery } from '@/lib/awsSigV4';

function run() {
  const url = 'https://example.amazonaws.com/path?b=2&a=1&c=foo bar&z=!\'()*';
  const now = new Date('2020-01-01T00:00:00Z');

  const res: any = signAwsRequest({ method: 'GET', url, accessKey: 'AKIA_TEST', secretKey: 'SECRET', region: 'us-east-1', service: 'execute-api', now, debug: true, unsignedPayload: true });

  assert(res, 'no result from signAwsRequest');
  assert(res.headers, 'no headers returned');
  const auth = res.headers.Authorization as string;
  assert(/AWS4-HMAC-SHA256 Credential=AKIA_TEST\/[0-9]{8}\/us-east-1\/execute-api\/aws4_request/.test(auth), 'credential scope not present');
  assert(/SignedHeaders=[^,]+,/.test(auth), 'signed headers not present');
  assert(/Signature=[0-9a-f]{64}$/i.test(auth), 'signature not hex');

  const expectedCanonicalQuery = buildCanonicalQuery(new URL(url));
  const canonicalParts = res.canonicalRequest.split('\n');
  assert(canonicalParts[2] === expectedCanonicalQuery, `canonical query mismatch, got: ${canonicalParts[2]}`);

  // Additional edge-case checks
  const cases = [
    { url: 'https://example.amazonaws.com/path?a=1&a=2', desc: 'duplicate keys' },
    { url: 'https://example.amazonaws.com/path?empty=', desc: 'empty value' },
    { url: "https://example.amazonaws.com/path?space=foo bar&plus=1+2&enc=%7B%7D", desc: 'spaces and percent-encodings' },
    { url: "https://example.amazonaws.com/path?k=val%201&k=val+2", desc: 'mixed encodings' }
  ];

  for (const c of cases) {
    const r: any = signAwsRequest({ method: 'GET', url: c.url, accessKey: 'AKIA_TEST', secretKey: 'SECRET', region: 'us-east-1', service: 'execute-api', now, debug: true, unsignedPayload: true });
    const expected = buildCanonicalQuery(new URL(c.url));
    const got = r.canonicalRequest.split('\n')[2];
    if (got !== expected) throw new Error(`Canonical mismatch for ${c.desc}: expected '${expected}' got '${got}'`);
  }

  console.log('aws_sigv4_debug: OK');
}

try {
  run();
} catch (err) {
  console.error('aws_sigv4_debug failed:', err);
  process.exit(1);
}
