import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';
import { AISpiritSystem } from '@/lib/ai-city/spirits';
import { WorldRenderer } from '@/lib/ai-city/world-renderer';
import { isOpenAIConfigured } from '@/lib/ai-city/activation-helper';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { slug } = await params;

    // Get user ID from session or generate anonymous ID
    const userId = `anon_${Math.random().toString(36).substring(7)}`;

    // Fetch hall data
    const { data: hall, error: hallError } = await supabase
      .from('halls')
      .select('*')
      .eq('slug', slug)
      .single();

    if (hallError || !hall) {
      console.error('Hall fetch error:', hallError);
      return NextResponse.json(
        { error: 'Hall not found', details: hallError?.message },
        { status: 404 }
      );
    }

    // Fetch connected streets
    const { data: streets } = await supabase
      .from('streets')
      .select('*')
      .eq('connects_hall_id', hall.id)
      .order('popularity_score', { ascending: false });

    // Get or generate AI spirit
    const { data: existingSpirit } = await supabase
      .from('ai_spirits')
      .select('*')
      .eq('entity_type', 'hall')
      .eq('entity_id', hall.id)
      .single();

    let spirit = existingSpirit?.spirit_data || null;

    // Generate dynamic spirit if OpenAI is configured and no spirit exists
    if (!spirit && isOpenAIConfigured()) {
      try {
        spirit = await AISpiritSystem.generateHallSpirit(hall);
        console.log(`[AI] Generated dynamic spirit for ${hall.name}`);
      } catch (error) {
        console.error('[AI] Failed to generate spirit, using static:', error);
      }
    }

    // Parse color_palette if it's a string
    if (hall.atmosphere && typeof hall.atmosphere.color_palette === 'string') {
      hall.atmosphere.color_palette = hall.atmosphere.color_palette.split(' ').filter(Boolean);
    }

    // Generate dynamic atmospheric description if OpenAI configured
    let atmosphericDescription = hall.atmosphere?.ambient_text || `Welcome to ${hall.name}`;
    if (isOpenAIConfigured()) {
      try {
        atmosphericDescription = await WorldRenderer.generateAtmosphericDescription(
          'hall',
          hall,
          new Date().getHours() < 18 ? 'day' : 'night'
        );
      } catch (error) {
        console.error('[AI] Failed to generate atmospheric description:', error);
      }
    }

    return NextResponse.json({
      hall: hall,
      spirit: spirit,
      streets: streets || [],
      atmospheric_description: atmosphericDescription,
      ai_mode: isOpenAIConfigured() ? 'dynamic' : 'static',
      userContext: {
        userId,
        personalizedView: false
      }
    });

  } catch (error) {
    console.error('Error fetching hall:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
