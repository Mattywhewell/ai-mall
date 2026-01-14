import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: assets, error } = await supabase
      .from('video_assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching video assets:', error);
      return NextResponse.json({ error: 'Failed to fetch video assets' }, { status: 500 });
    }

    return NextResponse.json({ assets: assets || [], success: true });
  } catch (error) {
    console.error('Video assets API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
