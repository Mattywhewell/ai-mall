import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (userId) {
      // Get suggested healing circles for user
      const { data, error } = await supabase.rpc('suggest_healing_circles', {
        p_user_id: userId,
      });

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    } else {
      // Get all public healing circles
      const { data, error } = await supabase
        .from('healing_circles')
        .select('*')
        .eq('is_open', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }
  } catch (error: any) {
    console.error('Healing circles fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch healing circles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { circleName, primaryEmotion, transformationGoal, curatorFacilitator, userId } = await request.json();

    if (!circleName || !userId) {
      return NextResponse.json(
        { error: 'circleName and userId are required' },
        { status: 400 }
      );
    }

    // Create healing circle
    const { data: circle, error: circleError } = await supabase
      .from('healing_circles')
      .insert({
        circle_name: circleName,
        primary_emotion: primaryEmotion,
        transformation_goal: transformationGoal,
        curator_facilitator: curatorFacilitator,
      })
      .select()
      .single();

    if (circleError) throw circleError;

    // Add creator as first member
    const { error: memberError } = await supabase
      .from('circle_members')
      .insert({
        circle_id: circle.id,
        user_id: userId,
        role: 'facilitator',
        starting_emotion: primaryEmotion,
      });

    if (memberError) throw memberError;

    return NextResponse.json({ success: true, data: circle });
  } catch (error: any) {
    console.error('Circle creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create healing circle' },
      { status: 500 }
    );
  }
}
