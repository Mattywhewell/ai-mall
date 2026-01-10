import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';
import { createPersonalRitual } from '@/lib/autonomous/emotional-intelligence-engine';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // Get user session
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      product_ids = [],
      curator_name,
      emotional_context
    } = body;

    if (product_ids.length === 0) {
      return NextResponse.json({ error: 'At least one product required' }, { status: 400 });
    }

    // Get product details
    const { data: products } = await supabase
      .from('products')
      .select('id, name, description, category')
      .in('id', product_ids);

    if (!products || products.length === 0) {
      return NextResponse.json({ error: 'Products not found' }, { status: 404 });
    }

    // Transform products to expected format
    const productsForRitual = products.map(p => ({
      title: p.name,
      category: p.category,
    }));

    // Get user's emotional state
    const { data: emotionalState } = await supabase
      .from('user_emotional_states')
      .select('*')
      .eq('user_id', user.id)
      .order('detected_at', { ascending: false })
      .limit(1)
      .single();

    // Create ritual using products array
    const ritual = await createPersonalRitual(
      productsForRitual,
      {
        primary_emotion: emotionalState?.primary_emotion || 'seeking',
        intensity: emotionalState?.intensity || 50,
        needs: emotionalState?.needs || ['discovery'],
        recommended_journey: emotionalState?.recommended_journey || 'exploratory',
        chapel_affinity: emotionalState?.chapel_affinity || 'Wonder',
        color_palette: emotionalState?.color_palette || ['blue'],
        music_tempo: emotionalState?.music_tempo || 'medium',
        detected_from: [],
        user_id: user.id,
      }
    );

    // Save to database
    const { data: savedRitual, error } = await supabase
      .from('personal_rituals')
      .insert({
        user_id: user.id,
        curator_name: curator_name || 'sage',
        ritual_name: ritual.ritual_name,
        intention: ritual.intention,
        steps: ritual.steps,
        duration: ritual.duration,
        best_time: ritual.best_time,
        products_used: product_ids,
        product_notes: {},
        created_for_emotion: emotionalState?.primary_emotion || 'seeking',
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving ritual:', error);
      return NextResponse.json({ error: 'Failed to save ritual' }, { status: 500 });
    }

    // Update curator memory
    if (curator_name) {
      const { data: memory } = await supabase
        .from('curator_memories')
        .select('rituals_created')
        .eq('user_id', user.id)
        .eq('curator_name', curator_name)
        .single();
      
      if (memory) {
        await supabase
          .from('curator_memories')
          .update({ rituals_created: memory.rituals_created + 1 })
          .eq('user_id', user.id)
          .eq('curator_name', curator_name);
      }
    }

    return NextResponse.json({
      success: true,
      ritual: {
        id: savedRitual.id,
        ...ritual,
        products,
      },
    });

  } catch (error) {
    console.error('Ritual creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create ritual' },
      { status: 500 }
    );
  }
}
