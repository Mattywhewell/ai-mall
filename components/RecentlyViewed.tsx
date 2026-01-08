'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/lib/types';
import { recentlyViewedManager } from '@/lib/recentlyViewed';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, ShoppingCart, X } from 'lucide-react';

export function RecentlyViewed() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    setProducts(recentlyViewedManager.getProducts());
  }, []);

  const handleRemove = (productId: string) => {
    recentlyViewedManager.removeProduct(productId);
    setProducts(recentlyViewedManager.getProducts());
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Eye className="w-6 h-6 mr-2 text-purple-600" />
          Recently Viewed
        </h2>
        <button
          onClick={() => {
            recentlyViewedManager.clear();
            setProducts([]);
          }}
          className="text-sm text-gray-600 hover:text-purple-600"
        >
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {products.map((product) => (
          <div key={product.id} className="group relative">
            <Link
              href={`/products/${product.id}`}
              className="block bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative h-32 bg-gray-100">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ShoppingCart className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="p-2">
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
                  {product.name}
                </h3>
                <span className="text-sm font-bold text-purple-600">
                  ${product.price.toFixed(2)}
                </span>
              </div>
            </Link>
            <button
              onClick={() => handleRemove(product.id)}
              className="absolute top-2 right-2 p-1 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
