import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { revalidatePath } from 'next/cache';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { assetKey: string } }
) {
  try {
    const supabase = await createClient();
    const assetKey = params.assetKey;

    if (!assetKey) {
      return NextResponse.json({ error: 'Asset key is required' }, { status: 400 });
    }

    // Get the asset to find the file URL
    const { data: asset, error: fetchError } = await supabase
      .from('video_assets')
      .select('*')
      .eq('name', assetKey)
      .single();

    if (fetchError || !asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Extract filename from URL
    const urlParts = asset.file_url.split('/');
    const filename = urlParts[urlParts.length - 1];

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('video-assets')
      .remove([filename]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('video_assets')
      .delete()
      .eq('name', assetKey);

    if (dbError) {
      console.error('Database delete error:', dbError);
      return NextResponse.json({ error: 'Failed to delete asset from database' }, { status: 500 });
    }

    revalidatePath('/admin/video');

    return NextResponse.json({ success: true, message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Video delete API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
