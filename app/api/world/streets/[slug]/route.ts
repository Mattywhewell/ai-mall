/**
 * Street API Endpoint
 * Returns street data with districts and AI spirit
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { AISpiritSystem } from '@/lib/ai-city/spirits';
import { WorldRenderer } from '@/lib/ai-city/world-renderer';
import { Street, AISpirit } from '@/lib/types/world';
import { log as ndLog, timeAsync } from '@/lib/server-ndjson';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const start = Date.now();
  try {
    const streetSlug = params.slug;
    ndLog('info','api_request_start',{route:'world.street', method: 'GET', url: request.url, slug: streetSlug});

    // Fetch street data
    const { data: street, error: streetError } = await timeAsync('supabase.streets.single', async () => {
      return await supabase
        .from('streets')
        .select('*')
        .eq('slug', streetSlug)
        .single();
    }, { slug: streetSlug });

    if (streetError || !street) {
      ndLog('warn','resource_not_found',{resource:'street', slug: streetSlug});
      ndLog('info','api_request_end',{route:'world.street', duration_ms: Date.now()-start, status: 404});
      return NextResponse.json({ error: 'Street not found' }, { status: 404 });
    }

    // Fetch connected districts (microstores)
    const { data: districts, error: districtsError } = await timeAsync('supabase.microstores', async () => {
      return await supabase
        .from('microstores')
        .select('*')
        .in('id', street.districts || [])
        .order('created_at', { ascending: true });
    }, { street: streetSlug });

    if (districtsError) {
      ndLog('error','dependency_error',{name:'supabase.microstores', error: String(districtsError)});
      ndLog('info','api_request_end',{route:'world.street', duration_ms: Date.now()-start, status: 500});
      return NextResponse.json({ error: 'Failed to fetch districts' }, { status: 500 });
    }



    // Get or generate AI spirit
    let spirit: AISpirit | null = null;
    try {
      const { data: existingSpirit } = await timeAsync('supabase.ai_spirits.single', async () => {
        return await supabase
          .from('ai_spirits')
          .select('spirit_data')
          .eq('entity_type', 'street')
          .eq('entity_id', street.id)
          .single();
      }, { street: streetSlug });

      if (existingSpirit?.spirit_data) {
        spirit = existingSpirit.spirit_data as AISpirit;
      } else {
        // Generate new spirit
        spirit = await timeAsync('AISpiritSystem.generateStreetSpirit', async () => AISpiritSystem.generateStreetSpirit(street), { street: streetSlug });
      }
    } catch (spiritError) {
      ndLog('error','dependency_error',{name:'AISpiritSystem.generateStreetSpirit', error: String(spiritError)});
      spirit = AISpiritSystem.getDefaultSpirit('street');
    }

    // Generate atmospheric description
    let atmosphericDescription = '';
    try {
      atmosphericDescription = await timeAsync('WorldRenderer.generateAtmosphericDescription', async () => WorldRenderer.generateAtmosphericDescription(street, 'street'), { street: streetSlug });
    } catch (error) {
      ndLog('warn','dependency_error',{name:'WorldRenderer.generateAtmosphericDescription', error: String(error)});
      atmosphericDescription = `Welcome to ${street.name}, where ${street.personality} culture thrives.`;
    }

    // Track street visit analytics
    try {
      await timeAsync('supabase.world_analytics.insert', async () => {
        return await supabase.from('world_analytics').insert({
          layer_type: 'street',
          entity_id: street.id,
          metric_type: 'view',
          metric_value: 1,
          recorded_at: new Date().toISOString()
        });
      }, { street: streetSlug });
    } catch (analyticsError) {
      ndLog('warn','dependency_error',{name:'supabase.world_analytics.insert', error: String(analyticsError)});
    }

    ndLog('info','api_request_end',{route:'world.street', duration_ms: Date.now()-start, status: 200});

    return NextResponse.json({
      street,
      spirit,
      districts: districts || [],
      atmospheric_description: atmosphericDescription
    });

  } catch (error) {
    ndLog('error','api_request_failed',{route:'world.street', error: String(error)});
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}