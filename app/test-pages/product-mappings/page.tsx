'use client';

import { ProductMappings } from '@/components/seller/ProductMappings';

export default function ProductMappingsTestPage() {
  if (process.env.NODE_ENV === 'production') return <div>Not Found</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Product Mappings Test Page</h1>
      <ProductMappings onUpdate={() => {}} />
    </div>
  );
}
