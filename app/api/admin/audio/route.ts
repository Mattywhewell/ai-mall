import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { revalidatePath } from 'next/cache';

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch all custom audio assets
    const { data: assets, error } = await supabase
      .from('audio_assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching audio assets:', error);
      return NextResponse.json({ error: 'Failed to fetch audio assets' }, { status: 500 });
    }

    return NextResponse.json({
      assets: assets || [],
      success: true
    });
  } catch (error) {
    console.error('Audio assets API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const formData = await request.formData();

    const assetKey = formData.get('assetKey') as string;
    const assetName = formData.get('assetName') as string;
    const file = formData.get('file') as File;

    if (!file || !assetKey) {
      return NextResponse.json({ error: 'Missing file or asset key' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      return NextResponse.json({ error: 'File must be an audio file' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'wav';
    const uniqueFilename = `${assetKey}_${Date.now()}.${fileExtension}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio-assets')
      .upload(uniqueFilename, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('audio-assets')
      .getPublicUrl(uniqueFilename);

    // Check if asset already exists
    const { data: existingAsset } = await supabase
      .from('audio_assets')
      .select('id')
      .eq('name', assetKey)
      .single();

    let result;
    if (existingAsset) {
      // Update existing asset
      const { data, error } = await supabase
        .from('audio_assets')
        .update({
          original_name: file.name,
          file_url: publicUrl,
          file_format: fileExtension,
          file_size_bytes: file.size,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAsset.id)
        .select()
        .single();

      if (error) {
        console.error('Update error:', error);
        return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 });
      }
      result = data;
    } else {
      // Create new asset
      const { data, error } = await supabase
        .from('audio_assets')
        .insert({
          name: assetKey,
          original_name: file.name,
          file_url: publicUrl,
          file_format: fileExtension,
          file_size_bytes: file.size,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Insert error:', error);
        return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 });
      }
      result = data;
    }

    // Revalidate admin audio page
    revalidatePath('/admin/audio');

    return NextResponse.json({
      asset: result,
      success: true
    });
  } catch (error) {
    console.error('Audio upload API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}