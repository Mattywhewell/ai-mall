/**
 * Server-side price conversion helpers
 * Use these in API routes and server components
 */

import { cookies } from 'next/headers';
import { convertPrice, convertAndFormatPrice, type ConvertedPrice } from '../convertPrice';
import { getCurrencyForCountry } from '../currency';

/**
 * Get user's country from cookies (server-side)
 */
export async function getUserCountry(): Promise<string> {
  const cookieStore = await cookies();
  const country = cookieStore.get('user-country');
  return country?.value || 'US';
}

/**
 * Server-side price conversion
 */
export async function convertPriceServer(usdPrice: number): Promise<ConvertedPrice> {
  const country = await getUserCountry();
  return convertPrice(usdPrice, country);
}

/**
 * Server-side formatted price
 */
export async function formatPriceServer(usdPrice: number): Promise<string> {
  const country = await getUserCountry();
  return convertAndFormatPrice(usdPrice, country);
}

/**
 * Get currency info for current user (server-side)
 */
export async function getUserCurrency() {
  const country = await getUserCountry();
  return getCurrencyForCountry(country);
}

/**
 * Convert product array prices (server-side)
 */
export async function convertProductPrices<T extends { price: number }>(
  products: T[]
): Promise<Array<T & { convertedPrice: ConvertedPrice }>> {
  const country = await getUserCountry();
  
  return products.map(product => ({
    ...product,
    convertedPrice: convertPrice(product.price, country),
  }));
}
