'use client';

import { OrderSync } from '@/components/seller/OrderSync';

export default function OrderSyncTestPage() {
  if (process.env.NODE_ENV === 'production') return <div>Not Found</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Order Sync Test Page</h1>
      <OrderSync onUpdate={() => {}} />
    </div>
  );
}
