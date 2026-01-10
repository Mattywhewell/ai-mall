import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { generate_avatar_from_selfie } from '@/lib/ai/3d-generation';
import { createClient } from '@/lib/supabaseServer';

// GET /api/user/avatar - Get user's avatar
export async function GET() {
  try {
    const supabaseServer = createClient();
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: avatar, error } = await supabase
      .from('user_avatars')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching avatar:', error);
      return NextResponse.json({ error: 'Failed to fetch avatar' }, { status: 500 });
    }

    return NextResponse.json({ avatar: avatar || null });
  } catch (error) {
    console.error('Error in GET /api/user/avatar:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/user/avatar - Upload selfie and generate avatar
export async function POST(request: NextRequest) {
  try {
    const supabaseServer = createClient();
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const selfieFile = formData.get('selfie') as File;

    if (!selfieFile) {
      return NextResponse.json({ error: 'Selfie file is required' }, { status: 400 });
    }

    // Validate file type
    if (!selfieFile.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (selfieFile.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Upload selfie to Supabase Storage
    const fileName = `user-selfies/${user.id}/${Date.now()}-selfie.${selfieFile.name.split('.').pop()}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-uploads')
      .upload(fileName, selfieFile, {
        contentType: selfieFile.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading selfie:', uploadError);
      return NextResponse.json({ error: 'Failed to upload selfie' }, { status: 500 });
    }

    // Get public URL for the uploaded selfie
    const { data: { publicUrl: selfieUrl } } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(fileName);

    // Create initial avatar record with processing status
    const { data: avatarRecord, error: insertError } = await supabase
      .from('user_avatars')
      .insert({
        user_id: user.id,
        selfie_url: selfieUrl,
        status: 'processing',
        generation_metadata: {
          file_size: selfieFile.size,
          file_type: selfieFile.type,
          uploaded_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating avatar record:', insertError);
      // Clean up uploaded file
      await supabase.storage.from('user-uploads').remove([fileName]);
      return NextResponse.json({ error: 'Failed to create avatar record' }, { status: 500 });
    }

    // Start avatar generation (async)
    generate_avatar_from_selfie(selfieUrl)
      .then(async (result) => {
        if (result.success && result.modelUrl) {
          // Update avatar record with success
          await supabase
            .from('user_avatars')
            .update({
              avatar_model_url: result.modelUrl,
              status: 'completed',
              generation_metadata: {
                ...avatarRecord.generation_metadata,
                generation_completed_at: new Date().toISOString(),
                generation_params: result.params
              }
            })
            .eq('id', avatarRecord.id);

          // Update user profile with avatar URL
          await supabase
            .from('profiles')
            .update({ avatar_model_url: result.modelUrl })
            .eq('id', user.id);

        } else {
          // Update avatar record with failure
          await supabase
            .from('user_avatars')
            .update({
              status: 'failed',
              generation_metadata: {
                ...avatarRecord.generation_metadata,
                generation_failed_at: new Date().toISOString(),
                error: result.error
              }
            })
            .eq('id', avatarRecord.id);
        }

        // Clean up selfie file after processing (keep for 24 hours for potential regeneration)
        setTimeout(async () => {
          try {
            await supabase.storage.from('user-uploads').remove([fileName]);
          } catch (error) {
            console.error('Error cleaning up selfie file:', error);
          }
        }, 24 * 60 * 60 * 1000); // 24 hours

      })
      .catch(async (error) => {
        console.error('Avatar generation error:', error);

        // Update avatar record with failure
        await supabase
          .from('user_avatars')
          .update({
            status: 'failed',
            generation_metadata: {
              ...avatarRecord.generation_metadata,
              generation_failed_at: new Date().toISOString(),
              error: error.message
            }
          })
          .eq('id', avatarRecord.id);
      });

    return NextResponse.json({
      success: true,
      avatar: avatarRecord,
      message: 'Avatar generation started. This may take a few minutes.'
    });

  } catch (error) {
    console.error('Error in POST /api/user/avatar:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}