import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

/**
 * GET /api/admin/flagged-products
 * Get all flagged products for admin review
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

    // Get flagged products using the view
    const { data: flaggedProducts, error } = await supabase
      .from('flagged_products')
      .select('*')
      .order('flagged_at', { ascending: false });

    if (error) {
      console.error('Fetch flagged products error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch flagged products' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      flaggedProducts: flaggedProducts || [],
      total: flaggedProducts?.length || 0
    });
  } catch (error) {
    console.error('Flagged products error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flagged products' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/flagged-products/[id]/action
 * Take action on a flagged product (unflag, suspend, etc.)
 */
export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { productId, action, reason } = body; // action: 'unflag', 'suspend', 'remove'

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

    if (action === 'unflag') {
      // Remove flag from product
      const { error: unflagError } = await supabase
        .from('products')
        .update({
          flagged: false,
          flag_reason: null,
          flagged_at: null,
          flagged_by: null
        })
        .eq('id', productId);

      if (unflagError) {
        console.error('Unflag product error:', unflagError);
        return NextResponse.json(
          { error: 'Failed to unflag product' },
          { status: 500 }
        );
      }

      // Log the action
      await supabase
        .from('audit_logs')
        .insert({
          table_name: 'products',
          record_id: productId,
          action: 'UPDATE',
          actor_role: 'admin',
          actor_id: user.id,
          changes: {
            flagged: false,
            flag_reason: null
          },
          metadata: {
            event: 'product_unflagged',
            reason: reason || 'Admin review'
          }
        });

      return NextResponse.json({
        success: true,
        message: 'Product unflagged successfully'
      });
    } else if (action === 'suspend') {
      // Suspend the product
      const { error: suspendError } = await supabase
        .from('products')
        .update({
          status: 'suspended',
          flagged: false // Remove flag since it's now suspended
        })
        .eq('id', productId);

      if (suspendError) {
        console.error('Suspend product error:', suspendError);
        return NextResponse.json(
          { error: 'Failed to suspend product' },
          { status: 500 }
        );
      }

      // Log the action
      await supabase
        .from('audit_logs')
        .insert({
          table_name: 'products',
          record_id: productId,
          action: 'UPDATE',
          actor_role: 'admin',
          actor_id: user.id,
          changes: { status: 'suspended' },
          metadata: {
            event: 'product_suspended',
            reason: reason || 'Admin review'
          }
        });

      return NextResponse.json({
        success: true,
        message: 'Product suspended successfully'
      });
    } else if (action === 'remove') {
      // Mark for removal (soft delete)
      const { error: removeError } = await supabase
        .from('products')
        .update({
          status: 'removed',
          flagged: false
        })
        .eq('id', productId);

      if (removeError) {
        console.error('Remove product error:', removeError);
        return NextResponse.json(
          { error: 'Failed to remove product' },
          { status: 500 }
        );
      }

      // Log the action
      await supabase
        .from('audit_logs')
        .insert({
          table_name: 'products',
          record_id: productId,
          action: 'UPDATE',
          actor_role: 'admin',
          actor_id: user.id,
          changes: { status: 'removed' },
          metadata: {
            event: 'product_removed',
            reason: reason || 'Admin review'
          }
        });

      return NextResponse.json({
        success: true,
        message: 'Product marked for removal'
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "unflag", "suspend", or "remove"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Flagged product action error:', error);
    return NextResponse.json(
      { error: 'Failed to process flagged product action' },
      { status: 500 }
    );
  }
}