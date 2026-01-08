# 🚀 Quick Setup Guide

## Prerequisites
- Node.js 18+ installed
- Supabase account
- Stripe account (for payments)
- OpenAI API key
- Google Analytics account (optional)

## Installation Steps

### 1. Install Dependencies
```bash
npm install
```

New packages added:
- `@stripe/stripe-js` - Stripe client SDK
- `@supabase/auth-helpers-nextjs` - Supabase Auth helpers for Next.js
- `stripe` - Stripe server SDK

### 2. Configure Environment Variables

Copy the example file:
```bash
cp .env.local.example .env.local
```

Fill in your credentials:
```env
# Supabase (Already configured)
NEXT_PUBLIC_SUPABASE_URL=https://wmiqtmtjhlpfsjwjvwgl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# OpenAI (Already configured)  
OPENAI_API_KEY=your_openai_key

# Stripe (NEW - Required for payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Google Analytics (NEW - Optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Enable Supabase Authentication

In your Supabase Dashboard:
1. Go to **Authentication** > **Providers**
2. Enable **Email** provider
3. Under **URL Configuration**, add:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

### 4. Create Orders Table

Run this SQL in Supabase SQL Editor:
```sql
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  stripe_session_id TEXT NOT NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'completed',
  customer_email TEXT,
  items JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_stripe ON orders(stripe_session_id);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "System can insert orders" ON orders
  FOR INSERT WITH CHECK (true);
```

### 5. Setup Stripe Webhooks (Development)

Install Stripe CLI:
```bash
# Windows (using Scoop)
scoop install stripe

# Or download from: https://stripe.com/docs/stripe-cli
```

Login and forward webhooks:
```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret to `.env.local`:
```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 6. Get Stripe API Keys

From Stripe Dashboard (https://dashboard.stripe.com/test/apikeys):
1. Copy **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
2. Copy **Secret key** → `STRIPE_SECRET_KEY`

### 7. Setup Google Analytics (Optional)

1. Create property at https://analytics.google.com
2. Get Measurement ID (starts with `G-`)
3. Add to `.env.local`

### 8. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## 🎯 Testing the New Features

### 1. Test Authentication
- Visit http://localhost:3000/auth/signup
- Create an account with any email
- Check Supabase Dashboard → Authentication → Users

### 2. Test Payments
- Add products to cart
- Click **Checkout**
- Use Stripe test card: `4242 4242 4242 4242`
- Any future expiry date
- Any CVC
- Complete payment
- Check `orders` table in Supabase

### 3. Test Admin Dashboard
- Visit http://localhost:3000/admin/creators
- View creator applications
- Approve/suspend accounts

### 4. Test Consciousness API
```bash
# Track emotional state
curl -X POST http://localhost:3000/api/consciousness/emotional-state \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-123","emotion":"joy","intensity":80}'

# Get healing circles
curl http://localhost:3000/api/consciousness/healing-circles?userId=user-123
```

### 5. Test Analytics
- Open browser console
- Navigate around the site
- Check Network tab for `google-analytics` requests
- View real-time reports in Google Analytics

## 📂 New Files Structure

```
ai-mall/
├── app/
│   ├── api/
│   │   ├── stripe/
│   │   │   ├── create-checkout/route.ts  ✨ NEW
│   │   │   └── webhook/route.ts          ✨ NEW
│   │   └── consciousness/
│   │       ├── emotional-state/route.ts  ✨ NEW
│   │       ├── curator/route.ts          ✨ NEW
│   │       └── healing-circles/route.ts  ✨ NEW
│   ├── auth/
│   │   ├── login/page.tsx                ✨ NEW
│   │   └── signup/page.tsx               ✨ NEW
│   ├── checkout/
│   │   ├── page.tsx                      ✨ NEW
│   │   └── success/page.tsx              ✨ NEW
│   └── admin/
│       └── creators/page.tsx             ✨ NEW
├── components/
│   └── UserMenu.tsx                      ✨ NEW
└── lib/
    ├── auth/
    │   └── AuthContext.tsx               ✨ NEW
    └── analytics/
        └── GoogleAnalytics.tsx           ✨ NEW
```

## 🔧 Troubleshooting

### Stripe webhook not working
- Make sure `stripe listen` is running
- Check webhook secret matches `.env.local`
- Verify endpoint URL in terminal output

### Authentication not working
- Check Supabase redirect URLs are correct
- Verify `.env.local` has correct Supabase keys
- Check browser console for errors

### Orders not being created
- Check `orders` table exists in Supabase
- Verify RLS policies are created
- Check webhook is receiving events

## 🎉 You're All Set!

Your AI-Native Mall now has:
- ✅ Full user authentication
- ✅ Secure Stripe payments
- ✅ Admin dashboard
- ✅ Consciousness API
- ✅ Google Analytics

Ready to build something amazing! 🚀
