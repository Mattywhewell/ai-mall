import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';
import { NotificationService } from '@/lib/notifications/notification-service';
import { withRateLimit, rateLimiters } from '@/lib/rate-limiting/rate-limiter';
import { getPermissionChecker, Permission, requirePermission } from '@/lib/permissions/permission-system';

/**
 * GET /api/admin/suppliers
 * Get all suppliers for admin management
 */
export async function GET(request: Request) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(request, rateLimiters.admin);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

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

    // Check if user has required permissions
    const hasPermission = await getPermissionChecker().hasPermission(user.id, Permission.ADMIN_MANAGE_SUPPLIERS);
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get all suppliers with their stats
    const { data: suppliers, error } = await supabase
      .from('supplier_dashboard_stats')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch suppliers error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch suppliers' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      suppliers: suppliers || [],
      total: suppliers?.length || 0
    });
  } catch (error) {
    console.error('Suppliers management error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/suppliers/[id]/action
 * Take action on a supplier (approve, reject, suspend, etc.)
 */
export async function POST(request: Request) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(request, rateLimiters.admin);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { supplierId, action, reason } = body; // action: 'approve', 'reject', 'suspend', 'activate'

    // Get authenticated user and verify admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has required permissions
    const hasPermission = await getPermissionChecker().hasPermission(user.id, Permission.SUPPLIER_APPROVE);
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    if (!supplierId || !action) {
      return NextResponse.json(
        { error: 'Supplier ID and action required' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      // Approve supplier account
      const { error: approveError } = await supabase
        .from('suppliers')
        .update({ status: 'approved' })
        .eq('id', supplierId);

      if (approveError) {
        console.error('Approve supplier error:', approveError);
        return NextResponse.json(
          { error: 'Failed to approve supplier' },
          { status: 500 }
        );
      }

      // Log the action
      await supabase
        .from('audit_logs')
        .insert({
          table_name: 'suppliers',
          record_id: supplierId,
          action: 'UPDATE',
          actor_role: 'admin',
          actor_id: user.id,
          changes: { status: 'approved' },
          metadata: {
            event: 'supplier_approved',
            reason: reason || 'Admin approval'
          }
        });

      // Send notification
      await NotificationService.notifySupplierApproval(supplierId);

      return NextResponse.json({
        success: true,
        message: 'Supplier approved successfully'
      });
    } else if (action === 'reject') {
      // Reject supplier account
      const { error: rejectError } = await supabase
        .from('suppliers')
        .update({ status: 'rejected' })
        .eq('id', supplierId);

      if (rejectError) {
        console.error('Reject supplier error:', rejectError);
        return NextResponse.json(
          { error: 'Failed to reject supplier' },
          { status: 500 }
        );
      }

      // Log the action
      await supabase
        .from('audit_logs')
        .insert({
          table_name: 'suppliers',
          record_id: supplierId,
          action: 'UPDATE',
          actor_role: 'admin',
          actor_id: user.id,
          changes: { status: 'rejected' },
          metadata: {
            event: 'supplier_rejected',
            reason: reason || 'Admin review'
          }
        });

      // Send notification
      await NotificationService.notifySupplierRejection(supplierId, reason);

      return NextResponse.json({
        success: true,
        message: 'Supplier rejected'
      });
    } else if (action === 'suspend') {
      // Suspend supplier account
      const { error: suspendError } = await supabase
        .from('suppliers')
        .update({ status: 'suspended' })
        .eq('id', supplierId);

      if (suspendError) {
        console.error('Suspend supplier error:', suspendError);
        return NextResponse.json(
          { error: 'Failed to suspend supplier' },
          { status: 500 }
        );
      }

      // Log the action
      await supabase
        .from('audit_logs')
        .insert({
          table_name: 'suppliers',
          record_id: supplierId,
          action: 'UPDATE',
          actor_role: 'admin',
          actor_id: user.id,
          changes: { status: 'suspended' },
          metadata: {
            event: 'supplier_suspended',
            reason: reason || 'Admin review'
          }
        });

      return NextResponse.json({
        success: true,
        message: 'Supplier suspended successfully'
      });
    } else if (action === 'activate') {
      // Activate supplier account
      const { error: activateError } = await supabase
        .from('suppliers')
        .update({ status: 'active' })
        .eq('id', supplierId);

      if (activateError) {
        console.error('Activate supplier error:', activateError);
        return NextResponse.json(
          { error: 'Failed to activate supplier' },
          { status: 500 }
        );
      }

      // Log the action
      await supabase
        .from('audit_logs')
        .insert({
          table_name: 'suppliers',
          record_id: supplierId,
          action: 'UPDATE',
          actor_role: 'admin',
          actor_id: user.id,
          changes: { status: 'active' },
          metadata: {
            event: 'supplier_activated',
            reason: reason || 'Admin activation'
          }
        });

      return NextResponse.json({
        success: true,
        message: 'Supplier activated successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "approve", "reject", "suspend", or "activate"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Supplier management action error:', error);
    return NextResponse.json(
      { error: 'Failed to process supplier action' },
      { status: 500 }
    );
  }
}