import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';
import { matchCuratorToUser, CURATORS } from '@/lib/autonomous/ai-curator-system';

export async function GET(request: NextRequest) {
  try {
    
    // Get user session
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's latest emotional state
    const { data: latestState } = await supabase
      .from('user_emotional_states')
      .select('*')
      .eq('user_id', user.id)
      .order('detected_at', { ascending: false })
      .limit(1)
      .single();

    if (!latestState) {
      // No emotional state yet - match based on defaults
      const defaultCurator = 'aurora'; // Default to Aurora
      return NextResponse.json({
        curator_name: defaultCurator,
        curator: CURATORS[defaultCurator],
        reason: 'Welcome to AI City! Aurora will be your guide.',
      });
    }

    // Get user's curator history
    const { data: curatorHistory } = await supabase
      .from('curator_memories')
      .select('*')
      .eq('user_id', user.id);

    // Match curator based on emotional state
    const curatorName = matchCuratorToUser({
      primary_emotion: latestState.primary_emotion,
      needs: latestState.needs,
    });

    // Get or create curator memory
    const { data: memory, error: memoryError } = await supabase
      .from('curator_memories')
      .select('*')
      .eq('user_id', user.id)
      .eq('curator_name', curatorName)
      .single();

    if (!memory) {
      // Create first meeting
      await supabase
        .from('curator_memories')
        .insert({
          user_id: user.id,
          curator_name: curatorName,
          relationship_stage: 'stranger',
          interactions_count: 1,
        });
    } else {
      // Increment interaction count
      await supabase
        .from('curator_memories')
        .update({
          interactions_count: memory.interactions_count + 1,
          last_interaction: new Date().toISOString(),
        })
        .eq('id', memory.id);
    }

    return NextResponse.json({
      curator_name: curatorName,
      curator: CURATORS[curatorName],
      relationship_stage: memory?.relationship_stage || 'stranger',
      interactions_count: (memory?.interactions_count || 0) + 1,
      emotional_context: {
        emotion: latestState.primary_emotion,
        intensity: latestState.intensity,
        needs: latestState.needs,
      },
    });

  } catch (error) {
    console.error('Curator matching error:', error);
    return NextResponse.json(
      { error: 'Failed to match curator' },
      { status: 500 }
    );
  }
}
