import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';
import { generate_avatar_from_selfie, validateSelfie } from '@/lib/3d-generation/selfie-to-avatar';
import { uploadToSupabaseStorage } from '@/lib/storage/upload';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const selfieFile = formData.get('selfie') as File;

    if (!selfieFile) {
      return NextResponse.json({ error: 'Selfie image is required' }, { status: 400 });
    }

    // Validate file type
    if (!selfieFile.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (selfieFile.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Upload selfie to storage
    const selfiePath = `user-avatars/selfies/${user.id}/${Date.now()}-${selfieFile.name}`;
    const selfieUrl = await uploadToSupabaseStorage(selfieFile, selfiePath, 'avatars');

    // Validate selfie (face detection)
    console.log('Validating selfie...');
    const validation = await validateSelfie(selfieUrl);

    if (!validation.isValid) {
      return NextResponse.json({
        error: validation.error || 'Selfie validation failed',
        details: validation
      }, { status: 400 });
    }

    console.log('Selfie validation passed:', validation);

    // Check if user already has an avatar generation in progress
    const { data: existingAvatar } = await supabase
      .from('user_3d_avatars')
      .select('id, status')
      .eq('user_id', user.id)
      .single();

    if (existingAvatar && existingAvatar.status === 'processing') {
      return NextResponse.json({
        error: 'Avatar generation already in progress',
        job_id: existingAvatar.id
      }, { status: 409 });
    }

    // Create or update avatar record
    const avatarData = {
      user_id: user.id,
      selfie_url: selfieUrl,
      status: 'processing',
      generation_metadata: {
        file_size: selfieFile.size,
        file_type: selfieFile.type,
        original_name: selfieFile.name
      }
    };

    const { data: avatar, error: avatarError } = existingAvatar
      ? await supabase
          .from('user_3d_avatars')
          .update(avatarData)
          .eq('id', existingAvatar.id)
          .select()
          .single()
      : await supabase
          .from('user_3d_avatars')
          .insert(avatarData)
          .select()
          .single();

    if (avatarError) {
      console.error('Error creating avatar record:', avatarError);
      return NextResponse.json({ error: 'Failed to create avatar record' }, { status: 500 });
    }

    // Create generation job
    const { data: job, error: jobError } = await supabase
      .from('asset_generation_jobs')
      .insert({
        job_type: 'selfie_to_avatar',
        source_url: selfieUrl,
        user_id: user.id,
        metadata: {
          avatar_id: avatar.id
        }
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating job:', jobError);
      return NextResponse.json({ error: 'Failed to create generation job' }, { status: 500 });
    }

    // Start avatar generation (async)
    generate_avatar_from_selfie(selfieUrl, avatar.id)
      .then(async (avatarModelUrl) => {
        // Update avatar record
        await supabase
          .from('user_3d_avatars')
          .update({
            avatar_model_url: avatarModelUrl,
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', avatar.id);

        // Update user profile
        await supabase
          .from('users')
          .update({
            avatar_model_url: avatarModelUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        // Update job status
        await supabase
          .from('asset_generation_jobs')
          .update({
            status: 'completed',
            output_url: avatarModelUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);
      })
      .catch(async (error) => {
        console.error('Avatar generation failed:', error);
        await supabase
          .from('user_3d_avatars')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', avatar.id);

        await supabase
          .from('asset_generation_jobs')
          .update({
            status: 'failed',
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);
      });

    return NextResponse.json({
      success: true,
      avatar_id: avatar.id,
      job_id: job.id,
      message: 'Avatar generation started'
    });

  } catch (error) {
    console.error('Error in avatar generation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: avatar, error } = await supabase
      .from('user_3d_avatars')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching avatar:', error);
      return NextResponse.json({ error: 'Failed to fetch avatar' }, { status: 500 });
    }

    return NextResponse.json({ avatar: avatar || null });

  } catch (error) {
    console.error('Error fetching user avatar:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}