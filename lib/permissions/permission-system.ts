import { getSupabaseClient } from '@/lib/supabase-server';

// Define granular permissions
export enum Permission {
  // User management
  USER_VIEW = 'user.view',
  USER_CREATE = 'user.create',
  USER_UPDATE = 'user.update',
  USER_DELETE = 'user.delete',

  // Supplier management
  SUPPLIER_VIEW = 'supplier.view',
  SUPPLIER_CREATE = 'supplier.create',
  SUPPLIER_UPDATE = 'supplier.update',
  SUPPLIER_DELETE = 'supplier.delete',
  SUPPLIER_APPROVE = 'supplier.approve',
  SUPPLIER_REJECT = 'supplier.reject',

  // Product management
  PRODUCT_VIEW = 'product.view',
  PRODUCT_CREATE = 'product.create',
  PRODUCT_UPDATE = 'product.update',
  PRODUCT_DELETE = 'product.delete',
  PRODUCT_APPROVE = 'product.approve',
  PRODUCT_FLAG = 'product.flag',

  // Admin operations
  ADMIN_VIEW = 'admin.view',
  ADMIN_MANAGE_USERS = 'admin.manage_users',
  ADMIN_MANAGE_SUPPLIERS = 'admin.manage_suppliers',
  ADMIN_MANAGE_PRODUCTS = 'admin.manage_products',
  ADMIN_VIEW_AUDIT_LOGS = 'admin.view_audit_logs',
  ADMIN_SYSTEM_CONFIG = 'admin.system_config',

  // AI operations
  AI_GENERATE = 'ai.generate',
  AI_MODERATE = 'ai.moderate',
  AI_ANALYZE = 'ai.analyze',

  // File operations
  FILE_UPLOAD = 'file.upload',
  FILE_DOWNLOAD = 'file.download',
  FILE_DELETE = 'file.delete',

  // Analytics
  ANALYTICS_VIEW = 'analytics.view',
  ANALYTICS_EXPORT = 'analytics.export',
}

// Role-based permission mappings
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    // All permissions for admin
    Permission.USER_VIEW, Permission.USER_CREATE, Permission.USER_UPDATE, Permission.USER_DELETE,
    Permission.SUPPLIER_VIEW, Permission.SUPPLIER_CREATE, Permission.SUPPLIER_UPDATE, Permission.SUPPLIER_DELETE,
    Permission.SUPPLIER_APPROVE, Permission.SUPPLIER_REJECT,
    Permission.PRODUCT_VIEW, Permission.PRODUCT_CREATE, Permission.PRODUCT_UPDATE, Permission.PRODUCT_DELETE,
    Permission.PRODUCT_APPROVE, Permission.PRODUCT_FLAG,
    Permission.ADMIN_VIEW, Permission.ADMIN_MANAGE_USERS, Permission.ADMIN_MANAGE_SUPPLIERS,
    Permission.ADMIN_MANAGE_PRODUCTS, Permission.ADMIN_VIEW_AUDIT_LOGS, Permission.ADMIN_SYSTEM_CONFIG,
    Permission.AI_GENERATE, Permission.AI_MODERATE, Permission.AI_ANALYZE,
    Permission.FILE_UPLOAD, Permission.FILE_DOWNLOAD, Permission.FILE_DELETE,
    Permission.ANALYTICS_VIEW, Permission.ANALYTICS_EXPORT,
  ],
  supplier: [
    // Supplier-specific permissions
    Permission.USER_VIEW, Permission.USER_UPDATE, // Can view/update own profile
    Permission.PRODUCT_VIEW, Permission.PRODUCT_CREATE, Permission.PRODUCT_UPDATE, // Can manage own products
    Permission.FILE_UPLOAD, Permission.FILE_DOWNLOAD, // Can upload/download files
    Permission.ANALYTICS_VIEW, // Can view own analytics
  ],
  customer: [
    // Basic customer permissions
    Permission.USER_VIEW, Permission.USER_UPDATE, // Can view/update own profile
    Permission.PRODUCT_VIEW, // Can view products
    Permission.FILE_DOWNLOAD, // Can download files
  ],
  ai_agent: [
    // AI agent permissions
    Permission.AI_GENERATE, Permission.AI_MODERATE, Permission.AI_ANALYZE,
    Permission.PRODUCT_VIEW, Permission.PRODUCT_UPDATE, // Can analyze and moderate products
  ],
};

// Permission checking functions
export class PermissionChecker {
  private supabase = getSupabaseClient();

