/**
 * City API Endpoint
 * Returns personalized city overview with halls, trending streets, featured chapels
 */

import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { log as ndLog } from '@/lib/server-ndjson';
import { WorldRenderer } from '@/lib/ai-city/world-renderer';
import { AISpiritSystem } from '@/lib/ai-city/spirits';
import { Hall, Street, Chapel } from '@/lib/types/world';
import { createSuccessResponse, handleSupabaseError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const start = Date.now();
  try {
    ndLog('info','api_request_start',{route:'world.city', method: 'GET', url: request.url, pathname: request.nextUrl.pathname});

    // Get user ID from auth (if available)
    const authHeader = request.headers.get('authorization');
    let userId = null;

    if (authHeader?.startsWith('Bearer ')) {
      // TODO: Validate JWT token and extract user ID
      // For now, we'll work without user personalization
    }

    // Fetch all halls
    ndLog('info','dependency_call.start',{name:'supabase.halls'});
    const hallsStart = Date.now();
    const { data: halls, error: hallsError } = await supabase
      .from('halls')
      .select('*')
      .order('created_at', { ascending: true });
    ndLog('info','dependency_call.end',{name:'supabase.halls', duration_ms: Date.now()-hallsStart, rows: Array.isArray(halls) ? halls.length : 0, error: hallsError ? String(hallsError) : null});

    if (hallsError) {
      ndLog('error','dependency_error',{name:'supabase.halls', error: String(hallsError)});
      return handleSupabaseError(hallsError, 'fetch halls');
    }

    // Fetch streets with popularity
    ndLog('info','dependency_call.start',{name:'supabase.streets'});
    const streetsStart = Date.now();
    const { data: streets, error: streetsError } = await supabase
      .from('streets')
      .select('*')
      .order('popularity_score', { ascending: false });
    ndLog('info','dependency_call.end',{name:'supabase.streets', duration_ms: Date.now()-streetsStart, rows: Array.isArray(streets) ? streets.length : 0, error: streetsError ? String(streetsError) : null});

    if (streetsError) {
      ndLog('error','dependency_error',{name:'supabase.streets', error: String(streetsError)});
      return handleSupabaseError(streetsError, 'fetch streets');
    }

    // Fetch chapels
    ndLog('info','dependency_call.start',{name:'supabase.chapels'});
    const chapelsStart = Date.now();
    const { data: chapels, error: chapelsError } = await supabase
      .from('chapels')
      .select('*')
      .order('visit_count', { ascending: false });
    ndLog('info','dependency_call.end',{name:'supabase.chapels', duration_ms: Date.now()-chapelsStart, rows: Array.isArray(chapels) ? chapels.length : 0, error: chapelsError ? String(chapelsError) : null});

    if (chapelsError) {
      ndLog('error','dependency_error',{name:'supabase.chapels', error: String(chapelsError)});
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

      ndLog('info','dependency_call.start',{name:'AISpiritSystem.generateWelcomeMessage'});
      const aiStart = Date.now();
      welcomeMessage = await AISpiritSystem.generateWelcomeMessage(
        halls || [],
        trendingStreets,
        timeContext
      );
      ndLog('info','dependency_call.end',{name:'AISpiritSystem.generateWelcomeMessage', duration_ms: Date.now()-aiStart});
    } catch (error) {
      ndLog('error','dependency_error',{name:'AISpiritSystem.generateWelcomeMessage', error: String(error)});
      welcomeMessage = "Welcome to the AI City, where every space tells a story.";
    }

    // Track city visit analytics
    try {
      ndLog('info','dependency_call.start',{name:'supabase.world_analytics.insert'});
      const analyticsStart = Date.now();
      await supabase.from('world_analytics').insert({
        layer_type: 'city',
        entity_id: 'homepage',
        metric_type: 'view',
        metric_value: 1,
        user_id: userId,
        recorded_at: new Date().toISOString()
      });
      ndLog('info','dependency_call.end',{name:'supabase.world_analytics.insert', duration_ms: Date.now()-analyticsStart});
    } catch (analyticsError) {
      ndLog('warn','dependency_error',{name:'supabase.world_analytics.insert', error: String(analyticsError)});
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

    ndLog('info','api_request_end',{route:'world.city', duration_ms: Date.now()-start, status: 200});

    return response;

  } catch (error) {
    ndLog('error','api_request_failed',{route:'world.city', error: String(error)});
    return handleSupabaseError(error, 'process city request');
  }
}