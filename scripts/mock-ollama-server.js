const http = require('http');

const models = [
  { name: 'llama2', description: 'Mock Llama 2' },
  { name: 'gpt4o-mini', description: 'Mock GPT4o-mini' }
];

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/api/tags') {
    const body = JSON.stringify({ models });
    res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) });
    res.end(body);
    return;
  }

  // Minimal placeholder for endpoints the client may call
  if (req.method === 'POST' && req.url === '/api/generate') {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ response: 'Mocked response' }));
    });
    return;
  }

  // Default 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = process.env.OLLAMA_PORT ? Number(process.env.OLLAMA_PORT) : 11434;
server.listen(PORT, () => console.log(`Mock Ollama server listening on http://localhost:${PORT}`));

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
