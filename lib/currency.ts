/**
 * Global Currency Configuration
 * Extensible mapping for worldwide pricing support
 */

export interface CurrencyConfig {
  code: string;
  symbol: string;
  rate: number; // Conversion rate from USD
  locale: string; // For number formatting
  position: 'before' | 'after'; // Symbol position
  decimals: number; // Decimal places to show
}

// Country to currency mapping
export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  // North America
  US: 'USD',
  CA: 'CAD',
  MX: 'MXN',
  
  // Europe
  GB: 'GBP',
  AT: 'EUR', BE: 'EUR', CY: 'EUR', EE: 'EUR', FI: 'EUR',
  FR: 'EUR', DE: 'EUR', GR: 'EUR', IE: 'EUR', IT: 'EUR',
  LV: 'EUR', LT: 'EUR', LU: 'EUR', MT: 'EUR', NL: 'EUR',
  PT: 'EUR', SK: 'EUR', SI: 'EUR', ES: 'EUR',
  
  // Nordic countries not in Euro
  NO: 'NOK',
  SE: 'SEK',
  DK: 'DKK',
  IS: 'ISK',
  
  // Asia-Pacific
  AU: 'AUD',
  NZ: 'NZD',
  JP: 'JPY',
  CN: 'CNY',
  IN: 'INR',
  KR: 'KRW',
  SG: 'SGD',
  HK: 'HKD',
  TW: 'TWD',
  TH: 'THB',
  MY: 'MYR',
  ID: 'IDR',
  PH: 'PHP',
  VN: 'VND',
  
  // Middle East
  AE: 'AED',
  SA: 'SAR',
  IL: 'ILS',
  TR: 'TRY',
  
  // South America
  BR: 'BRL',
  AR: 'ARS',
  CL: 'CLP',
  CO: 'COP',
  PE: 'PEN',
  
  // Africa
  ZA: 'ZAR',
  NG: 'NGN',
  KE: 'KES',
  EG: 'EGP',
  
  // Other
  CH: 'CHF',
  PL: 'PLN',
  CZ: 'CZK',
  HU: 'HUF',
  RU: 'RUB',
};

