import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // Initialize supabase client
    const supabase = getSupabaseClient();
    // Get user ID
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || `anon_${Math.random().toString(36).substring(7)}`;

    // Try to fetch city architecture data
    const { data: halls, error: hallsError } = await supabase
      .from('halls')
      .select('*')
      .order('name');

    // If halls table doesn't exist, return mock data
    if (hallsError && hallsError.code === '42P01') {
      return NextResponse.json({
        halls: [],
        trendingStreets: [],
        featuredChapels: [],
        welcomeMessage: "Welcome to the AI City! The city architecture is still being built. Please run the world-architecture-schema.sql to create the city layers.",
        userContext: {
          userId,
          hasHistory: false,
          personalizedView: false,
          setupRequired: true
        }
      });
    }

    // Fetch trending streets (top 10 by popularity)
    const { data: trendingStreets } = await supabase
      .from('streets')
      .select('*')
      .eq('trending', true)
      .order('popularity_score', { ascending: false })
      .limit(10);

    // Fetch featured chapels (most visited)
    const { data: featuredChapels } = await supabase
      .from('chapels')
      .select('*')
      .order('visit_count', { ascending: false })
      .limit(6);

    // Parse color_palette for halls (convert string to array)
    if (halls) {
      halls.forEach(hall => {
        if (hall.atmosphere && typeof hall.atmosphere.color_palette === 'string') {
          hall.atmosphere.color_palette = hall.atmosphere.color_palette.split(' ').filter(Boolean);
        }
      });
    }

    // Simple welcome message (avoid complex AI calls that might fail)
    const welcomeMessage = "Step into a world that learns, adapts, and evolves with you. Every corner holds a story waiting to unfold.";

    return NextResponse.json({
      halls: halls || [],
      trendingStreets: trendingStreets || [],
      featuredChapels: featuredChapels || [],
      welcomeMessage,
      userContext: {
        userId,
        hasHistory: false,
        personalizedView: false
      }
    });

  } catch (error) {
    console.error('Error fetching city data:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
