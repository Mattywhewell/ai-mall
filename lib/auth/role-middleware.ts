import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export type UserRole = 'customer' | 'supplier' | 'admin';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  user_metadata?: any;
}

/**
 * Check if user has required role(s)
 */
export async function checkUserRole(
  request: NextRequest,
  allowedRoles: UserRole[]
): Promise<{ user: AuthenticatedUser | null; error: NextResponse | null }> {
  try {
    // Check if Supabase is properly configured BEFORE making any calls
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      console.log('Supabase not configured, allowing access with default role');
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Authentication service not configured' },
          { status: 503 }
        )
      };
    }

    const supabase = getSupabaseClient();
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Missing or invalid authorization header' },
          { status: 401 }
        )
      };
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        )
      };
    }

    // Get user role from database
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError && roleError.code !== 'PGRST116') {
      console.error('Error fetching user role:', roleError);
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Failed to verify user permissions' },
          { status: 500 }
        )
      };
    }

    const userRole = (roleData?.role as UserRole) || 'citizen';

    // Check if user has required role
    if (!allowedRoles.includes(userRole)) {
      return {
        user: null,
        error: NextResponse.json(
          {
            error: 'Insufficient permissions',
            required: allowedRoles,
            current: userRole
          },
          { status: 403 }
        )
      };
    }

    return {
      user: {
        id: user.id,
        email: user.email!,
        role: userRole,
        user_metadata: user.user_metadata
      },
      error: null
    };
  } catch (error) {
    console.error('Role check error:', error);
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    };
  }
}

/**
 * Convenience function for supplier-only routes
 */
export async function requireSupplier(request: NextRequest) {
  return checkUserRole(request, ['supplier']);
}

/**
 * Convenience function for admin-only routes
 */
export async function requireAdmin(request: NextRequest) {
  return checkUserRole(request, ['admin']);
}

/**
 * Convenience function for supplier or admin routes
 */
export async function requireSupplierOrAdmin(request: NextRequest) {
  return checkUserRole(request, ['supplier', 'admin']);
}

/**
 * Get current user info without role checking
 */
export async function getCurrentUser(request: NextRequest): Promise<{ user: AuthenticatedUser | null; error: NextResponse | null }> {
  try {
    const supabase = getSupabaseClient();
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Missing authorization header' },
          { status: 401 }
        )
      };
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        )
      };
    }

    // Get user role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const userRole = (roleData?.role as UserRole) || 'citizen';

    return {
      user: {
        id: user.id,
        email: user.email!,
        role: userRole,
        user_metadata: user.user_metadata
      },
      error: null
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    };
  }
}