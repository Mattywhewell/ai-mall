import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('supported_channels')
      .select('*')
      .order('implementation_priority', { ascending: true });

    if (error && error.code === '42P01') {
      return NextResponse.json({ channels: [] });
    }

    return NextResponse.json({ channels: data || [] });
  } catch (err) {
    console.error('GET /api/seller/channels/supported error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}