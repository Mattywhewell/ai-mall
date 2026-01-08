/**
 * Exchange Rate Management
 * Fetch and update currency rates from external APIs
 */

import { CURRENCIES, CurrencyConfig } from './currency';

const EXCHANGE_RATE_API = 'https://api.exchangerate-api.com/v4/latest/USD';
const CACHE_KEY = 'exchange_rates_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface RateCache {
  rates: Record<string, number>;
  timestamp: number;
}

/**
 * Fetch latest exchange rates from API
 */
export async function fetchExchangeRates(): Promise<Record<string, number> | null> {
  try {
    const response = await fetch(EXCHANGE_RATE_API);
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    return data.rates || null;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    return null;
  }
}

/**
 * Get cached rates or fetch new ones
 */
export async function getExchangeRates(): Promise<Record<string, number>> {
  // Try to get from cache first
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(CACHE_KEY);
    
    if (cached) {
      const { rates, timestamp } = JSON.parse(cached) as RateCache;
      const age = Date.now() - timestamp;
      
      // Return cached if less than 24 hours old
      if (age < CACHE_DURATION) {
        return rates;
      }
    }
  }
  
  // Fetch new rates
  const freshRates = await fetchExchangeRates();
  
  if (freshRates) {
    // Cache the results
    if (typeof window !== 'undefined') {
      const cache: RateCache = {
        rates: freshRates,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    }
    
    return freshRates;
  }
  
  // Fallback to static rates from currency.ts
  const fallbackRates: Record<string, number> = {};
  Object.entries(CURRENCIES).forEach(([code, config]) => {
    fallbackRates[code] = config.rate;
  });
  
  return fallbackRates;
}

/**
 * Update currency configurations with latest rates
 */
export async function updateCurrencyRates(): Promise<Map<string, CurrencyConfig>> {
  const rates = await getExchangeRates();
  const updated = new Map<string, CurrencyConfig>();
  
  Object.entries(CURRENCIES).forEach(([code, config]) => {
    const newRate = rates[code];
    
    if (newRate) {
      updated.set(code, {
        ...config,
        rate: newRate,
      });
    } else {
      // Keep existing rate if API doesn't have this currency
      updated.set(code, config);
    }
  });
  
  return updated;
}

/**
 * Clear rate cache (force refresh)
 */
export function clearRateCache(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CACHE_KEY);
  }
}

/**
 * Get cache age in hours
 */
export function getCacheAge(): number | null {
  if (typeof window === 'undefined') return null;
  
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;
  
  const { timestamp } = JSON.parse(cached) as RateCache;
  const ageMs = Date.now() - timestamp;
  return ageMs / (1000 * 60 * 60); // Convert to hours
}

/**
 * Schedule automatic rate updates (call on app init)
 */
export function scheduleRateUpdates(intervalHours: number = 24): void {
  if (typeof window === 'undefined') return;
  
  // Update immediately
  updateCurrencyRates();
  
  // Schedule periodic updates
  const intervalMs = intervalHours * 60 * 60 * 1000;
  setInterval(() => {
    updateCurrencyRates();
  }, intervalMs);
}
