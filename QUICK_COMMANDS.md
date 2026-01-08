# 🎯 Quick Command Reference

## 🚀 Installation & Setup

```bash
# Install all dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Start development server
npm run dev

# Generate product embeddings
npm run generate-embeddings
```

## 🔧 Stripe Setup

```bash
# Install Stripe CLI (Windows)
scoop install stripe

# Login to Stripe
stripe login

# Forward webhooks to localhost
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Test webhook
stripe trigger checkout.session.completed
```

## 📊 Database Commands

```sql
-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  stripe_session_id TEXT NOT NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'completed',
  customer_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "System can insert orders" ON orders
  FOR INSERT WITH CHECK (true);
```

## 🧪 API Testing

```bash
# Track emotional state
curl -X POST http://localhost:3000/api/consciousness/emotional-state \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "emotion": "joy",
    "intensity": 80,
    "context": {"source": "shopping"}
  }'

# Get curator memories
curl "http://localhost:3000/api/consciousness/curator?userId=user-123&curatorName=aurora"

# Get healing circles
curl "http://localhost:3000/api/consciousness/healing-circles?userId=user-123"

# Create checkout session
curl -X POST http://localhost:3000/api/stripe/create-checkout \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{
      "id": "prod-1",
      "name": "Test Product",
      "description": "A test",
      "price": 29.99,
      "quantity": 1
    }],
    "userId": "user-123",
    "userEmail": "test@example.com"
  }'
```

## 🎨 Key URLs

```
Homepage:               http://localhost:3000
Login:                  http://localhost:3000/auth/login
Signup:                 http://localhost:3000/auth/signup
Cart:                   http://localhost:3000/cart
Checkout:               http://localhost:3000/checkout
Admin Creators:         http://localhost:3000/admin/creators
Admin Dashboard:        http://localhost:3000/admin/dashboard
City Explorer:          http://localhost:3000/city
AI Concierge:           http://localhost:3000/ai-concierge
```

## 📦 NPM Scripts

```json
{
  "dev": "next dev --turbopack",           // Start dev server
  "build": "next build",                    // Build for production
  "start": "next start",                    // Start production server
  "lint": "next lint",                      // Run linter
  "generate-embeddings": "tsx scripts/generate-embeddings.ts"  // Generate embeddings
}
```

## 🔐 Test Credentials

### Stripe Test Cards
```
Success:      4242 4242 4242 4242
Decline:      4000 0000 0000 0002
3D Secure:    4000 0025 0000 3155
Expiry:       Any future date
CVC:          Any 3 digits
ZIP:          Any 5 digits
```

### Test User (Create via signup)
```
Email:        test@example.com
Password:     password123
```

## 📚 Documentation Files

```
README.md                      - Main documentation
NEW_FEATURES.md                - New features overview
SETUP_NEW_FEATURES.md          - Detailed setup guide
COMPLETE_FEATURES_GUIDE.md     - Complete feature reference
QUICK_COMMANDS.md              - This file
```

## 🔍 Debugging

```bash
# Check Stripe webhook logs
stripe logs tail

# Watch Next.js logs
npm run dev

# Check Supabase logs
# Go to: Supabase Dashboard → Logs → API/Database

# Check browser console
# F12 → Console tab
```

## 🌐 Environment Variables Checklist

```env
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
✅ OPENAI_API_KEY
🆕 NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
🆕 STRIPE_SECRET_KEY
🆕 STRIPE_WEBHOOK_SECRET
🆕 NEXT_PUBLIC_GA_MEASUREMENT_ID (optional)
🆕 NEXT_PUBLIC_BASE_URL
```

## 🚀 Deployment Commands

```bash
# Build for production
npm run build

# Test production build locally
npm run start

# Deploy to Vercel
vercel

# Or push to main branch (if connected to Vercel)
git push origin main
```

## 💡 Quick Fixes

### If auth isn't working:
1. Check Supabase redirect URLs
2. Verify `.env.local` has correct keys
3. Check browser console for errors

### If payments fail:
1. Verify Stripe keys are test keys
2. Check `stripe listen` is running
3. Verify webhook secret matches

### If API routes 404:
1. Restart dev server
2. Clear `.next` folder: `rm -rf .next`
3. Run `npm run dev` again

---

**Need help?** Check the full guides:
- Setup: `SETUP_NEW_FEATURES.md`
- Features: `COMPLETE_FEATURES_GUIDE.md`
- Overview: `NEW_FEATURES.md`
