import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      brand_name,
      brand_story,
      category,
      portfolio_urls,
      social_links,
      experience_level,
      requested_hall,
      requested_street
    } = body;

    // Validation
    if (!user_id || !brand_name || !brand_story || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if user already has an active application
    const { data: existing } = await supabase
      .from('vendor_applications')
      .select('*')
      .eq('user_id', user_id)
      .in('application_status', ['pending', 'reviewing', 'approved'])
      .single();

    if (existing) {
      return NextResponse.json(
        { 
          error: 'You already have an active application',
          application: existing
        },
        { status: 409 }
      );
    }

    // Create new application
    const { data: application, error } = await supabase
      .from('vendor_applications')
      .insert([{
        user_id,
        brand_name,
        brand_story,
        category,
        portfolio_urls: portfolio_urls || [],
        social_links: social_links || {},
        experience_level,
        requested_hall,
        requested_street,
        application_status: 'pending',
        approval_fee: 99.00,
        monthly_fee: 49.00
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating application:', error);
      return NextResponse.json(
        { error: 'Failed to create application' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      application,
      message: 'Application submitted successfully! We\'ll review it within 2-3 business days.',
      approval_fee: 99.00
    }, { status: 201 });

  } catch (error) {
    console.error('Error in apply route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get user's application status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: applications, error } = await supabase
      .from('vendor_applications')
      .select('*')
      .eq('user_id', user_id)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch applications' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      applications,
      has_pending: applications.some(app => 
        ['pending', 'reviewing'].includes(app.application_status)
      ),
      has_approved: applications.some(app => 
        app.application_status === 'approved'
      )
    });

  } catch (error) {
    console.error('Error in apply GET route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
