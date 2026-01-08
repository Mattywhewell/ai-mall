import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';
import { detectEmotionalState } from '@/lib/autonomous/emotional-intelligence-engine';

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
      recent_searches = [],
      browsing_speed = 'medium',
      navigation_pattern = 'focused',
      time_of_day,
      repeat_visits_today = 0,
      cart_abandonment_count = 0,
      viewed_chapels = [],
      session_id
    } = body;

    // Detect emotional state
    const emotionalState = await detectEmotionalState({
      user_id: user.id,
      recent_searches,
      browsing_speed,
      navigation_pattern,
      time_of_day: time_of_day || new Date().getHours(),
      repeat_visits_today,
      cart_abandonment_count,
      viewed_chapels,
    });

    // Store in database
    const { data: savedState, error } = await supabase
      .from('user_emotional_states')
      .insert({
        user_id: user.id,
        session_id: session_id || null,
        primary_emotion: emotionalState.primary_emotion,
        intensity: emotionalState.intensity,
        needs: emotionalState.needs,
        recommended_journey: emotionalState.recommended_journey,
        chapel_affinity: emotionalState.chapel_affinity,
        color_palette: emotionalState.color_palette,
        music_tempo: emotionalState.music_tempo,
        behavioral_signals: {
          recent_searches,
          browsing_speed,
          navigation_pattern,
          time_of_day,
          repeat_visits_today,
          cart_abandonment_count,
          viewed_chapels,
        },
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving emotional state:', error);
      return NextResponse.json({ error: 'Failed to save state' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      emotional_state: emotionalState,
      state_id: savedState.id,
    });

  } catch (error) {
    console.error('Emotion detection error:', error);
    return NextResponse.json(
      { error: 'Failed to detect emotion' },
      { status: 500 }
    );
  }
}
