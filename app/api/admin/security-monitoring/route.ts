import { NextRequest, NextResponse } from 'next/server';
import { getPermissionChecker, Permission } from '@/lib/permissions/permission-system';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const permissionChecker = getPermissionChecker();
    const hasPermission = await permissionChecker.hasPermission(user.id, Permission.ADMIN_VIEW_AUDIT_LOGS);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get security metrics
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Recent audit logs
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .gte('created_at', last24h.toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    // Failed login attempts (from rate limiting logs if available)
    const { data: failedLogins, error: loginError } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('action', 'login_failed')
      .gte('created_at', last7d.toISOString())
      .order('created_at', { ascending: false });

    // Permission changes
    const { data: permissionChanges, error: permError } = await supabase
      .from('audit_logs')
      .select('*')
      .in('action', ['permission_granted', 'permission_revoked', 'role_changed'])
      .gte('created_at', last7d.toISOString())
      .order('created_at', { ascending: false });

    // API key usage
    const { data: apiKeyUsage, error: apiError } = await supabase
      .from('api_key_logs')
      .select(`
        *,
        api_keys (
          name,
          service_type,
          is_active
        )
      `)
      .gte('created_at', last24h.toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    // User activity summary
    const { data: userActivity, error: userError } = await supabase
      .from('audit_logs')
      .select('user_id, action, created_at')
      .gte('created_at', last24h.toISOString())
      .order('created_at', { ascending: false });

    // Calculate metrics
    const metrics = {
      totalAuditEvents: auditLogs?.length || 0,
      failedLogins: failedLogins?.length || 0,
      permissionChanges: permissionChanges?.length || 0,
      activeApiKeys: apiKeyUsage?.filter(log => log.api_keys?.is_active).length || 0,
      uniqueActiveUsers: new Set(userActivity?.map(log => log.user_id)).size || 0,
      suspiciousActivities: (auditLogs || []).filter(log =>
        ['login_failed', 'permission_denied', 'suspicious_activity'].includes(log.action)
      ).length
    };

    return NextResponse.json({
      metrics,
      recentActivity: {
        auditLogs: auditLogs || [],
        failedLogins: failedLogins || [],
        permissionChanges: permissionChanges || [],
        apiKeyUsage: apiKeyUsage || []
      },
      timeRange: {
        last24h: last24h.toISOString(),
        last7d: last7d.toISOString()
      }
    });

  } catch (error) {
    console.error('Security monitoring error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}