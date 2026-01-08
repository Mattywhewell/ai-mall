import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { userId, curatorName, interactionType, userMessage, curatorResponse } = await request.json();

    if (!userId || !curatorName) {
      return NextResponse.json(
        { error: 'userId and curatorName are required' },
        { status: 400 }
      );
    }

    // Record curator interaction
    const { data: memory, error: memoryError } = await supabase
      .from('curator_memories')
      .insert({
        user_id: userId,
        curator_name: curatorName,
        interaction_type: interactionType || 'chat',
        user_message: userMessage,
        curator_response: curatorResponse,
        emotional_context: {},
      })
      .select()
      .single();

    if (memoryError) throw memoryError;

    // Update last interaction timestamp
    await supabase
      .from('curator_memories')
      .update({ last_interaction: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('curator_name', curatorName);

    return NextResponse.json({ success: true, data: memory });
  } catch (error: any) {
    console.error('Curator interaction error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record curator interaction' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const curatorName = searchParams.get('curatorName');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('curator_memories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (curatorName) {
      query = query.eq('curator_name', curatorName);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Curator fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch curator memories' },
      { status: 500 }
    );
  }
}
