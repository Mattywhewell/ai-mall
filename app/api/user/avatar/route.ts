import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseClient';

/**
 * GET /api/user/avatar
 * Get user's current avatar status and URL
 * Following Arrival Ritual: reflect the citizen's current form
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      // For testing purposes, return a mock response when not authenticated
      console.log('User not authenticated - returning mock avatar data for testing');
      return NextResponse.json({
        avatar_url: null,
        generation_status: 'not_started',
        avatar_asset: null,
        can_generate: true,
        mythic_message: 'The city awaits your arrival...',
        message: 'Authentication required for full avatar functionality'
      });
    }

    // Get user avatar data from new schema
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('avatar_model_url, avatar_generation_status, avatar_upload_id')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('User avatar query error:', userError);
      return NextResponse.json({ error: 'Failed to get avatar data' }, { status: 500 });
    }

    // Get latest avatar asset if available
    let avatarAsset = null;
    if (userData.avatar_model_url) {
      const { data: asset } = await supabase
        .from('assets')
        .select('*')
        .eq('file_url', userData.avatar_model_url)
        .eq('type', 'avatar')
        .single();

      avatarAsset = asset;
    }

    return NextResponse.json({
      avatar_url: userData.avatar_model_url,
      generation_status: userData.avatar_generation_status,
      avatar_asset: avatarAsset,
      can_generate: userData.avatar_generation_status !== 'generating',
      mythic_message: userData.avatar_generation_status === 'generating'
        ? 'The city shapes your reflection...'
        : userData.avatar_generation_status === 'ready'
        ? 'Your form has emerged from the fog.'
        : 'Begin your arrival ritual.'
    });

  } catch (error) {
    console.error('Avatar retrieval error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/user/avatar
 * Upload selfie and generate avatar (legacy endpoint for backward compatibility)
 * Now redirects to the new upload-selfie endpoint
 */
export async function POST(request: NextRequest) {
  // Redirect to new endpoint for consistency
  return NextResponse.redirect(new URL('/api/user/upload-selfie', request.url));
}