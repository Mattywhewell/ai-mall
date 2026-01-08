/**
 * Reusable Price Display Component
 * Shows prices with automatic currency conversion
 */

'use client';

import { useConvertPrice } from '@/lib/hooks/useCurrency';
import { calculateDiscount } from '@/lib/convertPrice';
import { useCurrency } from '@/lib/hooks/useCurrency';

interface PriceDisplayProps {
  price: number; // USD price
  className?: string;
  showCurrency?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function PriceDisplay({ 
  price, 
  className = '', 
  showCurrency = false,
  size = 'md' 
}: PriceDisplayProps) {
  const converted = useConvertPrice(price);
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };
  
  return (
    <span className={`font-bold ${sizeClasses[size]} ${className}`}>
      {converted.formatted}
      {showCurrency && (
        <span className="text-xs font-normal ml-1 opacity-70">
          {converted.currency.code}
        </span>
      )}
    </span>
  );
}

interface DiscountPriceDisplayProps {
  originalPrice: number; // USD price
  discountPercent: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function DiscountPriceDisplay({
  originalPrice,
  discountPercent,
  className = '',
  size = 'md',
}: DiscountPriceDisplayProps) {
  const { countryCode } = useCurrency();
  const discount = calculateDiscount(originalPrice, discountPercent, countryCode);
  
  const sizeClasses = {
    sm: { price: 'text-sm', original: 'text-xs' },
    md: { price: 'text-lg', original: 'text-sm' },
    lg: { price: 'text-2xl', original: 'text-lg' },
  };
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`font-bold text-red-600 ${sizeClasses[size].price}`}>
        {discount.discounted.formatted}
      </span>
      <span className={`line-through text-gray-500 ${sizeClasses[size].original}`}>
        {discount.original.formatted}
      </span>
      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded">
        -{discount.percent}%
      </span>
    </div>
  );
}

interface PriceRangeDisplayProps {
  minPrice: number; // USD
  maxPrice: number; // USD
  className?: string;
}

export function PriceRangeDisplay({ minPrice, maxPrice, className = '' }: PriceRangeDisplayProps) {
  const minConverted = useConvertPrice(minPrice);
  const maxConverted = useConvertPrice(maxPrice);
  
  return (
    <span className={`font-semibold ${className}`}>
      {minConverted.formatted} - {maxConverted.formatted}
    </span>
  );
}
