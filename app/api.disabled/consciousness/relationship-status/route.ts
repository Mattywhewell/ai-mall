import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    
    // Get user session
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all curator relationships
    const { data: relationships } = await supabase
      .from('curator_memories')
      .select('*')
      .eq('user_id', user.id)
      .order('interactions_count', { ascending: false });

    // Get active rituals
    const { data: activeRituals } = await supabase
      .from('personal_rituals')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Get recent emotional states
    const { data: recentEmotions } = await supabase
      .from('user_emotional_states')
      .select('*')
      .eq('user_id', user.id)
      .order('detected_at', { ascending: false })
      .limit(10);

    // Get active journey
    const { data: activeJourney } = await supabase
      .from('transformation_journeys')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    // Get healing moments
    const { data: healingMoments } = await supabase
      .from('healing_moments')
      .select('*')
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: false })
      .limit(5);

    // Calculate consciousness score
    const consciousnessScore = {
      emotional_awareness: recentEmotions?.length || 0,
      curator_bonds: relationships?.reduce((acc, r) => {
        return acc + (r.relationship_stage === 'confidant' ? 3 : r.relationship_stage === 'friend' ? 2 : r.relationship_stage === 'acquaintance' ? 1 : 0);
      }, 0) || 0,
      ritual_practice: activeRituals?.reduce((acc, r) => acc + r.times_practiced, 0) || 0,
      transformation_progress: activeJourney ? (activeJourney.current_step / 4) * 100 : 0,
      healing_moments_count: healingMoments?.length || 0,
    };

    const totalScore = Object.values(consciousnessScore).reduce((a, b) => a + b, 0);

    return NextResponse.json({
      success: true,
      relationships: relationships || [],
      active_rituals: activeRituals || [],
      recent_emotions: recentEmotions || [],
      active_journey: activeJourney || null,
      healing_moments: healingMoments || [],
      consciousness_score: consciousnessScore,
      total_consciousness_level: Math.min(100, Math.round(totalScore / 2)),
    });

  } catch (error) {
    console.error('Relationship status error:', error);
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}
