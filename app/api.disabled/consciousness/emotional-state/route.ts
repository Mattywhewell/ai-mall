import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { userId, emotion, intensity, context } = await request.json();

    if (!userId || !emotion) {
      return NextResponse.json(
        { error: 'userId and emotion are required' },
        { status: 400 }
      );
    }

    // Record emotional state
    const { data, error } = await supabase
      .from('user_emotional_states')
      .insert({
        user_id: userId,
        primary_emotion: emotion,
        intensity: intensity || 50,
        context: context || {},
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Emotional state tracking error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to track emotional state' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get recent emotional states
    const { data, error } = await supabase
      .from('user_emotional_states')
      .select('*')
      .eq('user_id', userId)
      .order('detected_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Emotional state fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch emotional states' },
      { status: 500 }
    );
  }
}
