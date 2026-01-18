import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/districts
 * Get all districts (microstores)
 */
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: districts, error } = await supabase
      .from('microstores')
      .select('id, name, slug, description, category, created_at, updated_at')
      .order('name');

    if (error) {
      console.error('Error fetching districts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch districts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      districts: districts || [],
      count: districts?.length || 0
    });

  } catch (error) {
    console.error('Error in districts API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}