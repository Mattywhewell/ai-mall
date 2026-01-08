/**
 * Supplier Portal Layout
 * Wraps all supplier pages with navigation
 */

import SupplierNav from '@/components/SupplierNav';

export default function SupplierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <SupplierNav />
      <main className="flex-1">{children}</main>
    </div>
  );
}
