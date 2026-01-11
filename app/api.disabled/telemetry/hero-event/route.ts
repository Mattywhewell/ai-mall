import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const logDir = path.join(process.cwd(), 'tmp-telemetry');
    await fs.mkdir(logDir, { recursive: true });
    const file = path.join(logDir, 'hero-events.log');
    const entry = `${new Date().toISOString()} ${JSON.stringify(body)}\n`;
    await fs.appendFile(file, entry);
    console.log('[Telemetry] Hero event received:', body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Telemetry error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}