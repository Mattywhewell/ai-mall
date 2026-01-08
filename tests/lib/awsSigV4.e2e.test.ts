import { signAwsRequest, buildCanonicalQuery } from '@/lib/awsSigV4';

test('canonical query is correctly encoded and ordered and Authorization header contains expected pieces', () => {
  const url = 'https://example.amazonaws.com/path?b=2&a=1&c=foo bar&z=!\'()*';
  const now = new Date('2020-01-01T00:00:00Z');

  const res: any = signAwsRequest({ method: 'GET', url, accessKey: 'AKIA_TEST', secretKey: 'SECRET', region: 'us-east-1', service: 'execute-api', now, debug: true, unsignedPayload: true });

  expect(res).toBeDefined();
  expect(res.headers).toBeDefined();
  const auth = res.headers.Authorization as string;
  expect(auth).toMatch(/^AWS4-HMAC-SHA256 Credential=AKIA_TEST\/[0-9]{8}\/us-east-1\/execute-api\/aws4_request/);
  expect(auth).toMatch(/SignedHeaders=[^,]+,/);
  expect(auth).toMatch(/Signature=[0-9a-f]{64}$/i);

  // canonical query should match buildCanonicalQuery
  const expectedCanonicalQuery = buildCanonicalQuery(new URL(url));
  // canonicalRequest is method\npath\ncanonicalQuery\n...
  const canonicalParts = res.canonicalRequest.split('\n');
  expect(canonicalParts[2]).toBe(expectedCanonicalQuery);
});


test('canonicalization edge cases: duplicate keys, empty values, percent-encoded values', () => {
  // Duplicate keys (a=1&a=2 should preserve order by value after sorting by key then value)
  const url1 = 'https://example.amazonaws.com/path?b=2&a=2&a=1&c=';
  const now = new Date('2020-01-01T00:00:00Z');
  const res1: any = signAwsRequest({ method: 'GET', url: url1, accessKey: 'AKIA_TEST', secretKey: 'SECRET', region: 'us-east-1', service: 'execute-api', now, debug: true, unsignedPayload: true });
  const expected1 = buildCanonicalQuery(new URL(url1));
  expect(res1.canonicalRequest.split('\n')[2]).toBe(expected1);

  // Empty value should be encoded as key=
  const url2 = 'https://example.amazonaws.com/path?empty=';
  const res2: any = signAwsRequest({ method: 'GET', url: url2, accessKey: 'AKIA_TEST', secretKey: 'SECRET', region: 'us-east-1', service: 'execute-api', now, debug: true, unsignedPayload: true });
  const expected2 = buildCanonicalQuery(new URL(url2));
  expect(res2.canonicalRequest.split('\n')[2]).toBe(expected2);

  // Percent-encoded values and characters needing RFC3986 encoding
  const url3 = 'https://example.amazonaws.com/path?space=foo bar&safe=azAZ09-_.~&special=!\'()*';
  const res3: any = signAwsRequest({ method: 'GET', url: url3, accessKey: 'AKIA_TEST', secretKey: 'SECRET', region: 'us-east-1', service: 'execute-api', now, debug: true, unsignedPayload: true });
  const expected3 = buildCanonicalQuery(new URL(url3));
  expect(res3.canonicalRequest.split('\n')[2]).toBe(expected3);

  // More edge cases
  const dup = 'https://example.amazonaws.com/path?a=1&a=2';
  const rdup: any = signAwsRequest({ method: 'GET', url: dup, accessKey: 'AKIA_TEST', secretKey: 'SECRET', region: 'us-east-1', service: 'execute-api', now, debug: true, unsignedPayload: true });
  expect(rdup.canonicalRequest.split('\n')[2]).toBe(buildCanonicalQuery(new URL(dup)));

  const mixed = 'https://example.amazonaws.com/path?k=val%201&k=val+2';
  const rmixed: any = signAwsRequest({ method: 'GET', url: mixed, accessKey: 'AKIA_TEST', secretKey: 'SECRET', region: 'us-east-1', service: 'execute-api', now, debug: true, unsignedPayload: true });
  expect(rmixed.canonicalRequest.split('\n')[2]).toBe(buildCanonicalQuery(new URL(mixed)));
});