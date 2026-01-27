/**
 * Hall API Endpoint
 * Returns hall data with AI spirit and connected streets
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { log as ndLog } from '@/lib/server-ndjson';
import { AISpiritSystem } from '@/lib/ai-city/spirits';
import { WorldRenderer } from '@/lib/ai-city/world-renderer';
import { Hall, Street, AISpirit } from '@/lib/types/world';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const hallSlug = params.slug;
    ndLog('info','api_request_start',{route:'world.hall', method:'GET', hallSlug, url: request.url});

    // Fetch hall data
    ndLog('info','dependency_call.start',{name:'supabase.halls.single', hallSlug});
    const hallStart = Date.now();
    const { data: hall, error: hallError } = await supabase
      .from('halls')
      .select('*')
      .eq('slug', hallSlug)
      .single();
    ndLog('info','dependency_call.end',{name:'supabase.halls.single', duration_ms: Date.now()-hallStart, found: !!hall, error: hallError ? String(hallError) : null});

    if (hallError || !hall) {
      return NextResponse.json({ error: 'Hall not found' }, { status: 404 });
    }

    // Fetch connected streets
    ndLog('info','dependency_call.start',{name:'supabase.streets.connects_hall', hallId: hall.id});
    const streetsStart = Date.now();
    const { data: streets, error: streetsError } = await supabase
      .from('streets')
      .select('*')
      .eq('connects_hall', hall.id)
      .order('popularity_score', { ascending: false });
    ndLog('info','dependency_call.end',{name:'supabase.streets.connects_hall', duration_ms: Date.now()-streetsStart, rows: Array.isArray(streets) ? streets.length : 0, error: streetsError ? String(streetsError) : null});

    if (streetsError) {
      ndLog('error','dependency_error',{name:'supabase.streets.connects_hall', error: String(streetsError)});
      return NextResponse.json({ error: 'Failed to fetch connected streets' }, { status: 500 });
    }

    // Get or generate AI spirit
    let spirit: AISpirit | null = null;
    try {
      const { data: existingSpirit } = await supabase
        .from('ai_spirits')
        .select('spirit_data')
        .eq('entity_type', 'hall')
        .eq('entity_id', hall.id)
        .single();

      if (existingSpirit?.spirit_data) {
        spirit = existingSpirit.spirit_data as AISpirit;
      } else {
        // Generate new spirit
        spirit = await AISpiritSystem.generateHallSpirit(hall);
      }
    } catch (spiritError) {
      ndLog('error','dependency_error',{name:'AISpiritSystem.generateHallSpirit', error: String(spiritError)});
      spirit = AISpiritSystem.getDefaultSpirit('hall');
    }

    // Generate atmospheric description
    let atmosphericDescription = '';
    try {
      ndLog('info','dependency_call.start',{name:'WorldRenderer.generateAtmosphericDescription', hallId: hall.id});
      const genStart = Date.now();
      atmosphericDescription = await WorldRenderer.generateAtmosphericDescription(hall, 'hall');
      ndLog('info','dependency_call.end',{name:'WorldRenderer.generateAtmosphericDescription', duration_ms: Date.now()-genStart});
    } catch (error) {
      ndLog('warn','dependency_error',{name:'WorldRenderer.generateAtmosphericDescription', error: String(error)});
      atmosphericDescription = `Welcome to the ${hall.name} Hall, where ${hall.theme} comes alive.`;
    }

    // Track hall visit analytics
    try {
      ndLog('info','dependency_call.start',{name:'supabase.world_analytics.insert', hallId: hall.id});
      const anStart = Date.now();
      await supabase.from('world_analytics').insert({
        layer_type: 'hall',
        entity_id: hall.id,
        metric_type: 'view',
        metric_value: 1,
        recorded_at: new Date().toISOString()
      });
      ndLog('info','dependency_call.end',{name:'supabase.world_analytics.insert', duration_ms: Date.now()-anStart});
    } catch (analyticsError) {
      ndLog('warn','dependency_error',{name:'supabase.world_analytics.insert', error: String(analyticsError)});
    }

    ndLog('info','api_request_end',{route:'world.hall', duration_ms: Date.now()-start, status: 200});

    return NextResponse.json({
      hall,
      spirit,
      streets: streets || [],
      atmospheric_description: atmosphericDescription
    });

  } catch (error) {
    ndLog('error','api_request_failed',{route:'world.hall', error: String(error)});
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}