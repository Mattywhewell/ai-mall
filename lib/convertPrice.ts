/**
 * Price Conversion Utilities
 * Handles worldwide currency conversion and formatting
 */

import { getCurrencyForCountry, CURRENCIES, type CurrencyConfig } from './currency';

export interface ConvertedPrice {
  amount: number;
  formatted: string;
  currency: CurrencyConfig;
  original: number;
  raw: number;  // Alias for amount
  rate: number; // Exchange rate
  code: string; // Currency code
  symbol: string; // Currency symbol
  convertedPrice: number; // Alias for amount
  country: string; // Country code
}

/**
 * Convert USD price to target country's currency
 * @param usdPrice - Price in USD
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Converted price object with formatted string
 */
export function convertPrice(usdPrice: number, countryCode: string = 'US'): ConvertedPrice {
  const currency = getCurrencyForCountry(countryCode);
  const convertedAmount = usdPrice * currency.rate;
  
  return {
    amount: convertedAmount,
    formatted: formatPrice(convertedAmount, currency),
    currency,
    original: usdPrice,
    raw: convertedAmount,
    rate: currency.rate,
    code: currency.code,
    symbol: currency.symbol,
    convertedPrice: convertedAmount,
    country: countryCode,
  };
}

/**
 * Format a price amount according to currency rules
 * @param amount - Numeric amount
 * @param currency - Currency configuration
 * @returns Formatted price string
 */
export function formatPrice(amount: number, currency: CurrencyConfig): string {
  // Round to appropriate decimal places
  const rounded = Number(amount.toFixed(currency.decimals));
  
  // Format with locale-specific rules
  const formatted = new Intl.NumberFormat(currency.locale, {
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  }).format(rounded);
  
  // Apply symbol position
  if (currency.position === 'before') {
    return `${currency.symbol}${formatted}`;
  } else {
    return `${formatted} ${currency.symbol}`;
  }
}

/**
 * Convert and format price in one step (convenience function)
 * @param usdPrice - Price in USD
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Formatted price string
 */
export function convertAndFormatPrice(usdPrice: number, countryCode: string = 'US'): string {
  const converted = convertPrice(usdPrice, countryCode);
  return converted.formatted;
}

/**
 * Batch convert multiple prices
 * @param usdPrices - Array of USD prices
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Array of converted prices
 */
export function convertPrices(usdPrices: number[], countryCode: string = 'US'): ConvertedPrice[] {
  return usdPrices.map(price => convertPrice(price, countryCode));
}

/**
 * Get price range formatted string
 * @param minPrice - Minimum USD price
 * @param maxPrice - Maximum USD price
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Formatted price range (e.g., "$10 - $50")
 */
export function formatPriceRange(
  minPrice: number,
  maxPrice: number,
  countryCode: string = 'US'
): string {
  const min = convertPrice(minPrice, countryCode);
  const max = convertPrice(maxPrice, countryCode);
  return `${min.formatted} - ${max.formatted}`;
}

/**
 * Calculate discount price
 * @param originalPrice - Original USD price
 * @param discountPercent - Discount percentage (0-100)
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Object with original and discounted prices
 */
export function calculateDiscount(
  originalPrice: number,
  discountPercent: number,
  countryCode: string = 'US'
): {
  original: ConvertedPrice;
  discounted: ConvertedPrice;
  savings: ConvertedPrice;
  percent: number;
} {
  const discountedUsdPrice = originalPrice * (1 - discountPercent / 100);
  const savingsUsdPrice = originalPrice - discountedUsdPrice;
  
  return {
    original: convertPrice(originalPrice, countryCode),
    discounted: convertPrice(discountedUsdPrice, countryCode),
    savings: convertPrice(savingsUsdPrice, countryCode),
    percent: discountPercent,
  };
}

/**
 * Get currency symbol for country
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Currency symbol
 */
export function getCurrencySymbol(countryCode: string = 'US'): string {
  const currency = getCurrencyForCountry(countryCode);
  return currency.symbol;
}

/**
 * Check if price exceeds threshold (useful for free shipping, etc.)
 * @param usdPrice - Price in USD
 * @param thresholdUsd - Threshold in USD
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Boolean and formatted amounts
 */
export function checkPriceThreshold(
  usdPrice: number,
  thresholdUsd: number,
  countryCode: string = 'US'
): {
  meetsThreshold: boolean;
  current: ConvertedPrice;
  threshold: ConvertedPrice;
  remaining: ConvertedPrice | null;
} {
  const meetsThreshold = usdPrice >= thresholdUsd;
  const remaining = meetsThreshold ? null : convertPrice(thresholdUsd - usdPrice, countryCode);
  
  return {
    meetsThreshold,
    current: convertPrice(usdPrice, countryCode),
    threshold: convertPrice(thresholdUsd, countryCode),
    remaining,
  };
}
