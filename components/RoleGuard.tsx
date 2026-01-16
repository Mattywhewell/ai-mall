'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Shield, AlertTriangle, Loader2 } from 'lucide-react';
import { rolePerformanceMonitor } from '@/lib/auth/role-performance-monitor';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('citizen' | 'customer' | 'supplier' | 'admin')[];
  fallbackPath?: string;
  showMessage?: boolean;
  loadingComponent?: React.ReactNode;
}

export function RoleGuard({
  children,
  allowedRoles,
  fallbackPath = '/',
  showMessage = true,
  loadingComponent
}: RoleGuardProps) {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();
  const [hasCheckedRole, setHasCheckedRole] = useState(false);

  // If userRole isn't provided by AuthContext, derive it from user metadata (useful for dev test_user injection)
  const derivedRole = userRole ?? ((user && (user as any).user_metadata && (user as any).user_metadata.roles && (user as any).user_metadata.roles[0]) || undefined);

  useEffect(() => {
    if (!loading && user) {
      rolePerformanceMonitor.startAccessControlCheck();

      setHasCheckedRole(true);

      // If user doesn't have required role, redirect
      const normalizedRole = (derivedRole === 'customer') ? 'citizen' : derivedRole;
      if (!allowedRoles.includes(normalizedRole || 'citizen')) {
        rolePerformanceMonitor.endAccessControlCheck();

        if (showMessage) {
          // Show brief message before redirect
          setTimeout(() => {
            router.push(fallbackPath);
          }, 2000);
        } else {
          router.push(fallbackPath);
        }
      } else {
        rolePerformanceMonitor.endAccessControlCheck();
      }
    } else if (!loading && !user) {
      // Not logged in, redirect to login
      router.push('/auth/login');
    }
  }, [user, userRole, loading, allowedRoles, fallbackPath, router, showMessage]);

  // Show loading state while checking auth
  if (loading || (user && !hasCheckedRole)) {
    return loadingComponent || (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <Loader2 className="animate-spin h-12 w-12 mx-auto mb-4" />
          <p>Verifying access...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="mb-4">Please sign in to access this page.</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // User doesn't have required role
  const normalizedRole = (userRole === 'customer') ? 'citizen' : userRole;
  if (!allowedRoles.includes(normalizedRole || 'citizen')) {
    return showMessage ? (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center max-w-md mx-auto px-4">
          <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-yellow-400" />
          <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
          <p className="mb-4">
            This page requires {allowedRoles.join(' or ')} access. You currently have {normalizedRole || 'citizen'} access.
          </p>
          <p className="text-sm text-gray-300 mb-4">
            Redirecting to home page in a moment...
          </p>
          <button
            onClick={() => router.push(fallbackPath)}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    ) : null;
  }

  // User has required role, render children
  return <>{children}</>;
}

// Convenience components for common role checks
export function SupplierOnly({ children, ...props }: Omit<RoleGuardProps, 'allowedRoles'>) {
  return (
    <RoleGuard allowedRoles={['supplier']} {...props}>
      {children}
    </RoleGuard>
  );
}

export function AdminOnly({ children, ...props }: Omit<RoleGuardProps, 'allowedRoles'>) {
  return (
    <RoleGuard allowedRoles={['admin']} {...props}>
      {children}
    </RoleGuard>
  );
}

export function SupplierOrAdmin({ children, ...props }: Omit<RoleGuardProps, 'allowedRoles'>) {
  return (
    <RoleGuard allowedRoles={['supplier', 'admin']} {...props}>
      {children}
    </RoleGuard>
  );
}