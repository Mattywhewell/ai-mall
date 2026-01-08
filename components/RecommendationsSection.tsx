'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/lib/types';
import { getRecommendedProducts } from '@/lib/recommendations/engine';
import ProductCard from './ProductCard';

interface RecommendationsSectionProps {
  currentProductId?: string;
  districtSlug?: string;
  tags?: string[];
  title?: string;
  limit?: number;
}

export default function RecommendationsSection({
  currentProductId,
  districtSlug,
  tags,
  title = 'Recommended for You',
  limit = 6,
}: RecommendationsSectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const recommendations = await getRecommendedProducts({
          currentProductId,
          districtSlug,
          tags,
          limit,
        });
        setProducts(recommendations);
      } catch (error) {
        console.error('Error loading recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [currentProductId, districtSlug, tags, limit]);

  if (loading) {
    return (
      <div className="py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(limit)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-200 rounded-lg h-96 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="py-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
