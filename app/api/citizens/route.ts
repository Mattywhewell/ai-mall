/**
 * Citizens API Endpoint
 * Manages autonomous citizens in the living city
 */

import { NextRequest, NextResponse } from 'next/server';
import { citizenAIService } from '@/lib/ai-city/citizen-ai-service';
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
    const citizenId = searchParams.get('id');

    if (citizenId) {
      // Get specific citizen
      const citizen = citizenAIService.getCitizen(citizenId);
      if (!citizen) {
        return NextResponse.json(
          { error: 'Citizen not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ citizen });
    }

    if (district) {
      // Get citizens in district
      const citizens = citizenAIService.getCitizensInDistrict(district);
      return NextResponse.json({ citizens });
    }

    // Get all citizens (summary)
    const count = citizenAIService.getCitizenCount();
    return NextResponse.json({
      totalCitizens: count,
      districts: ['innovation_district', 'wellness_way', 'neon_boulevard', 'makers_sanctuary']
    });

  } catch (error) {
    console.error('Error in citizens GET:', error);
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
    const { action, district, position, citizenId } = body;

    switch (action) {
      case 'spawn': {
        if (!district || !position) {
          return NextResponse.json(
            { error: 'Missing district or position' },
            { status: 400 }
          );
        }

        const newCitizenId = await citizenAIService.spawnCitizen(district, position);
        return NextResponse.json({
          success: true,
          citizenId: newCitizenId,
          message: 'Citizen spawned successfully'
        });
      }

      case 'interact': {
        if (!citizenId) {
          return NextResponse.json(
            { error: 'Missing citizenId' },
            { status: 400 }
          );
        }

        const citizen = citizenAIService.getCitizen(citizenId);
        if (!citizen) {
          return NextResponse.json(
            { error: 'Citizen not found' },
            { status: 404 }
          );
        }

        // This would trigger interaction logic
        return NextResponse.json({
          success: true,
          citizen: citizen,
          message: 'Interaction initiated'
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in citizens POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}