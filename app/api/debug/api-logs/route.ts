import { NextResponse } from 'next/server';
import fs from 'fs';

export async function GET() {
  try {
    const path = 'logs/api-debug.log';
    if (!fs.existsSync(path)) {
      return NextResponse.json({ ok: true, logs: [] });
    }

    const content = fs.readFileSync(path, 'utf-8');
    const lines = content.split('\n').filter(Boolean);
    const tail = lines.slice(-200);
    return NextResponse.json({ ok: true, lines: tail });
  } catch (err: any) {
    console.error('Failed to read api-debug.log', err);
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}