import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

/**
 * GET /api/admin/pending-approvals
 * Get all pending product approvals for admin review
 */
export async function GET() {
  try {
    const supabase = getSupabaseClient();

    // Get authenticated user and verify admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userRole, error: roleError } = await supabase
      .rpc('get_user_role', { user_id: user.id });

    if (roleError || userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get pending approvals using the view
    const { data: pendingApprovals, error } = await supabase
      .from('pending_approvals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch pending approvals error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pending approvals' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      pendingApprovals: pendingApprovals || [],
      total: pendingApprovals?.length || 0
    });
  } catch (error) {
    console.error('Pending approvals error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending approvals' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/pending-approvals/[id]/approve
 * Approve a pending product
 */
export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { productId, action } = body; // action: 'approve' or 'reject'

    // Get authenticated user and verify admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userRole, error: roleError } = await supabase
      .rpc('get_user_role', { user_id: user.id });

    if (roleError || userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    if (!productId || !action) {
      return NextResponse.json(
        { error: 'Product ID and action required' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      // Use the approve_pending_product function
      const { error: approveError } = await supabase
        .rpc('approve_pending_product', {
          product_id: productId,
          admin_id: user.id
        });

      if (approveError) {
        console.error('Approve product error:', approveError);
        return NextResponse.json(
          { error: 'Failed to approve product' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Product approved successfully'
      });
    } else if (action === 'reject') {
      // Move to rejected status
      const { error: rejectError } = await supabase
        .from('pending_products')
        .update({ status: 'rejected' })
        .eq('id', productId);

      if (rejectError) {
        console.error('Reject product error:', rejectError);
        return NextResponse.json(
          { error: 'Failed to reject product' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Product rejected'
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "approve" or "reject"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Pending approval action error:', error);
    return NextResponse.json(
      { error: 'Failed to process approval action' },
      { status: 500 }
    );
  }
}