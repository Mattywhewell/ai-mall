/**
 * City API Endpoint
 * Returns personalized city overview with halls, trending streets, featured chapels
 */

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { WorldRenderer } from '@/lib/ai-city/world-renderer';
import { AISpiritSystem } from '@/lib/ai-city/spirits';
import { Hall, Street, Chapel } from '@/lib/types/world';
import { createSuccessResponse, handleSupabaseError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from auth (if available)
    const authHeader = request.headers.get('authorization');
    let userId = null;

    if (authHeader?.startsWith('Bearer ')) {
      // TODO: Validate JWT token and extract user ID
      // For now, we'll work without user personalization
    }

    // Fetch all halls
    const { data: halls, error: hallsError } = await supabase
      .from('halls')
      .select('*')
      .order('created_at', { ascending: true });

    if (hallsError) {
      return handleSupabaseError(hallsError, 'fetch halls');
    }

    // Fetch streets with popularity
    const { data: streets, error: streetsError } = await supabase
      .from('streets')
      .select('*')
      .order('popularity_score', { ascending: false });

    if (streetsError) {
      return handleSupabaseError(streetsError, 'fetch streets');
    }

    // Fetch chapels
    const { data: chapels, error: chapelsError } = await supabase
      .from('chapels')
      .select('*')
      .order('visit_count', { ascending: false });

    if (chapelsError) {
      return handleSupabaseError(chapelsError, 'fetch chapels');
    }

    // Get trending streets (top 3 by popularity)
    const trendingStreets = (streets || [])
      .filter(street => street.popularity_score > 70)
      .slice(0, 3);

    // Get featured chapels (top 3 by visit count)
    const featuredChapels = (chapels || []).slice(0, 3);

    // Generate personalized welcome message
    let welcomeMessage: string | null = null;
    try {
      const timeOfDay = new Date().getHours();
      const timeContext = timeOfDay < 12 ? 'morning' : timeOfDay < 18 ? 'afternoon' : 'evening';

      welcomeMessage = await AISpiritSystem.generateWelcomeMessage(
        halls || [],
        trendingStreets,
        timeContext
      );
    } catch (error) {
      console.error('Error generating welcome message:', error);
      welcomeMessage = "Welcome to the AI City, where every space tells a story.";
    }

    // Track city visit analytics
    try {
      await supabase.from('world_analytics').insert({
        layer_type: 'city',
        entity_id: 'homepage',
        metric_type: 'view',
        metric_value: 1,
        user_id: userId,
        recorded_at: new Date().toISOString()
      });
    } catch (analyticsError) {
      console.error('Error tracking analytics:', analyticsError);
    }

    const cityData = {
      halls: halls || [],
      trendingStreets,
      featuredChapels,
      welcomeMessage
    };

    // Cache for 5 minutes on CDN, 1 minute in browser
    const response = createSuccessResponse(cityData, 'City data retrieved successfully');
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');

    return response;

  } catch (error) {
    console.error('City API error:', error);
    return handleSupabaseError(error, 'process city request');
  }
}