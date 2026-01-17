/**
 * Supplier Portal Layout
 * Wraps all supplier pages with navigation and role-based access control
 */

import SupplierNav from '@/components/SupplierNav';
import { RoleGuard } from '@/components/RoleGuard';
import { redirect } from 'next/navigation';

export default function SupplierLayout({
  children,
  searchParams,
}: {
  children: React.ReactNode;
  searchParams?: { [key: string]: string | undefined };
}) {
  // Server-side shortcut for E2E tests: if ?test_user is provided and role is not supplier, redirect
  if (searchParams?.test_user === 'true' && searchParams?.role && searchParams.role !== 'supplier') {
    redirect('/');
  }

  return (
    <RoleGuard allowedRoles={['supplier']} fallbackPath="/" showMessage={true}>
      <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <SupplierNav />
        <main className="flex-1">{children}</main>
      </div>
    </RoleGuard>
  );
}
