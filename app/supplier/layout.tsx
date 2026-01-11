/**
 * Supplier Portal Layout
 * Wraps all supplier pages with navigation and role-based access control
 */

import SupplierNav from '@/components/SupplierNav';
import { RoleGuard } from '@/components/RoleGuard';

export default function SupplierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={['supplier']} fallbackPath="/" showMessage={true}>
      <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <SupplierNav />
        <main className="flex-1">{children}</main>
      </div>
    </RoleGuard>
  );
}
