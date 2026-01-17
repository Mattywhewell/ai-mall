'use client';

import { ProductMappings } from '@/components/seller/ProductMappings';

export default function ProductMappingsTestPage() {
  // Guard: only available in non-production unless CI explicitly enables test pages
  const allowTestPages = process.env.NEXT_PUBLIC_INCLUDE_TEST_PAGES === 'true';
  if (process.env.NODE_ENV === 'production' && !allowTestPages) return <div>Not Found</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Product Mappings Test Page</h1>
      <ProductMappings onUpdate={() => {}} />
    </div>
  );
}
