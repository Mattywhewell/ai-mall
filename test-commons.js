const http = require('http');

console.log('Testing commons page...');

const req = http.get('http://localhost:3000/commons', (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers['content-type']);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response received, length:', data.length);
    if (data.includes('SpatialCommons')) {
      console.log('✅ Commons page loaded successfully');
    } else {
      console.log('❌ Commons page may have issues');
    }
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.error('❌ Connection error:', err.message);
  process.exit(1);
});

req.setTimeout(5000, () => {
  console.error('❌ Request timeout');
  req.destroy();
  process.exit(1);
});