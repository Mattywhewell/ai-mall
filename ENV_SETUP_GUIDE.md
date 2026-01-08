# Environment Variables Configuration Guide

## Required Environment Variables

Create a `.env.local` file in the root directory with these variables:

### Supabase (Database & Auth)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### OpenAI (AI Features)
```env
OPENAI_API_KEY=sk-your_openai_api_key_here
```

### Stripe (Payments)
```env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Sentry (Error Monitoring)
```env
NEXT_PUBLIC_SENTRY_DSN=https://your_sentry_dsn@sentry.io/project_id
SENTRY_AUTH_TOKEN=your_sentry_auth_token
```

### Optional: Redis (Rate Limiting - Production)
```env
REDIS_URL=redis://your-redis-instance:6379
UPSTASH_REDIS_REST_URL=https://your-upstash-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

## Setup Instructions

### 1. Supabase Setup
1. Go to [supabase.com](https://supabase.com) and create a project
2. Navigate to Project Settings → API
3. Copy values:
   - `URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

**Enable Email Verification:**
1. Go to Authentication → Providers → Email
2. Enable "Confirm email" toggle
3. Customize email templates

**Enable OAuth Providers:**
- Google: Create OAuth app in Google Cloud Console
- GitHub: Create OAuth app in GitHub Settings

### 2. OpenAI Setup
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create API key
3. Set up billing

### 3. Stripe Setup
1. Go to [stripe.com](https://stripe.com)
2. Get API keys from Developers → API keys
3. For webhooks: Install Stripe CLI
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

### 4. Sentry Setup
1. Go to [sentry.io](https://sentry.io)
2. Create Next.js project
3. Run: `npx @sentry/wizard@latest -i nextjs`

## Production Checklist
- [ ] Switch all keys to production values
- [ ] Enable RLS policies
- [ ] Configure rate limits
- [ ] Set up monitoring alerts
- [ ] Update legal pages
