import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { revalidatePath } from 'next/cache';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg', 'video/x-matroska'];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const formData = await request.formData();

    const assetKey = formData.get('assetKey') as string;
    const assetName = formData.get('assetName') as string || assetKey;
    const file = formData.get('file') as File;
    const description = formData.get('description') as string | null;
    const tagsRaw = formData.get('tags') as string | null;
    const tags = tagsRaw ? JSON.parse(tagsRaw) : [];
    const duration = formData.get('duration') as string | null;
    const resolutionWidth = formData.get('resolution_width') as string | null;
    const resolutionHeight = formData.get('resolution_height') as string | null;
    const scheduleStart = formData.get('schedule_start') as string | null;
    const scheduleEnd = formData.get('schedule_end') as string | null;

    if (!file || !assetKey) {
      return NextResponse.json({ error: 'Missing file or asset key' }, { status: 400 });
    }

    // Basic validation
    if (!file.type.startsWith('video/') || !ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported video format' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File exceeds maximum size of 100MB' }, { status: 400 });
    }

    // Upload to storage
    const filename = `${assetKey}-${Date.now()}-${file.name}`.replace(/[^a-zA-Z0-9._-]/g, '_');

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('video-assets')
      .upload(filename, file as any, { upsert: true });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload video file' }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage.from('video-assets').getPublicUrl(uploadData.path);
    const fileUrl = publicUrlData.publicUrl;

    // Insert or update database record
    const insertPayload: any = {
      name: assetKey,
      original_name: file.name,
      file_url: fileUrl,
      file_format: file.type.split('/').pop() || 'mp4',
      file_size_bytes: file.size,
      duration_seconds: duration ? parseFloat(duration) : null,
      resolution_width: resolutionWidth ? parseInt(resolutionWidth, 10) : null,
      resolution_height: resolutionHeight ? parseInt(resolutionHeight, 10) : null,
      description: description || null,
      tags: tags || null,
      is_active: true
    };

    if (scheduleStart) insertPayload.schedule_start = scheduleStart;
    if (scheduleEnd) insertPayload.schedule_end = scheduleEnd;

    const { error: dbError } = await supabase
      .from('video_assets')
      .upsert(insertPayload, { onConflict: 'name' });

    if (dbError) {
      console.error('DB insert error:', dbError);
      return NextResponse.json({ error: 'Failed to save video asset' }, { status: 500 });
    }

    revalidatePath('/admin/video');

    return NextResponse.json({ success: true, asset: insertPayload });
  } catch (error) {
    console.error('Video upload API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