// Currency configurations
// Note: Rates are illustrative - in production, fetch from live API
export const CURRENCIES: Record<string, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: '$',
    rate: 1,
    locale: 'en-US',
    position: 'before',
    decimals: 2,
  },
  CAD: {
    code: 'CAD',
    symbol: 'CA$',
    rate: 1.34,
    locale: 'en-CA',
    position: 'before',
    decimals: 2,
  },
  MXN: {
    code: 'MXN',
    symbol: 'MX$',
    rate: 17.2,
    locale: 'es-MX',
    position: 'before',
    decimals: 2,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    rate: 0.79,
    locale: 'en-GB',
    position: 'before',
    decimals: 2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    rate: 0.92,
    locale: 'de-DE',
    position: 'before',
    decimals: 2,
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    rate: 1.52,
    locale: 'en-AU',
    position: 'before',
    decimals: 2,
  },
  NZD: {
    code: 'NZD',
    symbol: 'NZ$',
    rate: 1.63,
    locale: 'en-NZ',
    position: 'before',
    decimals: 2,
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    rate: 144,
    locale: 'ja-JP',
    position: 'before',
    decimals: 0, // Japanese Yen has no decimal places
  },
  CNY: {
    code: 'CNY',
    symbol: '¥',
    rate: 7.24,
    locale: 'zh-CN',
    position: 'before',
    decimals: 2,
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    rate: 83,
    locale: 'en-IN',
    position: 'before',
    decimals: 2,
  },
  KRW: {
    code: 'KRW',
    symbol: '₩',
    rate: 1320,
    locale: 'ko-KR',
    position: 'before',
    decimals: 0,
  },
  SGD: {
    code: 'SGD',
    symbol: 'S$',
    rate: 1.34,
    locale: 'en-SG',
    position: 'before',
    decimals: 2,
  },
  HKD: {
    code: 'HKD',
    symbol: 'HK$',
    rate: 7.83,
    locale: 'zh-HK',
    position: 'before',
    decimals: 2,
  },
  TWD: {
    code: 'TWD',
    symbol: 'NT$',
    rate: 31.5,
    locale: 'zh-TW',
    position: 'before',
    decimals: 0,
  },
  THB: {
    code: 'THB',
    symbol: '฿',
    rate: 35.2,
    locale: 'th-TH',
    position: 'before',
    decimals: 2,
  },
  MYR: {
    code: 'MYR',
    symbol: 'RM',
    rate: 4.68,
    locale: 'ms-MY',
    position: 'before',
    decimals: 2,
  },
  IDR: {
    code: 'IDR',
    symbol: 'Rp',
    rate: 15650,
    locale: 'id-ID',
    position: 'before',
    decimals: 0,
  },
  PHP: {
    code: 'PHP',
    symbol: '₱',
    rate: 56.2,
    locale: 'en-PH',
    position: 'before',
    decimals: 2,
  },
  VND: {
    code: 'VND',
    symbol: '₫',
    rate: 24500,
    locale: 'vi-VN',
    position: 'after',
    decimals: 0,
  },
  AED: {
    code: 'AED',
    symbol: 'د.إ',
    rate: 3.67,
    locale: 'ar-AE',
    position: 'before',
    decimals: 2,
  },
  SAR: {
    code: 'SAR',
    symbol: '﷼',
    rate: 3.75,
    locale: 'ar-SA',
    position: 'before',
    decimals: 2,
  },
  ILS: {
    code: 'ILS',
    symbol: '₪',
    rate: 3.62,
    locale: 'he-IL',
    position: 'before',
    decimals: 2,
  },
  TRY: {
    code: 'TRY',
    symbol: '₺',
    rate: 32.5,
    locale: 'tr-TR',
    position: 'before',
    decimals: 2,
  },
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    rate: 4.95,
    locale: 'pt-BR',
    position: 'before',
    decimals: 2,
  },
  ARS: {
    code: 'ARS',
    symbol: '$',
    rate: 830,
    locale: 'es-AR',
    position: 'before',
    decimals: 2,
  },
  CLP: {
    code: 'CLP',
    symbol: '$',
    rate: 920,
    locale: 'es-CL',
    position: 'before',
    decimals: 0,
  },
  COP: {
    code: 'COP',
    symbol: '$',
    rate: 3950,
    locale: 'es-CO',
    position: 'before',
    decimals: 0,
  },
  PEN: {
    code: 'PEN',
    symbol: 'S/',
    rate: 3.72,
    locale: 'es-PE',
    position: 'before',
    decimals: 2,
  },
  ZAR: {
    code: 'ZAR',
    symbol: 'R',
    rate: 18.6,
    locale: 'en-ZA',
    position: 'before',
    decimals: 2,
  },
  NGN: {
    code: 'NGN',
    symbol: '₦',
    rate: 1580,
    locale: 'en-NG',
    position: 'before',
    decimals: 2,
  },
  KES: {
    code: 'KES',
    symbol: 'KSh',
    rate: 160,
    locale: 'en-KE',
    position: 'before',
    decimals: 2,
  },
  EGP: {
    code: 'EGP',
    symbol: 'E£',
    rate: 30.9,
    locale: 'ar-EG',
    position: 'before',
    decimals: 2,
  },
  CHF: {
    code: 'CHF',
    symbol: 'CHF',
    rate: 0.88,
    locale: 'de-CH',
    position: 'before',
    decimals: 2,
  },
  PLN: {
    code: 'PLN',
    symbol: 'zł',
    rate: 4.02,
    locale: 'pl-PL',
    position: 'after',
    decimals: 2,
  },
  CZK: {
    code: 'CZK',
    symbol: 'Kč',
    rate: 23.1,
    locale: 'cs-CZ',
    position: 'after',
    decimals: 2,
  },
  HUF: {
    code: 'HUF',
    symbol: 'Ft',
    rate: 360,
    locale: 'hu-HU',
    position: 'after',
    decimals: 0,
  },
  RUB: {
    code: 'RUB',
    symbol: '₽',
    rate: 92,
    locale: 'ru-RU',
    position: 'after',
    decimals: 2,
  },
  NOK: {
    code: 'NOK',
    symbol: 'kr',
    rate: 10.8,
    locale: 'nb-NO',
    position: 'after',
    decimals: 2,
  },
  SEK: {
    code: 'SEK',
    symbol: 'kr',
    rate: 10.6,
    locale: 'sv-SE',
    position: 'after',
    decimals: 2,
  },
  DKK: {
    code: 'DKK',
    symbol: 'kr',
    rate: 6.9,
    locale: 'da-DK',
    position: 'after',
    decimals: 2,
  },
  ISK: {
    code: 'ISK',
    symbol: 'kr',
    rate: 138,
    locale: 'is-IS',
    position: 'after',
    decimals: 0,
  },
};

/**
 * Get currency configuration for a given country code
 */
export function getCurrencyForCountry(countryCode: string): CurrencyConfig {
  const currencyCode = COUNTRY_TO_CURRENCY[countryCode] || 'USD';
  return CURRENCIES[currencyCode] || CURRENCIES.USD;
}

/**
 * Get all supported country codes
 */
export function getSupportedCountries(): string[] {
  return Object.keys(COUNTRY_TO_CURRENCY);
}

/**
 * Get all supported currencies
 */
export function getSupportedCurrencies(): CurrencyConfig[] {
  return Object.values(CURRENCIES);
}
