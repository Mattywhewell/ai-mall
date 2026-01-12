const http = require('http');

console.log('Creating HTTP server...');

const server = http.createServer((req, res) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World\n');
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

server.listen(8080, '127.0.0.1', () => {
  console.log('Test server running on http://127.0.0.1:8080');
  console.log('Server address:', server.address());
});