  /**
   * Check if a user has a specific permission
   */
  async hasPermission(userId: string, permission: Permission): Promise<boolean> {
    try {
      // Get user's role
      const { data: userRole, error: roleError } = await this.supabase
        .rpc('get_user_role', { user_id: userId });

      if (roleError || !userRole) {
        return false;
      }

      // Check role-based permissions
      const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
      if (rolePermissions.includes(permission)) {
        return true;
      }

      // Check custom permissions in user_roles table
      const { data: userRoleData, error: customPermError } = await this.supabase
        .from('user_roles')
        .select('permissions')
        .eq('user_id', userId)
        .single();

      if (customPermError || !userRoleData?.permissions) {
        return false;
      }

      // Check if permission is in custom permissions array
      const customPermissions = userRoleData.permissions as string[];
      return customPermissions.includes(permission);
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }

  /**
   * Check if a user has any of the specified permissions
   */
  async hasAnyPermission(userId: string, permissions: Permission[]): Promise<boolean> {
    for (const permission of permissions) {
      if (await this.hasPermission(userId, permission)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if a user has all of the specified permissions
   */
  async hasAllPermissions(userId: string, permissions: Permission[]): Promise<boolean> {
    for (const permission of permissions) {
      if (!(await this.hasPermission(userId, permission))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    try {
      // Get user's role
      const { data: userRole, error: roleError } = await this.supabase
        .rpc('get_user_role', { user_id: userId });

      if (roleError || !userRole) {
        return [];
      }

      // Start with role-based permissions
      let permissions = [...(ROLE_PERMISSIONS[userRole] || [])];

      // Add custom permissions
      const { data: userRoleData, error: customPermError } = await this.supabase
        .from('user_roles')
        .select('permissions')
        .eq('user_id', userId)
        .single();

      if (!customPermError && userRoleData?.permissions) {
        const customPermissions = userRoleData.permissions as string[];
        permissions = [...permissions, ...customPermissions.map(p => p as Permission)];
      }

      // Remove duplicates
      return [...new Set(permissions)];
    } catch (error) {
      console.error('Get user permissions error:', error);
      return [];
    }
  }

  /**
   * Grant custom permissions to a user (admin only)
   */
  async grantPermissions(userId: string, permissions: Permission[], granterId: string): Promise<boolean> {
    try {
      // Check if granter has admin permissions
      const isAdmin = await this.hasPermission(granterId, Permission.ADMIN_MANAGE_USERS);
      if (!isAdmin) {
        return false;
      }

      // Get current permissions
      const { data: userRoleData, error: fetchError } = await this.supabase
        .from('user_roles')
        .select('permissions')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows
        console.error('Fetch permissions error:', fetchError);
        return false;
      }

      const currentPermissions = (userRoleData?.permissions as string[]) || [];
      const newPermissions = [...new Set([...currentPermissions, ...permissions])];

      // Update permissions
      const { error: updateError } = await this.supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          permissions: newPermissions,
          updated_at: new Date().toISOString(),
        });

      if (updateError) {
        console.error('Update permissions error:', updateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Grant permissions error:', error);
      return false;
    }
  }

  /**
   * Revoke permissions from a user (admin only)
   */
  async revokePermissions(userId: string, permissions: Permission[], revokerId: string): Promise<boolean> {
    try {
      // Check if revoker has admin permissions
      const isAdmin = await this.hasPermission(revokerId, Permission.ADMIN_MANAGE_USERS);
      if (!isAdmin) {
        return false;
      }

      // Get current permissions
      const { data: userRoleData, error: fetchError } = await this.supabase
        .from('user_roles')
        .select('permissions')
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        console.error('Fetch permissions error:', fetchError);
        return false;
      }

      const currentPermissions = (userRoleData?.permissions as string[]) || [];
      const newPermissions = currentPermissions.filter(p => !permissions.includes(p as Permission));

      // Update permissions
      const { error: updateError } = await this.supabase
        .from('user_roles')
        .update({
          permissions: newPermissions,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Update permissions error:', updateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Revoke permissions error:', error);
      return false;
    }
  }
}

// Export singleton instance
export function getPermissionChecker(): PermissionChecker {
  return new PermissionChecker();
}

// Helper functions for common permission checks
export async function requirePermission(userId: string, permission: Permission): Promise<void> {
  const hasPermission = await getPermissionChecker().hasPermission(userId, permission);
  if (!hasPermission) {
    throw new Error(`Permission denied: ${permission}`);
  }
}

export async function requireAnyPermission(userId: string, permissions: Permission[]): Promise<void> {
  const hasPermission = await getPermissionChecker().hasAnyPermission(userId, permissions);
  if (!hasPermission) {
    throw new Error(`Permission denied: requires one of ${permissions.join(', ')}`);
  }
}

export async function requireAllPermissions(userId: string, permissions: Permission[]): Promise<void> {
  const hasPermission = await getPermissionChecker().hasAllPermissions(userId, permissions);
  if (!hasPermission) {
    throw new Error(`Permission denied: requires all of ${permissions.join(', ')}`);
  }
}