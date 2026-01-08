import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Get user ID
    const userId = `anon_${Math.random().toString(36).substring(7)}`;

    // Fetch chapel data
    const { data: chapel, error: chapelError } = await supabase
      .from('chapels')
      .select('*')
      .eq('slug', slug)
      .single();

    if (chapelError || !chapel) {
      return NextResponse.json(
        { error: 'Chapel not found' },
        { status: 404 }
      );
    }

    // Fetch parent hall if connected
    let parentHall = null;
    if (chapel.connected_to_hall) {
      const { data: hallData } = await supabase
        .from('halls')
        .select('*')
        .eq('id', chapel.connected_to_hall)
        .single();
      parentHall = hallData;
    }

    // Get existing AI spirit if available
    const { data: existingSpirit } = await supabase
      .from('ai_spirits')
      .select('*')
      .eq('entity_type', 'chapel')
      .eq('entity_id', chapel.id)
      .single();

    // Create simple static spirit data if none exists
    const spirit = existingSpirit?.spirit_data || {
      name: `Guardian of ${chapel.name}`,
      greeting: chapel.ai_insight || 'Welcome to this sacred space.',
      emotion: chapel.emotion,
      voice_style: 'gentle'
    };

    // Simple spirit message based on emotion
    const emotionMessages: Record<string, string> = {
      contemplation: 'In this quiet moment, what truth seeks you?',
      joy: 'Let your heart be light. Joy multiplies when shared.',
      mystery: 'Some questions are meant to linger. Sit with the unknown.',
      serenity: 'Breathe deeply. Peace is not found, but remembered.',
      wonder: 'Open your eyes anew. Magic hides in plain sight.'
    };

    const spiritMessage = emotionMessages[chapel.emotion] || 
      'Welcome to this sacred space. Take a moment to simply be.';

    // Simple atmospheric description
    const atmosphericDescription = `${chapel.micro_story} ${chapel.ai_insight}`;

    // Increment visit count
    await supabase
      .from('chapels')
      .update({ visit_count: (chapel.visit_count || 0) + 1 })
      .eq('id', chapel.id);

    return NextResponse.json({
      chapel: chapel,
      spirit: spirit,
      spirit_message: spiritMessage,
      atmospheric_description: atmosphericDescription,
      parent_hall: parentHall
    });

  } catch (error) {
    console.error('Error fetching chapel:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
