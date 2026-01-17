import { OrderSync } from '@/components/seller/OrderSync';

export default function OrderSyncTestPage({ searchParams }: { searchParams?: Record<string, string | string[]> }) {
  // Guard: only available in non-production unless CI explicitly enables test pages
  const allowTestPages = process.env.NEXT_PUBLIC_INCLUDE_TEST_PAGES === 'true' || (searchParams && searchParams.test_user === 'true');
  if (process.env.NODE_ENV === 'production' && !allowTestPages) return <div>Not Found</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Order Sync Test Page</h1>
      <OrderSync onUpdate={() => {}} />
    </div>
  );
}
