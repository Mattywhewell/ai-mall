/**
 * Street API Endpoint
 * Returns street data with districts and AI spirit
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { AISpiritSystem } from '@/lib/ai-city/spirits';
import { WorldRenderer } from '@/lib/ai-city/world-renderer';
import { Street, AISpirit } from '@/lib/types/world';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const streetSlug = params.slug;

    // Fetch street data
    const { data: street, error: streetError } = await supabase
      .from('streets')
      .select('*')
      .eq('slug', streetSlug)
      .single();

    if (streetError || !street) {
      return NextResponse.json({ error: 'Street not found' }, { status: 404 });
    }

    // Fetch connected districts (microstores)
    const { data: districts, error: districtsError } = await supabase
      .from('microstores')
      .select('*')
      .in('id', street.districts || [])
      .order('created_at', { ascending: true });

    if (districtsError) {
      console.error('Error fetching districts:', districtsError);
      return NextResponse.json({ error: 'Failed to fetch districts' }, { status: 500 });
    }

    // Get or generate AI spirit
    let spirit: AISpirit | null = null;
    try {
      const { data: existingSpirit } = await supabase
        .from('ai_spirits')
        .select('spirit_data')
        .eq('entity_type', 'street')
        .eq('entity_id', street.id)
        .single();

      if (existingSpirit?.spirit_data) {
        spirit = existingSpirit.spirit_data as AISpirit;
      } else {
        // Generate new spirit
        spirit = await AISpiritSystem.generateStreetSpirit(street);
      }
    } catch (spiritError) {
      console.error('Error with AI spirit:', spiritError);
      spirit = AISpiritSystem.getDefaultSpirit('street');
    }

    // Generate atmospheric description
    let atmosphericDescription = '';
    try {
      atmosphericDescription = await WorldRenderer.generateAtmosphericDescription(street, 'street');
    } catch (error) {
      console.error('Error generating atmospheric description:', error);
      atmosphericDescription = `Welcome to ${street.name}, where ${street.personality} culture thrives.`;
    }

    // Track street visit analytics
    try {
      await supabase.from('world_analytics').insert({
        layer_type: 'street',
        entity_id: street.id,
        metric_type: 'view',
        metric_value: 1,
        recorded_at: new Date().toISOString()
      });
    } catch (analyticsError) {
      console.error('Error tracking analytics:', analyticsError);
    }

    return NextResponse.json({
      street,
      spirit,
      districts: districts || [],
      atmospheric_description: atmosphericDescription
    });

  } catch (error) {
    console.error('Street API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}