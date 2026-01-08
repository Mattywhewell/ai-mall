import http from 'http';
import { signAwsRequest } from '@/lib/awsSigV4';

async function run() {
  // Start a local mock SP-API server
  const server = http.createServer((req, res) => {
    const headers = Object.fromEntries(Object.entries(req.headers || {}).map(([k, v]) => [k.toLowerCase(), v]));

    const hasAuth = !!headers['authorization'];
    const hasDate = !!headers['x-amz-date'];
    const hasSession = !!headers['x-amz-security-token'] || !!headers['x-amz-access-token'];

    const ok = hasAuth && hasDate;

    res.setHeader('content-type', 'application/json');
    res.statusCode = ok ? 200 : 400;
    res.end(JSON.stringify({ ok, received: { authorization: !!headers['authorization'], xAmzDate: !!headers['x-amz-date'], sessionToken: !!headers['x-amz-security-token'] || !!headers['x-amz-access-token'] } }));

    // close after response for simplicity
    setImmediate(() => server.close());
  });

  await new Promise<void>((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => resolve());
    server.on('error', reject);
  });

  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Failed to get server address');
  const port = address.port;
  const url = `http://127.0.0.1:${port}/orders/v0/orders?MaxResultsPerPage=1`;

  // Sign the request using our SigV4 helper
  const signerHeaders = signAwsRequest({
    method: 'GET',
    url,
    accessKey: 'AKIA_TEST',
    secretKey: 'SECRET_TEST',
    region: 'us-east-1',
    service: 'execute-api',
    headers: { 'content-type': 'application/json' }
  });

  // Send request to mock server with signed headers
  const res = await fetch(url, { method: 'GET', headers: signerHeaders as any });
  const body = await res.json();

  if (!res.ok) {
    console.error('Mock server rejected request:', body);
    throw new Error('Signed request did not include expected headers');
  }

  console.log('E2E SigV4 test passed — server observed signed headers:', body.received);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
