import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    const { data, error } = await supabase.from('visual_layers').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const required = ['name', 'slug', 'type'];
    for (const r of required) {
      if (!body[r]) {
        return NextResponse.json({ ok: false, error: `Missing field: ${r}` }, { status: 400 });
      }
    }

    // Guard: basic slug validation
    if (!/^[a-z0-9-.]+$/.test(body.slug)) {
      return NextResponse.json({ ok: false, error: 'Invalid slug format (use lower-case, dash separators)' }, { status: 400 });
    }

    const insertPayload = {
      name: body.name,
      slug: body.slug,
      type: body.type,
      description: body.description || null,
      shader_file: body.shader_file || null,
      shader_storage_key: body.shader_storage_key || null,
      lut_file: body.lut_file || null,
      mask_file: body.mask_file || null,
      blend_mode: body.blend_mode || null,
      default_strength: body.default_strength ?? 0.6,
      parameters: body.parameters ?? [],
      tags: body.tags ?? [],
      preview_image: body.preview_image || null,
      author: body.author || null,
      license: body.license || null,
      version: body.version || null,
    };

    const { data, error } = await supabase.from('visual_layers').insert(insertPayload).select().single();
    if (error) throw error;

    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}
