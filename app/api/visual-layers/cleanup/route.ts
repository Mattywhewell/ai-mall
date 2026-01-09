import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { filename, token } = body as { filename?: string; token?: string };

    if (!filename) {
      return NextResponse.json({ ok: false, error: 'Missing filename' }, { status: 400 });
    }

    const expected = process.env.TEST_CLEANUP_TOKEN;
    if (!expected || expected !== token) {
      return NextResponse.json({ ok: false, error: 'Invalid token or TEST_CLEANUP_TOKEN not set' }, { status: 403 });
    }

    // If a storageKey is provided, delete from Supabase Storage
    const storageKey = body.storageKey;
    if (storageKey) {
      try {
        const supabase = getSupabaseClient();
        const bucket = 'visual-layers';
        const { error: delErr } = await supabase.storage.from(bucket).remove([storageKey]);
        if (delErr) {
          return NextResponse.json({ ok: false, error: delErr.message }, { status: 500 });
        }
        return NextResponse.json({ ok: true });
      } catch (err: any) {
        return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
      }
    }

    const uploadDir = path.join(process.cwd(), 'tmp-shader-assets');
    const resolved = path.resolve(uploadDir, filename);

    if (!resolved.startsWith(path.resolve(uploadDir))) {
      return NextResponse.json({ ok: false, error: 'Invalid filename' }, { status: 400 });
    }

    try {
      await fs.unlink(resolved);
    } catch (err: any) {
      // If file doesn't exist, still consider cleanup successful
      if (err.code !== 'ENOENT') throw err;
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}
