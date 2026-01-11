/**
 * Hall API Endpoint
 * Returns hall data with AI spirit and connected streets
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { AISpiritSystem } from '@/lib/ai-city/spirits';
import { WorldRenderer } from '@/lib/ai-city/world-renderer';
import { Hall, Street, AISpirit } from '@/lib/types/world';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const hallSlug = params.slug;

    // Fetch hall data
    const { data: hall, error: hallError } = await supabase
      .from('halls')
      .select('*')
      .eq('slug', hallSlug)
      .single();

    if (hallError || !hall) {
      return NextResponse.json({ error: 'Hall not found' }, { status: 404 });
    }

    // Fetch connected streets
    const { data: streets, error: streetsError } = await supabase
      .from('streets')
      .select('*')
      .eq('connects_hall', hall.id)
      .order('popularity_score', { ascending: false });

    if (streetsError) {
      console.error('Error fetching streets:', streetsError);
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
      console.error('Error with AI spirit:', spiritError);
      spirit = AISpiritSystem.getDefaultSpirit('hall');
    }

    // Generate atmospheric description
    let atmosphericDescription = '';
    try {
      atmosphericDescription = await WorldRenderer.generateAtmosphericDescription(hall, 'hall');
    } catch (error) {
      console.error('Error generating atmospheric description:', error);
      atmosphericDescription = `Welcome to the ${hall.name} Hall, where ${hall.theme} comes alive.`;
    }

    // Track hall visit analytics
    try {
      await supabase.from('world_analytics').insert({
        layer_type: 'hall',
        entity_id: hall.id,
        metric_type: 'view',
        metric_value: 1,
        recorded_at: new Date().toISOString()
      });
    } catch (analyticsError) {
      console.error('Error tracking analytics:', analyticsError);
    }

    return NextResponse.json({
      hall,
      spirit,
      streets: streets || [],
      atmospheric_description: atmosphericDescription
    });

  } catch (error) {
    console.error('Hall API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}