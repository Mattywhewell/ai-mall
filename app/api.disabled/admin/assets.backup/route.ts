import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock data for now
    const assets = [
      {
        id: '1',
        name: 'Sample 3D Model',
        description: 'A generated 3D model',
        asset_type: '3d_model',
        file_url: 'https://example.com/model.glb',
        thumbnail_url: 'https://example.com/thumbnail.jpg',
        file_format: 'glb',
        file_size_bytes: 1024000,
        tags: ['generated', '3d'],
        created_at: new Date().toISOString()
      }
    ];

    return NextResponse.json({ assets });
  } catch (error) {
    console.error('Error fetching admin assets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Mock successful upload for now
    return NextResponse.json({
      success: true,
      job_id: 'mock-job-id',
      message: '3D model generation started (mock)'
    });
  } catch (error) {
    console.error('Error in image-to-3d generation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Mock scene saving
    return NextResponse.json({
      success: true,
      asset: { id: 'mock-scene-id', name: 'Saved Scene' },
      message: 'Scene saved successfully (mock)'
    });
  } catch (error) {
    console.error('Error saving scene:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}