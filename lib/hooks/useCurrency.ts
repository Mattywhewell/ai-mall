/**
 * React Hook for Currency Management
 * Provides easy access to user's currency preferences
 */

'use client';

import { useState, useEffect } from 'react';
import { getCurrencyForCountry, type CurrencyConfig } from '../currency';
import { convertPrice, type ConvertedPrice } from '../convertPrice';

/**
 * Get country code from cookie
 */
function getCountryFromCookie(): string {
  if (typeof document === 'undefined') return 'US';
  
  const cookies = document.cookie.split(';');
  const countryCookie = cookies.find(c => c.trim().startsWith('user-country='));
  
  if (countryCookie) {
    return countryCookie.split('=')[1].trim();
  }
  
  return 'US';
}

/**
 * Hook to get user's currency information
 */
export function useCurrency() {
  const [countryCode, setCountryCode] = useState<string>('US');
  const [currency, setCurrency] = useState<CurrencyConfig>(() => getCurrencyForCountry('US'));

  useEffect(() => {
    const country = getCountryFromCookie();
    setCountryCode(country);
    setCurrency(getCurrencyForCountry(country));
  }, []);

  return {
    countryCode,
    currency,
    symbol: currency.symbol,
    code: currency.code,
  };
}

/**
 * Hook to convert a single price
 */
export function useConvertPrice(usdPrice: number) {
  const { countryCode } = useCurrency();
  const [converted, setConverted] = useState<ConvertedPrice>(() => 
    convertPrice(usdPrice, 'US')
  );

  useEffect(() => {
    setConverted(convertPrice(usdPrice, countryCode));
  }, [usdPrice, countryCode]);

  return {
    ...converted,
    convertedPrice: converted,
    country: countryCode,
  };
}

/**
 * Hook to convert multiple prices
 */
export function useConvertPrices(usdPrices: number[]): ConvertedPrice[] {
  const { countryCode } = useCurrency();
  const [converted, setConverted] = useState<ConvertedPrice[]>(() => 
    usdPrices.map(price => convertPrice(price, 'US'))
  );

  useEffect(() => {
    setConverted(usdPrices.map(price => convertPrice(price, countryCode)));
  }, [usdPrices, countryCode]);

  return converted;
}

/**
 * Hook for price formatting function
 */
export function usePriceFormatter() {
  const { countryCode } = useCurrency();

  return (usdPrice: number): string => {
    return convertPrice(usdPrice, countryCode).formatted;
  };
}
