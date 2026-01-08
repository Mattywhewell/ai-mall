# AI-Native Mall - Complete Setup Guide

## Prerequisites
- Node.js 18+ installed
- Supabase account and project
- OpenAI API key

## Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.local.example` to `.env.local` and fill in your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

### 3. Database Setup

#### Step 3.1: Run the complete schema
In your Supabase SQL Editor, run:
```sql
-- Execute: supabase-complete-schema.sql
```

#### Step 3.2: Enable pgvector for semantic search
```sql
-- Execute: supabase-pgvector-setup.sql
```

#### Step 3.3: Add analytics helper functions
```sql
-- Execute: supabase-analytics-functions.sql
```

#### Step 3.4: Add recommendation functions
```sql
-- Execute: supabase-recommendations-functions.sql
```

### 4. Generate Embeddings for Existing Products (Optional)
If you have existing products, generate their embeddings:
```bash
npx tsx scripts/generate-embeddings.ts
```

### 5. Run the Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see your AI-Native Mall!

## Features Overview

### 1. AI-Generated Product Descriptions
- **Location**: `lib/ai/generateDescription.ts`
- **Usage**: Automatically generate compelling product descriptions based on name, category, and district theme
- **Example**:
  ```typescript
  import { generateProductDescription } from '@/lib/ai/generateDescription';
  
  const result = await generateProductDescription(
    'Smart Watch Pro',
    'Electronics',
    'Tech District'
  );
  ```

### 2. AI Auto-Tagging
- **Location**: `lib/ai/generateTags.ts`
- **Usage**: Generate relevant tags for products
- **Example**:
  ```typescript
  import { generateProductTags } from '@/lib/ai/generateTags';
  
  const tags = await generateProductTags(
    'Wireless Earbuds',
    'High-quality audio experience...',
    'Tech District'
  );
  ```

### 3. Semantic Search (pgvector)
- **Location**: `lib/ai/semanticSearch.ts`
- **Usage**: Search products using natural language
- **Example**:
  ```typescript
  import { semanticSearch } from '@/lib/ai/semanticSearch';
  
  const results = await semanticSearch('comfortable running shoes', 10);
  ```

### 4. AI-Generated SEO Metadata
- **Location**: `lib/ai/generateSEO.ts`
- **Usage**: Generate optimized meta tags for products and pages
- **Example**:
  ```typescript
  import { generateSEOMetadata } from '@/lib/ai/generateSEO';
  
  const seo = await generateSEOMetadata(
    'Product Page',
    'Product details...',
    'Tech District'
  );
  ```

### 5. AI-Generated Social Media Content
- **Location**: `lib/ai/generateSocial.ts`
- **Usage**: Create platform-specific social media posts
- **Example**:
  ```typescript
  import { generateSocialMediaAssets } from '@/lib/ai/generateSocial';
  
  const social = await generateSocialMediaAssets(
    'Gaming Laptop',
    'Powerful gaming machine...',
    'Tech District'
  );
  ```

### 6. Shopping Cart & Checkout
- **Cart Page**: `/cart`
- **Checkout Page**: `/checkout`
- **State Management**: Zustand store (`lib/store/cartStore.ts`)
- **Features**:
  - Client-side cart persistence
  - Add/remove items
  - Quantity adjustment
  - Order creation with Supabase

### 7. Vendor Onboarding
- **Registration**: `/vendor-registration`
- **Admin Management**: `/admin/vendors`
- **Product Upload**: `/admin/vendors/[vendorId]/products/upload`
- **Features**:
  - Vendor application submission
  - Admin approval workflow
  - AI-assisted product upload with auto-generated descriptions

### 8. Analytics Tracking
- **Location**: `lib/analytics/tracking.ts`
- **Tracked Events**:
  - Product views
  - Product clicks
  - Add to cart
  - Purchases
  - Search queries
- **Usage**: Automatically tracked via ProductCard component

