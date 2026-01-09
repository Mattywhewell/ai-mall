import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { filename, contentBase64, kind, uploadToken } = body as {
      filename: string;
      contentBase64: string;
      kind: 'shader' | 'lut' | 'mask' | 'other';
      uploadToken?: string;
    };

    if (!filename || !contentBase64) {
      return NextResponse.json({ ok: false, error: 'Missing filename or content' }, { status: 400 });
    }

    // Basic validation of filename
    if (!/^[a-zA-Z0-9.\-_@]+$/.test(filename)) {
      return NextResponse.json({ ok: false, error: 'Invalid filename' }, { status: 400 });
    }

    // Prefer uploading to Supabase Storage if server role key is available
    try {
      const supabase = getSupabaseClient();
      const bucket = 'visual-layers';
      const storageKey = `shaders/${Date.now()}-${filename}`;

      const buffer = Buffer.from(contentBase64, 'base64');

      const { error: uploadErr } = await supabase.storage.from(bucket).upload(storageKey, buffer, { upsert: false });
      if (uploadErr) {
        // Fallback to local file system if bucket not found or upload failed
        throw uploadErr;
      }

      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(storageKey);
      const publicUrl = pub?.publicUrl || null;

      return NextResponse.json({ ok: true, path: publicUrl, storageKey, kind });
    } catch (storageError) {
      // Fallback: write to local temp directory for dev/test
      const uploadDir = path.join(process.cwd(), 'tmp-shader-assets');
      await fs.mkdir(uploadDir, { recursive: true });
      const filepath = path.join(uploadDir, filename);
      const buffer = Buffer.from(contentBase64, 'base64');
      await fs.writeFile(filepath, buffer);
      const publicPath = `/tmp-shader-assets/${filename}`;
      return NextResponse.json({ ok: true, path: publicPath, kind });
    }
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || String(error) }, { status: 500 });
  }
}
