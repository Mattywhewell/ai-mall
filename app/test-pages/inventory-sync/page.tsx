'use client';

import { InventorySync } from '@/components/seller/InventorySync';

export default function InventorySyncTestPage() {
  if (process.env.NODE_ENV === 'production') return <div>Not Found</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Inventory Sync Test Page</h1>
      <InventorySync onUpdate={() => {}} />
    </div>
  );
}
