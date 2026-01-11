#!/usr/bin/env node

const https = require('https');

const data = JSON.stringify({
  product_url: "https://example-cj-product.com/item/123",
  supplier_id: "cj_supplier_id_1"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auto-listing/extract',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);

  res.on('data', (chunk) => {
    console.log(`Body: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();