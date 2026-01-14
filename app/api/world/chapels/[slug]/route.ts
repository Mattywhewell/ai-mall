/**
 * Chapel API Endpoint
 * Returns chapel data with AI spirit and contemplative content
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { AISpiritSystem } from '@/lib/ai-city/spirits';
import { WorldRenderer } from '@/lib/ai-city/world-renderer';
import { Chapel, AISpirit } from '@/lib/types/world';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: chapelSlug } = await params;

    // Fetch chapel data
    const { data: chapel, error: chapelError } = await supabase
      .from('chapels')
      .select('*')
      .eq('slug', chapelSlug)
      .single();

    if (chapelError || !chapel) {
      return NextResponse.json({ error: 'Chapel not found' }, { status: 404 });
    }

    // Get or generate AI spirit
    let spirit: AISpirit | null = null;
    try {
      const { data: existingSpirit } = await supabase
        .from('ai_spirits')
        .select('spirit_data')
        .eq('entity_type', 'chapel')
        .eq('entity_id', chapel.id)
        .single();

      if (existingSpirit?.spirit_data) {
        spirit = existingSpirit.spirit_data as AISpirit;
      } else {
        // Generate new spirit
        spirit = await AISpiritSystem.generateChapelSpirit(chapel);
      }
    } catch (spiritError) {
      console.error('Error with AI spirit:', spiritError);
      spirit = AISpiritSystem.getDefaultSpirit('chapel');
    }

    // Generate atmospheric description
    let atmosphericDescription = '';
    try {
      atmosphericDescription = await WorldRenderer.generateAtmosphericDescription(chapel, 'chapel');
    } catch (error) {
      console.error('Error generating atmospheric description:', error);
      atmosphericDescription = `Welcome to ${chapel.name}, a space for ${chapel.emotion} and reflection.`;
    }

    // Update visit count
    try {
      await supabase
        .from('chapels')
        .update({
          visit_count: (chapel.visit_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', chapel.id);
    } catch (updateError) {
      console.error('Error updating visit count:', updateError);
    }

    // Track chapel visit analytics
    try {
      await supabase.from('world_analytics').insert({
        layer_type: 'chapel',
        entity_id: chapel.id,
        metric_type: 'view',
        metric_value: 1,
        recorded_at: new Date().toISOString()
      });
    } catch (analyticsError) {
      console.error('Error tracking analytics:', analyticsError);
    }

    return NextResponse.json({
      chapel: {
        ...chapel,
        visit_count: (chapel.visit_count || 0) + 1
      },
      spirit,
      atmospheric_description: atmosphericDescription
    });

  } catch (error) {
    console.error('Chapel API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}