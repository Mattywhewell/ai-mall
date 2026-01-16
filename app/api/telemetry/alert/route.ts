import { NextResponse } from 'next/server';
import { recordEvent, shouldForwardAlert } from '@/lib/telemetry/alertDedupe';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event, message, severity = 'warning', url, buildSha } = body || {};
    if (!event) return NextResponse.json({ ok: false, reason: 'missing event' }, { status: 400 });

    // Simple fingerprint: event + build
    const fingerprint = `${event}:${buildSha || 'unknown'}`;

    const count = recordEvent(fingerprint);

    const threshold = parseInt(process.env.TELEMETRY_ALERT_THRESHOLD || '3', 10);

    // Decide whether to forward: critical always forwards; otherwise require threshold
    const shouldForward = shouldForwardAlert({ key: fingerprint, severity, threshold });

    if (!process.env.TELEMETRY_ALERT_WEBHOOK) {
      // Not configured; nothing to forward but acknowledge the receipt
      return NextResponse.json({ ok: true, forwarded: false, reason: 'no webhook configured' });
    }

    if (!shouldForward) {
      return NextResponse.json({ ok: true, forwarded: false, count });
    }

    // Compose a compact Slack-friendly message
    const slackText = `*${event}* reported${buildSha ? ` (build ${buildSha})` : ''}\n• Message: ${message || '<none>'}\n• Count in window: ${count}\n• URL: ${url || '<none>'}`;

    // Forward to webhook
    await fetch(process.env.TELEMETRY_ALERT_WEBHOOK!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: slackText }),
    });

    return NextResponse.json({ ok: true, forwarded: true, count });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
