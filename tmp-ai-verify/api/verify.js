module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const body = req.body || {}
  let keys = Array.isArray(body.keys) ? [...body.keys] : []
  if (body.includeEnvKey && process.env.AI_GATEWAY_API_KEY) keys.push(process.env.AI_GATEWAY_API_KEY)
  if (!keys.length) return res.status(400).json({ error: 'no_keys_provided' })
  const payload = { model: 'openai/gpt-5', messages: [{ role: 'user', content: 'ping' }], stream: false }
  const results = []
  for (const key of keys) {
    const masked = typeof key === 'string' && key.length > 8 ? `${key.slice(0,8)}...${key.slice(-4)}` : 'env'
    try {
      const resp = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify(payload),
      })
      const text = await resp.text()
      results.push({ key: masked, status: resp.status, ok: resp.ok, body: text.slice(0,200) })
    } catch (err) {
      results.push({ key: masked, error: String(err) })
    }
  }
  res.json({ results })
}
