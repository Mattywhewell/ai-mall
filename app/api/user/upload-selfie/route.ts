import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { generateAvatarFromSelfie } from '@/lib/ai/avatar-generation';

/**
 * POST /api/user/upload-selfie
 * User endpoint for uploading selfie for avatar generation
 * Following Arrival Ritual: gentle, magical entry
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const selfieFile = formData.get('selfie') as File;

    if (!selfieFile) {
      return NextResponse.json({ error: 'Selfie file required' }, { status: 400 });
    }

    // Validate file type
    if (!selfieFile.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (selfieFile.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Upload to storage
    const fileName = `user_selfies/${user.id}/${Date.now()}-selfie.jpg`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(fileName, selfieFile);

    if (uploadError) {
      console.error('Selfie upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload selfie' }, { status: 500 });
    }

    // Create upload record
    const { data: uploadRecord, error: uploadRecordError } = await supabase
      .from('uploads')
      .insert({
        user_id: user.id,
        original_filename: selfieFile.name,
        file_path: uploadData.path,
        file_size_bytes: selfieFile.size,
        mime_type: selfieFile.type,
        upload_type: 'user_selfie',
        purpose: 'avatar_creation',
        processing_status: 'processing',
        metadata: {
          upload_source: 'user_profile'
        }
      })
      .select()
      .single();

    if (uploadRecordError) {
      console.error('Upload record error:', uploadRecordError);
      return NextResponse.json({ error: 'Failed to create upload record' }, { status: 500 });
    }

    // Update user avatar status
    await supabase.rpc('update_user_avatar_status', {
      user_id: user.id,
      status: 'generating'
    });

    // Start async avatar generation
    generateAvatarFromSelfie(uploadRecord.id, uploadData.path)
      .then(async (result) => {
        if (result.success) {
          // Update user with avatar URL
          await supabase.rpc('update_user_avatar_status', {
            user_id: user.id,
            status: 'ready',
            avatar_url: result.avatarUrl
          });
        } else {
          // Update status to failed
          await supabase.rpc('update_user_avatar_status', {
            user_id: user.id,
            status: 'failed'
          });
        }
      })
      .catch(async (error) => {
        console.error('Avatar generation failed:', error);
        await supabase.rpc('update_user_avatar_status', {
          user_id: user.id,
          status: 'failed'
        });
      });

    return NextResponse.json({
      success: true,
      upload_id: uploadRecord.id,
      message: 'The city shapes your reflection...',
      status: 'processing'
    });

  } catch (error) {
    console.error('Selfie upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}