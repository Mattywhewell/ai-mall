/**
 * VAT/GST/Sales Tax Configuration
 * Regional tax rates for accurate pricing
 */

export interface TaxConfig {
  country: string;
  rate: number; // Percentage (e.g., 20 for 20%)
  name: string; // VAT, GST, Sales Tax, etc.
  included: boolean; // Whether tax is included in displayed price
}

// Tax rates by country (as of 2026)
export const TAX_RATES: Record<string, TaxConfig> = {
  // Europe - VAT included in price
  AT: { country: 'AT', rate: 20, name: 'VAT', included: true },
  BE: { country: 'BE', rate: 21, name: 'VAT', included: true },
  DE: { country: 'DE', rate: 19, name: 'VAT', included: true },
  FR: { country: 'FR', rate: 20, name: 'VAT', included: true },
  IT: { country: 'IT', rate: 22, name: 'VAT', included: true },
  ES: { country: 'ES', rate: 21, name: 'VAT', included: true },
  GB: { country: 'GB', rate: 20, name: 'VAT', included: true },
  IE: { country: 'IE', rate: 23, name: 'VAT', included: true },
  NL: { country: 'NL', rate: 21, name: 'VAT', included: true },
  PT: { country: 'PT', rate: 23, name: 'VAT', included: true },
  GR: { country: 'GR', rate: 24, name: 'VAT', included: true },
  PL: { country: 'PL', rate: 23, name: 'VAT', included: true },
  SE: { country: 'SE', rate: 25, name: 'VAT', included: true },
  DK: { country: 'DK', rate: 25, name: 'VAT', included: true },
  NO: { country: 'NO', rate: 25, name: 'VAT', included: true },
  FI: { country: 'FI', rate: 24, name: 'VAT', included: true },
  
  // North America - Tax added at checkout
  US: { country: 'US', rate: 8.5, name: 'Sales Tax', included: false }, // Average rate
  CA: { country: 'CA', rate: 13, name: 'HST/GST', included: false }, // Combined average
  MX: { country: 'MX', rate: 16, name: 'IVA', included: true },
  
  // Asia-Pacific - Mixed
  AU: { country: 'AU', rate: 10, name: 'GST', included: true },
  NZ: { country: 'NZ', rate: 15, name: 'GST', included: true },
  JP: { country: 'JP', rate: 10, name: 'Consumption Tax', included: true },
  SG: { country: 'SG', rate: 9, name: 'GST', included: true },
  IN: { country: 'IN', rate: 18, name: 'GST', included: true },
  MY: { country: 'MY', rate: 8, name: 'SST', included: true },
  TH: { country: 'TH', rate: 7, name: 'VAT', included: true },
  ID: { country: 'ID', rate: 11, name: 'PPN', included: true },
  PH: { country: 'PH', rate: 12, name: 'VAT', included: true },
  KR: { country: 'KR', rate: 10, name: 'VAT', included: true },
  
  // Latin America
  BR: { country: 'BR', rate: 17, name: 'ICMS', included: true },
  AR: { country: 'AR', rate: 21, name: 'IVA', included: true },
  CL: { country: 'CL', rate: 19, name: 'IVA', included: true },
  CO: { country: 'CO', rate: 19, name: 'IVA', included: true },
  
  // Middle East & Africa
  AE: { country: 'AE', rate: 5, name: 'VAT', included: true },
  SA: { country: 'SA', rate: 15, name: 'VAT', included: true },
  ZA: { country: 'ZA', rate: 15, name: 'VAT', included: true },
  
  // Other
  CH: { country: 'CH', rate: 8.1, name: 'VAT', included: true },
  TR: { country: 'TR', rate: 20, name: 'KDV', included: true },
  RU: { country: 'RU', rate: 20, name: 'VAT', included: true },
};

/**
 * Get tax configuration for a country
 */
export function getTaxConfig(country: string): TaxConfig | null {
  return TAX_RATES[country] || null;
}

/**
 * Calculate price with tax
 */
export function calculateWithTax(price: number, country: string): {
  basePrice: number;
  tax: number;
  totalPrice: number;
  taxRate: number;
  taxName: string;
  included: boolean;
} {
  const taxConfig = getTaxConfig(country);
  
  if (!taxConfig) {
    return {
      basePrice: price,
      tax: 0,
      totalPrice: price,
      taxRate: 0,
      taxName: 'No Tax',
      included: false,
    };
  }
  
  const { rate, name, included } = taxConfig;
  const taxMultiplier = rate / 100;
  
  if (included) {
    // Tax is already included, extract it
    const basePrice = price / (1 + taxMultiplier);
    const tax = price - basePrice;
    
    return {
      basePrice,
      tax,
      totalPrice: price,
      taxRate: rate,
      taxName: name,
      included: true,
    };
  } else {
    // Tax needs to be added
    const tax = price * taxMultiplier;
    const totalPrice = price + tax;
    
    return {
      basePrice: price,
      tax,
      totalPrice,
      taxRate: rate,
      taxName: name,
      included: false,
    };
  }
}

/**
 * Format tax information for display
 */
export function formatTaxInfo(price: number, country: string): string {
  const taxConfig = getTaxConfig(country);
  
  if (!taxConfig) {
    return '';
  }
  
  if (taxConfig.included) {
    return `(incl. ${taxConfig.rate}% ${taxConfig.name})`;
  } else {
    return `+ ${taxConfig.rate}% ${taxConfig.name} at checkout`;
  }
}
