import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { generate_3d_model_from_image } from '@/lib/ai/3d-generation';

// GET /api/admin/assets - Fetch all admin assets
export async function GET() {
  try {
    const { data: assets, error } = await supabase
      .from('admin_assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Check if it's a table not found error
      if (error.code === 'PGRST205' || error.message?.includes('admin_assets')) {
        console.log('Admin assets table not found - migration may not be applied yet');
        return NextResponse.json({
          assets: [],
          message: '3D assets system not yet initialized. Please apply database migrations.'
        });
      }
      console.error('Error fetching assets:', error);
      return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
    }

    return NextResponse.json({ assets: assets || [] });
  } catch (error) {
    console.error('Error in GET /api/admin/assets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/assets - Upload image and generate 3D model
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const tags = JSON.parse(formData.get('tags') as string || '[]');

    if (!imageFile || !name) {
      return NextResponse.json({ error: 'Image file and name are required' }, { status: 400 });
    }

    // Validate file type
    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Upload image to Supabase Storage
    const fileName = `admin-assets/${Date.now()}-${imageFile.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('assets')
      .upload(fileName, imageFile, {
        contentType: imageFile.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
    }

    // Get public URL for the uploaded image
    const { data: { publicUrl: imageUrl } } = supabase.storage
      .from('assets')
      .getPublicUrl(fileName);

    // Generate 3D model from image
    const modelResult = await generate_3d_model_from_image(imageUrl);

    if (!modelResult.success) {
      // Clean up uploaded image if 3D generation failed
      await supabase.storage.from('assets').remove([fileName]);
      return NextResponse.json({
        error: 'Failed to generate 3D model',
        details: modelResult.error
      }, { status: 500 });
    }

    // Save asset metadata to database
    const { data: asset, error: dbError } = await supabase
      .from('admin_assets')
      .insert({
        name,
        description,
        asset_type: 'generated_3d_model',
        file_url: modelResult.modelUrl,
        thumbnail_url: modelResult.thumbnailUrl || imageUrl,
        file_format: 'glb',
        file_size_bytes: modelResult.fileSize || 0,
        tags,
        metadata: {
          source_image: imageUrl,
          generation_method: 'image_to_3d',
          generation_params: modelResult.params
        }
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error saving asset:', dbError);
      // Clean up files if database save failed
      await supabase.storage.from('assets').remove([fileName]);
      if (modelResult.modelUrl) {
        // Clean up generated model file
        const modelPath = modelResult.modelUrl.split('/').pop();
        if (modelPath) {
          await supabase.storage.from('assets').remove([`admin-assets/${modelPath}`]);
        }
      }
      return NextResponse.json({ error: 'Failed to save asset' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      asset,
      message: '3D model generated successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/admin/assets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/assets - Save scene from scene editor
export async function PUT(request: NextRequest) {
  try {
    const { sceneData, name, description } = await request.json();

    if (!sceneData || !name) {
      return NextResponse.json({ error: 'Scene data and name are required' }, { status: 400 });
    }

    // Save scene data as JSON file to storage
    const sceneJson = JSON.stringify(sceneData, null, 2);
    const sceneBlob = new Blob([sceneJson], { type: 'application/json' });
    const sceneFileName = `admin-assets/scenes/${Date.now()}-${name.replace(/[^a-zA-Z0-9]/g, '_')}.json`;

    const { data: sceneUploadData, error: sceneUploadError } = await supabase.storage
      .from('assets')
      .upload(sceneFileName, sceneBlob, {
        contentType: 'application/json',
        upsert: false
      });

    if (sceneUploadError) {
      console.error('Error uploading scene:', sceneUploadError);
      return NextResponse.json({ error: 'Failed to save scene' }, { status: 500 });
    }

    // Get public URL for the scene
    const { data: { publicUrl: sceneUrl } } = supabase.storage
      .from('assets')
      .getPublicUrl(sceneFileName);

    // Save scene asset metadata
    const { data: asset, error: dbError } = await supabase
      .from('admin_assets')
      .insert({
        name,
        description: description || `Scene: ${name}`,
        asset_type: 'scene',
        file_url: sceneUrl,
        thumbnail_url: null, // Scenes don't have thumbnails
        file_format: 'json',
        file_size_bytes: sceneBlob.size,
        tags: ['scene', 'editor'],
        metadata: {
          scene_data: sceneData,
          editor_version: '1.0'
        }
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error saving scene asset:', dbError);
      // Clean up scene file
      await supabase.storage.from('assets').remove([sceneFileName]);
      return NextResponse.json({ error: 'Failed to save scene asset' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      asset,
      message: 'Scene saved successfully'
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/assets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}