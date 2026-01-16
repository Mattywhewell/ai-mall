'use client';

import { PriceSync } from '@/components/seller/PriceSync';

export default function PriceSyncTestPage() {
  if (process.env.NODE_ENV === 'production') return <div>Not Found</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Price Sync Test Page</h1>
      <PriceSync onUpdate={() => {}} />
    </div>
  );
}
