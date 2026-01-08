import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';
import { curatorSpeak } from '@/lib/autonomous/ai-curator-system';

export async function POST(request: NextRequest) {
  try {
    
    // Get user session
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { curator_name, occasion = 'greeting', additional_context = '' } = body;

    if (!curator_name) {
      return NextResponse.json({ error: 'curator_name required' }, { status: 400 });
    }

    // Get curator memory
    const { data: memory } = await supabase
      .from('curator_memories')
      .select('*')
      .eq('user_id', user.id)
      .eq('curator_name', curator_name)
      .single();

    if (!memory) {
      return NextResponse.json({ error: 'Curator relationship not found' }, { status: 404 });
    }

    // Get latest emotional state
    const { data: emotionalState } = await supabase
      .from('user_emotional_states')
      .select('*')
      .eq('user_id', user.id)
      .order('detected_at', { ascending: false })
      .limit(1)
      .single();

    // Generate message
    const message = await curatorSpeak(curator_name, {
      relationship_stage: memory.relationship_stage,
      interactions_count: memory.interactions_count,
      occasion,
      additional_context: `${additional_context}. User feels ${emotionalState?.primary_emotion || 'unknown'} (intensity: ${emotionalState?.intensity || 0}).`,
    });

    // Update curator stats
    await supabase
      .from('curator_memories')
      .update({
        messages_sent: memory.messages_sent + 1,
        last_interaction: new Date().toISOString(),
      })
      .eq('id', memory.id);

    return NextResponse.json({
      success: true,
      message,
      curator_name,
      relationship_stage: memory.relationship_stage,
    });

  } catch (error) {
    console.error('Curator message error:', error);
    return NextResponse.json(
      { error: 'Failed to generate message' },
      { status: 500 }
    );
  }
}
