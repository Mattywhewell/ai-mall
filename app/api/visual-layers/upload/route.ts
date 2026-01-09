import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { filename, contentBase64, kind } = body as {
      filename: string;
      contentBase64: string;
      kind: 'shader' | 'lut' | 'mask' | 'other';
    };

    if (!filename || !contentBase64) {
      return NextResponse.json({ ok: false, error: 'Missing filename or content' }, { status: 400 });
    }

    // Basic validation of filename
    if (!/^[a-zA-Z0-9.\-_@]+$/.test(filename)) {
      return NextResponse.json({ ok: false, error: 'Invalid filename' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'tmp-shader-assets');
    await fs.mkdir(uploadDir, { recursive: true });

    const filepath = path.join(uploadDir, filename);

    const buffer = Buffer.from(contentBase64, 'base64');
    await fs.writeFile(filepath, buffer);

    // Return a reference path (for local dev, path under tmp-shader-assets)
    const publicPath = `/tmp-shader-assets/${filename}`;

    return NextResponse.json({ ok: true, path: publicPath, kind });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || String(error) }, { status: 500 });
  }
}
