/**
 * API Route: Social Media Engine
 * POST /api/autonomous/social/calendar - Generate social calendar
 * GET /api/autonomous/social/ready - Get posts ready to publish
 */

import { NextResponse } from 'next/server';
import { SocialMediaEngine } from '@/lib/autonomous/social-media-engine';

export async function POST(request: Request) {
  try {
    const { districtSlug } = await request.json();

    if (!districtSlug) {
      return NextResponse.json(
        { error: 'districtSlug required' },
        { status: 400 }
      );
    }

    const calendar = await SocialMediaEngine.generateWeeklyCalendar(districtSlug);

    return NextResponse.json({
      message: 'Social calendar generated',
      calendar,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const readyPosts = await SocialMediaEngine.getReadyPosts();

    return NextResponse.json({
      count: readyPosts.length,
      posts: readyPosts,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
