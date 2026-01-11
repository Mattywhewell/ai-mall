import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';
import { withRateLimit, rateLimiters } from '@/lib/rate-limiting/rate-limiter';
import { getPermissionChecker, Permission, requirePermission } from '@/lib/permissions/permission-system';

/**
 * GET /api/admin/permissions
 * Get all users and their permissions for admin management
 */
export async function GET(request: Request) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(request, rateLimiters.admin);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const supabase = getSupabaseClient();

    // Get authenticated user and verify permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission to manage users
    const hasPermission = await permissionChecker.hasPermission(user.id, Permission.ADMIN_MANAGE_USERS);
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get all users with their roles and permissions
    const { data: users, error } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        role,
        permissions,
        created_at,
        updated_at,
        auth.users!inner(email, created_at)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch users error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error('GET /api/admin/permissions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/permissions
 * Grant or revoke permissions for a user
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
    const { userId, action, permissions } = body; // action: 'grant' or 'revoke'

    // Get authenticated user and verify permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission to manage users
    const hasPermission = await getPermissionChecker().hasPermission(user.id, Permission.ADMIN_MANAGE_USERS);
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    if (!userId || !action || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, action, permissions' },
        { status: 400 }
      );
    }

    let success = false;
    if (action === 'grant') {
      success = await getPermissionChecker().grantPermissions(
        userId,
        permissions.map(p => p as Permission),
        user.id
      );
    } else if (action === 'revoke') {
      success = await getPermissionChecker().revokePermissions(
        userId,
        permissions.map(p => p as Permission),
        user.id
      );
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be "grant" or "revoke"' },
        { status: 400 }
      );
    }

    if (!success) {
      return NextResponse.json(
        { error: `Failed to ${action} permissions` },
        { status: 500 }
      );
    }

    // Log the permission change
    await supabase.from('audit_logs').insert({
      table_name: 'user_roles',
      record_id: userId,
      action: `${action}_permissions`,
      actor_id: user.id,
      changes: {
        permissions_changed: permissions,
        action: action
      },
      metadata: {
        operation: 'permission_management',
        target_user: userId
      }
    });

    return NextResponse.json({
      success: true,
      message: `Permissions ${action}ed successfully`
    });
  } catch (error) {
    console.error('POST /api/admin/permissions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/permissions
 * Update user role
 */
export async function PUT(request: Request) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(request, rateLimiters.admin);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { userId, role } = body;

    // Get authenticated user and verify permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has permission to manage users
    const hasPermission = await getPermissionChecker().hasPermission(user.id, Permission.ADMIN_MANAGE_USERS);
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, role' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['admin', 'supplier', 'customer', 'ai_agent'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Update user role
    const { error: updateError } = await supabase
      .from('user_roles')
      .update({
        role: role as any,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Update role error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user role' },
        { status: 500 }
      );
    }

    // Log the role change
    await supabase.from('audit_logs').insert({
      table_name: 'user_roles',
      record_id: userId,
      action: 'update_role',
      actor_id: user.id,
      changes: {
        new_role: role
      },
      metadata: {
        operation: 'role_management',
        target_user: userId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User role updated successfully'
    });
  } catch (error) {
    console.error('PUT /api/admin/permissions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}