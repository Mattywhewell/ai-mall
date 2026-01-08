'use client';

import Image from 'next/image';
import { Product } from '@/lib/types';
import { useCartStore } from '@/lib/store/cartStore';
import { trackProductClick, trackAddToCart } from '@/lib/analytics/tracking';
import { ShoppingCart } from 'lucide-react';
import { useConvertPrice } from '@/lib/hooks/useCurrency';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const convertedPrice = useConvertPrice(product.price);

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.image_url,
      microstoreId: product.microstore_id,
    });
    
    // Track analytics
    trackAddToCart(product.id, product.microstore_id, product.price);
  };

  const handleClick = () => {
    trackProductClick(product.id, product.microstore_id);
  };
  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
      onClick={handleClick}
    >
      <div className="relative h-64 w-full">
        <Image
          src={product.image_url}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-indigo-600">
            {convertedPrice.formatted}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAddToCart();
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition flex items-center gap-2"
            aria-label="Add to cart"
          >
            <ShoppingCart className="h-4 w-4" />
            Add
          </button>
        </div>
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
