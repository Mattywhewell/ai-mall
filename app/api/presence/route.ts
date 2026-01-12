/**
 * Presence API Endpoint
 * Manages user presence in districts for the ghost layer
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { createAndValidateApiKey } from '@/lib/auth/api-key-auth';

export async function GET(request: NextRequest) {
  try {
    // Validate API key
    const authResult = await createAndValidateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized', message: authResult.error },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const district = searchParams.get('district');
    const userId = searchParams.get('userId');

    if (district) {
      // Get presence in district
      const { data: presence, error } = await supabase
        .from('presence_logs')
        .select('*')
        .eq('district', district)
        .is('exited_at', null) // Only active presence
        .order('entered_at', { ascending: false });

      if (error) throw error;

      // Group by activity type for heatmap data
      const heatmap = presence?.reduce((acc, p) => {
        const activity = p.activity_type;
        if (!acc[activity]) {
          acc[activity] = [];
        }
        acc[activity].push({
          position: p.position,
          entered_at: p.entered_at,
          // Don't include user_id for anonymity
        });
        return acc;
      }, {} as Record<string, any[]>);

      return NextResponse.json({
        district,
        activeUsers: presence?.length || 0,
        heatmap
      });
    }

    if (userId) {
      // Get user's presence history
      const { data: history, error } = await supabase
        .from('presence_logs')
        .select('*')
        .eq('user_id', userId)
        .order('entered_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return NextResponse.json({ history });
    }

    // Get global presence summary
    const { data: allPresence, error } = await supabase
      .from('presence_logs')
      .select('district, activity_type')
      .is('exited_at', null);

    if (error) throw error;

    const summary = allPresence?.reduce((acc, p) => {
      if (!acc[p.district]) {
        acc[p.district] = { total: 0, activities: {} };
      }
      acc[p.district].total++;
      acc[p.district].activities[p.activity_type] =
        (acc[p.district].activities[p.activity_type] || 0) + 1;
      return acc;
    }, {} as Record<string, { total: number; activities: Record<string, number> }>);

    return NextResponse.json({ districts: summary });

  } catch (error) {
    console.error('Error in presence GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const authResult = await createAndValidateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized', message: authResult.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, userId, district, position, activityType, sessionId } = body;

    switch (action) {
      case 'enter': {
        if (!userId || !district || !position) {
          return NextResponse.json(
            { error: 'Missing userId, district, or position' },
            { status: 400 }
          );
        }

        // First, close any existing active sessions for this user
        await supabase
          .from('presence_logs')
          .update({ exited_at: new Date().toISOString() })
          .eq('user_id', userId)
          .is('exited_at', null);

        // Create new presence entry
        const { data, error } = await supabase
          .from('presence_logs')
          .insert({
            user_id: userId,
            district,
            position,
            activity_type: activityType || 'exploring',
            session_id: sessionId,
            entered_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;

        return NextResponse.json({
          success: true,
          presenceId: data.id,
          message: 'Presence recorded'
        });
      }

      case 'update': {
        if (!userId || !position) {
          return NextResponse.json(
            { error: 'Missing userId or position' },
            { status: 400 }
          );
        }

        // Update current active presence
        const { data, error } = await supabase
          .from('presence_logs')
          .update({
            position,
            activity_type: activityType || 'exploring'
          })
          .eq('user_id', userId)
          .is('exited_at', null)
          .select()
          .single();

        if (error) throw error;

        return NextResponse.json({
          success: true,
          message: 'Presence updated'
        });
      }

      case 'exit': {
        if (!userId) {
          return NextResponse.json(
            { error: 'Missing userId' },
            { status: 400 }
          );
        }

        // Close active presence
        const { data, error } = await supabase
          .from('presence_logs')
          .update({ exited_at: new Date().toISOString() })
          .eq('user_id', userId)
          .is('exited_at', null)
          .select()
          .single();

        if (error) throw error;

        return NextResponse.json({
          success: true,
          message: 'Presence ended',
          duration: data.duration
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in presence POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}