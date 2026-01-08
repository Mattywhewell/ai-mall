/**
 * Price Display with Tax Information
 * Shows converted price with regional tax details
 */

'use client';

import { useConvertPrice } from '@/lib/hooks/useCurrency';
import { calculateWithTax, formatTaxInfo } from '@/lib/vat';
import { useEffect, useState } from 'react';

interface PriceWithTaxProps {
  priceUSD: number;
  showTaxBreakdown?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function PriceWithTax({ priceUSD, showTaxBreakdown = false, size = 'md' }: PriceWithTaxProps) {
  const { convertedPrice, country } = useConvertPrice(priceUSD);
  const [taxInfo, setTaxInfo] = useState<ReturnType<typeof calculateWithTax> | null>(null);
  
  useEffect(() => {
    if (country) {
      setTaxInfo(calculateWithTax(convertedPrice.raw, country));
    }
  }, [convertedPrice.raw, country]);
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };
  
  return (
    <div className="space-y-1">
      <div className={`font-bold text-purple-600 ${sizeClasses[size]}`}>
        {convertedPrice.formatted}
      </div>
      
      {taxInfo && (
        <div className="text-xs text-gray-500">
          {formatTaxInfo(convertedPrice.raw, country || 'US')}
        </div>
      )}
      
      {showTaxBreakdown && taxInfo && !taxInfo.included && (
        <div className="text-xs space-y-0.5 text-gray-600 border-t pt-1">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-mono">{convertedPrice.symbol}{taxInfo.basePrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>{taxInfo.taxName} ({taxInfo.taxRate}%):</span>
            <span className="font-mono">{convertedPrice.symbol}{taxInfo.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold border-t pt-0.5">
            <span>Total:</span>
            <span className="font-mono">{convertedPrice.symbol}{taxInfo.totalPrice.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
