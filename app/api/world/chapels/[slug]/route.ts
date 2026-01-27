/**
 * Chapel API Endpoint
 * Returns chapel data with AI spirit and contemplative content
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { AISpiritSystem } from '@/lib/ai-city/spirits';
import { WorldRenderer } from '@/lib/ai-city/world-renderer';
import { Chapel, AISpirit } from '@/lib/types/world';
import { log as ndLog, timeAsync } from '@/lib/server-ndjson';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const start = Date.now();
  try {
    const chapelSlug = params.slug;
    ndLog('info','api_request_start',{route:'world.chapel', method: 'GET', url: request.url, slug: chapelSlug});

    // Fetch chapel data
    const { data: chapel, error: chapelError } = await timeAsync('supabase.chapels.single', async () => {
      return await supabase
        .from('chapels')
        .select('*')
        .eq('slug', chapelSlug)
        .single();
    }, { slug: chapelSlug });

    if (chapelError || !chapel) {
      ndLog('warn','resource_not_found',{resource:'chapel', slug: chapelSlug});
      ndLog('info','api_request_end',{route:'world.chapel', duration_ms: Date.now()-start, status: 404});
      return NextResponse.json({ error: 'Chapel not found' }, { status: 404 });
    }

    // Get or generate AI spirit
    let spirit: AISpirit | null = null;
    try {
      const { data: existingSpirit } = await timeAsync('supabase.ai_spirits.single', async () => {
        return await supabase
          .from('ai_spirits')
          .select('spirit_data')
          .eq('entity_type', 'chapel')
          .eq('entity_id', chapel.id)
          .single();
      }, { chapel: chapelSlug });

      if (existingSpirit?.spirit_data) {
        spirit = existingSpirit.spirit_data as AISpirit;
      } else {
        spirit = await timeAsync('AISpiritSystem.generateChapelSpirit', async () => AISpiritSystem.generateChapelSpirit(chapel), { chapel: chapelSlug });
      }
    } catch (spiritError) {
      ndLog('error','dependency_error',{name:'AISpiritSystem.generateChapelSpirit', error: String(spiritError)});
      spirit = AISpiritSystem.getDefaultSpirit('chapel');
    }

    // Generate atmospheric description
    let atmosphericDescription = '';
    try {
      atmosphericDescription = await timeAsync('WorldRenderer.generateAtmosphericDescription', async () => WorldRenderer.generateAtmosphericDescription(chapel, 'chapel'), { chapel: chapelSlug });
    } catch (error) {
      ndLog('warn','dependency_error',{name:'WorldRenderer.generateAtmosphericDescription', error: String(error)});
      atmosphericDescription = `Welcome to ${chapel.name}, a space for ${chapel.emotion} and reflection.`;
    }

    // Update visit count
    try {
      await timeAsync('supabase.chapels.update_visit_count', async () => {
        return await supabase
          .from('chapels')
          .update({
            visit_count: (chapel.visit_count || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', chapel.id);
      }, { chapel: chapelSlug });
    } catch (updateError) {
      ndLog('warn','dependency_error',{name:'supabase.chapels.update_visit_count', error: String(updateError)});
    }

    // Track chapel visit analytics
    try {
      await timeAsync('supabase.world_analytics.insert', async () => {
        return await supabase.from('world_analytics').insert({
          layer_type: 'chapel',
          entity_id: chapel.id,
          metric_type: 'view',
          metric_value: 1,
          recorded_at: new Date().toISOString()
        });
      }, { chapel: chapelSlug });
    } catch (analyticsError) {
      ndLog('warn','dependency_error',{name:'supabase.world_analytics.insert', error: String(analyticsError)});
    }

    ndLog('info','api_request_end',{route:'world.chapel', duration_ms: Date.now()-start, status: 200});

    return NextResponse.json({
      chapel: {
        ...chapel,
        visit_count: (chapel.visit_count || 0) + 1
      },
      spirit,
      atmospheric_description: atmosphericDescription
    });

  } catch (error) {
    ndLog('error','api_request_failed',{route:'world.chapel', error: String(error)});
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}