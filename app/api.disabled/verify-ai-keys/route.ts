import { NextResponse } from 'next/server'

// Temporary verification endpoint - POST JSON: { "keys": ["vck_..."], "includeEnvKey": true }
// Returns per-key status and a short response body (truncated).

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { keys?: string[], includeEnvKey?: boolean }
    const keys = Array.isArray(body.keys) ? [...body.keys] : []

    if (body.includeEnvKey && process.env.AI_GATEWAY_API_KEY) {
      keys.push(process.env.AI_GATEWAY_API_KEY)
    }

    if (!keys.length) {
      return NextResponse.json({ error: 'no_keys_provided' }, { status: 400 })
    }

    const payload = { model: 'openai/gpt-5', messages: [{ role: 'user', content: 'ping' }], stream: false }

    const results: Array<any> = []
    for (const key of keys) {
      // Mask the key when returning in results
      const masked = typeof key === 'string' && key.length > 8 ? `${key.slice(0,8)}...${key.slice(-4)}` : 'env'
      try {
        const res = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify(payload),
        })
        const text = await res.text()
        results.push({ key: masked, status: res.status, ok: res.ok, body: text.slice(0, 200) })
      } catch (err: any) {
        results.push({ key: masked, error: String(err) })
      }
    }

    return NextResponse.json({ results })
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
