# Worldwide Pricing System

Your AI-Native Mall now supports **automatic location-aware pricing** for 60+ countries worldwide! 🌍

## ✅ What's Implemented

### 1. **Country Detection** (`middleware.ts`)
- Auto-detects user location via Vercel/Cloudflare geo headers
- Stores country in `user-country` cookie (30-day persistence)
- Defaults to US if detection unavailable

### 2. **Currency System** (`lib/currency.ts`)
- 60+ countries mapped to 40+ currencies
- Includes: USD, EUR, GBP, CAD, AUD, JPY, INR, CNY, and more
- Each currency has:
  - Symbol (£, €, ¥, ₹, etc.)
  - Exchange rate from USD
  - Locale for proper number formatting
  - Decimal rules (JPY has 0, most have 2)
  - Symbol position (before/after amount)

### 3. **Conversion Engine** (`lib/convertPrice.ts`)
- `convertPrice()` - Convert USD to any currency
- `formatPrice()` - Format with correct symbols & decimals
- `calculateDiscount()` - Handle sale prices
- `formatPriceRange()` - Show min-max ranges
- `checkPriceThreshold()` - Free shipping logic

### 4. **React Hooks** (`lib/hooks/useCurrency.ts`)
- `useCurrency()` - Get user's currency info
- `useConvertPrice()` - Auto-convert single price
- `useConvertPrices()` - Batch convert prices
- `usePriceFormatter()` - Get formatting function

### 5. **UI Components**
- **`PriceDisplay`** - Reusable price component
- **`DiscountPriceDisplay`** - Show sales with strikethrough
- **`PriceRangeDisplay`** - Min-max price ranges
- **`CurrencySelector`** - Manual currency override dropdown

### 6. **Server Utilities** (`lib/utils/priceHelpers.ts`)
- Server-side price conversion for API routes
- Product array batch conversion
- Currency info access without client hooks

## 🎯 Usage Examples

### In Components (Client-Side)

```tsx
import { useConvertPrice } from '@/lib/hooks/useCurrency';
import { PriceDisplay, DiscountPriceDisplay } from '@/components/PriceDisplay';

function MyProduct({ product }) {
  // Method 1: Using hook directly
  const price = useConvertPrice(product.price);
  return <div>{price.formatted}</div>;
  
  // Method 2: Using component
  return <PriceDisplay price={product.price} size="lg" />;
  
  // Method 3: With discount
  return <DiscountPriceDisplay originalPrice={99.99} discountPercent={20} />;
}
```

### In API Routes (Server-Side)

```tsx
import { convertPriceServer, getUserCountry } from '@/lib/utils/priceHelpers';

export async function GET() {
  const country = getUserCountry(); // 'JP', 'GB', etc.
  const price = convertPriceServer(49.99); // Converts based on user's country
  
  return Response.json({
    price: price.formatted, // "¥7,200" if Japan
    currency: price.currency.code // "JPY"
  });
}
```

### Add Currency Selector to Navigation

```tsx
import { CurrencySelector } from '@/components/CurrencySelector';

export default function Header() {
  return (
    <nav>
      {/* Your existing nav */}
      <CurrencySelector />
    </nav>
  );
}
```

## 🌍 Supported Regions

**Americas:** US, Canada, Mexico, Brazil, Argentina, Chile, Colombia, Peru
**Europe:** UK, EU (19 countries), Switzerland, Norway, Sweden, Denmark, Poland, Czech Republic
**Asia-Pacific:** Japan, China, India, Australia, New Zealand, Singapore, Hong Kong, South Korea, Thailand, Malaysia, Indonesia, Philippines, Vietnam
**Middle East:** UAE, Saudi Arabia, Israel, Turkey
**Africa:** South Africa, Nigeria, Kenya, Egypt

## 🔮 Future-Ready Features

The system is designed to easily support:

### 1. **Live Exchange Rates**
```tsx
// Add to lib/currency.ts
export async function updateExchangeRates() {
  const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
  const data = await response.json();
  // Update CURRENCIES object
}
```

### 2. **VAT/Tax by Region**
```tsx
// Add to lib/convertPrice.ts
export function addTax(price: number, country: string) {
  const taxRates = {
    'GB': 0.20, // 20% VAT
    'FR': 0.20,
    'CA': 0.13, // 13% HST
  };
  return price * (1 + (taxRates[country] || 0));
}
```

### 3. **Regional Product Filtering**
```tsx
// Filter products available in user's region
export function filterByRegion(products, country) {
  return products.filter(p => 
    !p.restricted_countries?.includes(country)
  );
}
```

### 4. **Multi-Currency Checkout**
```tsx
// Stripe supports 135+ currencies
const paymentIntent = await stripe.paymentIntents.create({
  amount: convertedPrice.amount * 100,
  currency: convertedPrice.currency.code.toLowerCase(),
});
```

## 📊 Where It Works

✅ **ProductCard** - Already updated with `useConvertPrice()`
✅ **All product displays** - Use `<PriceDisplay />` component
✅ **Bundles & subscriptions** - Use same hooks/components
✅ **Recommendations** - Use `useConvertPrices()` for batch conversion
✅ **Revenue dashboard** - Use server-side `convertPriceServer()`
✅ **AI Spirits** - Pass country to generate localized responses
✅ **Halls, Streets, Chapels** - All inherit from ProductCard

## 🚀 Testing

```tsx
// Test different countries by setting cookie manually
document.cookie = 'user-country=JP; path=/';
location.reload(); // Prices now in ¥

document.cookie = 'user-country=GB; path=/';
location.reload(); // Prices now in £
```

## 📝 Notes

- **Exchange rates** are static for now (update manually or add API integration)
- **No backend changes needed** - All conversion happens client/server side
- **Cookie-based** - Survives navigation, expires in 30 days
- **Middleware-powered** - Auto-detects on every request
- **Type-safe** - Full TypeScript support
- **Performance** - Lightweight, no external dependencies (except Intl API)

## 🎨 Customization

Update rates in `lib/currency.ts`:
```tsx
export const CURRENCIES: Record<string, CurrencyConfig> = {
  USD: { symbol: '$', rate: 1, ... },
  EUR: { symbol: '€', rate: 0.92, ... }, // Update rate here
  // Add new currencies...
};
```

Your worldwide pricing system is now live! 🌎💰
