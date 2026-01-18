import { OrderSync } from '@/components/seller/OrderSync';

export const dynamic = "force-dynamic";

export default function OrderSyncTestPage({ searchParams }: { searchParams?: Record<string, string | string[]> }) {
  // Guard: only available in non-production unless CI explicitly enables test pages
  // Only enable test pages via explicit environment opt-in to avoid synchronous `searchParams` access
  const allowTestPages = process.env.NEXT_PUBLIC_INCLUDE_TEST_PAGES === 'true';
  if (process.env.NODE_ENV === 'production' && !allowTestPages) return <div>Not Found</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Order Sync Test Page</h1>
      <OrderSync />
    </div>
  );
}
