/**
 * Rituals API Endpoint
 * Manages ritual events in the living city
 */

import { NextRequest, NextResponse } from 'next/server';
import { ritualSystem } from '@/lib/ai-city/ritual-system';
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
    const ritualId = searchParams.get('id');
    const status = searchParams.get('status');

    if (ritualId) {
      // Get specific ritual
      const ritual = ritualSystem.getRitual(ritualId);
      if (!ritual) {
        return NextResponse.json(
          { error: 'Ritual not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ ritual });
    }

    if (district) {
      // Get active rituals in district
      const rituals = ritualSystem.getActiveRituals(district);
      return NextResponse.json({ rituals });
    }

    if (status) {
      // Get rituals by status
      const allRituals = ritualSystem.getAllRituals();
      const filteredRituals = allRituals.filter(r => r.status === status);
      return NextResponse.json({ rituals: filteredRituals });
    }

    // Get all rituals summary
    const allRituals = ritualSystem.getAllRituals();
    const summary = {
      total: allRituals.length,
      active: allRituals.filter(r => r.status === 'active').length,
      scheduled: allRituals.filter(r => r.status === 'scheduled').length,
      completed: allRituals.filter(r => r.status === 'completed').length,
      byDistrict: {} as Record<string, number>
    };

    allRituals.forEach(ritual => {
      summary.byDistrict[ritual.district] = (summary.byDistrict[ritual.district] || 0) + 1;
    });

    return NextResponse.json(summary);

  } catch (error) {
    console.error('Error in rituals GET:', error);
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
    const { action, ritualId, participant } = body;

    switch (action) {
      case 'trigger': {
        if (!ritualId) {
          return NextResponse.json(
            { error: 'Missing ritualId' },
            { status: 400 }
          );
        }

        const success = await ritualSystem.triggerRitualManually(ritualId);
        if (!success) {
          return NextResponse.json(
            { error: 'Failed to trigger ritual' },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Ritual triggered successfully'
        });
      }

      case 'join': {
        if (!ritualId || !participant) {
          return NextResponse.json(
            { error: 'Missing ritualId or participant' },
            { status: 400 }
          );
        }

        await ritualSystem.addParticipant(ritualId, participant);
        return NextResponse.json({
          success: true,
          message: 'Participant added to ritual'
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in rituals POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}