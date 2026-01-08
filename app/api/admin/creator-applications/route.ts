import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

// Get all applications (with filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase_client = supabase;

    let query = supabase_client
      .from('vendor_applications')
      .select('*', { count: 'exact' });

    if (status !== 'all') {
      query = query.eq('application_status', status);
    }

    const { data: applications, error, count } = await query
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching applications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch applications' },
        { status: 500 }
      );
    }

    // Get stats
    const { data: stats } = await supabase_client
      .from('vendor_applications')
      .select('application_status');

    const statusCounts = {
      pending: stats?.filter(s => s.application_status === 'pending').length || 0,
      reviewing: stats?.filter(s => s.application_status === 'reviewing').length || 0,
      approved: stats?.filter(s => s.application_status === 'approved').length || 0,
      rejected: stats?.filter(s => s.application_status === 'rejected').length || 0,
      waitlisted: stats?.filter(s => s.application_status === 'waitlisted').length || 0
    };

    return NextResponse.json({
      success: true,
      applications,
      count,
      limit,
      offset,
      stats: statusCounts
    });

  } catch (error) {
    console.error('Error in applications GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update application status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      application_id, 
      application_status, 
      reviewer_notes, 
      reviewed_by 
    } = body;

    if (!application_id || !application_status || !reviewed_by) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase_client = supabase;

    // Update application
    const { data: application, error } = await supabase_client
      .from('vendor_applications')
      .update({
        application_status,
        reviewer_notes,
        reviewed_by,
        reviewed_at: new Date().toISOString(),
        approved_at: application_status === 'approved' ? new Date().toISOString() : null
      })
      .eq('id', application_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating application:', error);
      return NextResponse.json(
        { error: 'Failed to update application' },
        { status: 500 }
      );
    }

    // TODO: Send email notification to applicant

    return NextResponse.json({
      success: true,
      application,
      message: `Application ${application_status}`,
      next_step: application_status === 'approved' 
        ? 'User can now create their storefront'
        : null
    });

  } catch (error) {
    console.error('Error in applications PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