### 9. Personalized Recommendations
- **Location**: `lib/recommendations/engine.ts`
- **Component**: `components/RecommendationsSection.tsx`
- **Features**:
  - Tag-based similarity
  - District-specific recommendations
  - Trending products
  - Personalized based on browsing history

### 10. Admin Dashboard
- **Location**: `/admin/dashboard`
- **Features**:
  - Analytics summary (views, clicks, purchases, revenue)
  - Top products by views
  - District popularity charts
  - Trending products table
  - AI-powered insights (conversion rate, cart abandonment)

## Key Routes

### Public Routes
- `/` - Homepage with districts
- `/districts/[slug]` - District-specific product listings
- `/cart` - Shopping cart
- `/checkout` - Checkout page
- `/vendor-registration` - Vendor signup

### Admin Routes
- `/admin/dashboard` - Analytics dashboard
- `/admin/vendors` - Vendor management
- `/admin/vendors/[vendorId]/products/upload` - Product upload

## Database Tables

### Core Tables
- `microstores` - District/store information
- `products` - Product catalog with pgvector embeddings
- `vendors` - Vendor information and status
- `orders` - Customer orders
- `order_items` - Order line items
- `analytics` - Event tracking
- `cart_items` - Server-side cart (optional)
- `product_seo` - SEO metadata
- `product_social` - Social media content

## API Integration

### OpenAI
All AI features use OpenAI's GPT-4 and text-embedding-3-small models via the OpenAI SDK.

### Supabase
- **Client**: `lib/supabaseClient.ts`
- **Real-time**: Available for order updates
- **Storage**: Can be added for product images
- **Auth**: Ready for Supabase Auth integration

## Customization

### Styling
- Uses Tailwind CSS
- Global styles: `styles/globals.css`
- Customize colors in `tailwind.config.js`

### Districts/Categories
Modify district themes in:
- Product upload form
- AI generation prompts
- District filtering logic

### AI Models
Change AI models in `lib/ai/openaiClient.ts`:
- GPT model: Currently `gpt-4`
- Embedding model: Currently `text-embedding-3-small`

## Performance Optimization

### Embeddings
- Generate embeddings asynchronously
- Use batch processing for large product catalogs
- Consider caching frequent searches

### Analytics
- Use database indexes (already configured)
- Aggregate data for dashboard (RPC functions)
- Consider moving to a dedicated analytics service for scale

### Recommendations
- Cache trending products
- Use Redis for real-time recommendations (optional)
- Optimize tag-based matching

## Security Considerations

### Environment Variables
- Never commit `.env.local`
- Use different keys for development and production
- Rotate API keys regularly

### Row Level Security (RLS)
- Configured in `supabase-complete-schema.sql`
- Adjust policies based on your auth setup
- Test policies thoroughly

### API Rate Limits
- OpenAI: Monitor usage and set limits
- Implement request queuing for bulk operations
- Consider caching AI-generated content

## Troubleshooting

### Embeddings Not Working
1. Ensure pgvector extension is enabled
2. Check OpenAI API key is valid
3. Verify products have the `embedding` column

### Analytics Not Tracking
1. Check RLS policies on analytics table
2. Verify tracking functions are called in components
3. Check browser console for errors

### Cart Not Persisting
1. Clear browser localStorage
2. Check Zustand persist configuration
3. Verify browser supports localStorage

### AI Generation Fails
1. Verify OpenAI API key
2. Check API quota/limits
3. Review error logs for specific issues

## Next Steps

### Recommended Enhancements
1. Add user authentication (Supabase Auth)
2. Implement product reviews and ratings
3. Add real-time order tracking
4. Create mobile app with React Native
5. Add email notifications (SendGrid, Resend)
6. Implement payment processing (Stripe)
7. Add product images to Supabase Storage
8. Create A/B testing for AI-generated content
9. Add multi-language support
10. Implement advanced search filters

## Support

For issues or questions:
1. Check existing documentation
2. Review Supabase and OpenAI docs
3. Check component implementations
4. Review error logs

## License

This is a demonstration project. Adjust licensing as needed for your use case.
