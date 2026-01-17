'use client';

import { InventorySync } from '@/components/seller/InventorySync';

export default function InventorySyncTestPage() {
  // Guard: only available in non-production unless CI explicitly enables test pages
  const allowTestPages = process.env.NEXT_PUBLIC_INCLUDE_TEST_PAGES === 'true';
  if (process.env.NODE_ENV === 'production' && !allowTestPages) return <div>Not Found</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Inventory Sync Test Page</h1>
      <InventorySync onUpdate={() => {}} />
    </div>
  );
}
