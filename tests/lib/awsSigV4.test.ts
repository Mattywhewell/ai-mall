import { signAwsRequest } from '@/lib/awsSigV4';

test('signAwsRequest returns Authorization and x-amz-date headers', () => {
  const res = signAwsRequest({ method: 'GET', url: 'https://example.amazonaws.com/path?x=1', accessKey: 'AKIA_TEST', secretKey: 'SECRET', region: 'us-east-1', service: 'execute-api' });
  expect(res['Authorization']).toBeDefined();
  expect(res['x-amz-date']).toBeDefined();
});