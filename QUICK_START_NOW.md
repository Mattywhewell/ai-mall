# 🎯 QUICK START GUIDE

## ✅ What's Already Done

1. ✅ **Dependencies Installed**
   - @sentry/nextjs (error monitoring)
   - openai (AI features)
   - stripe (payments)
   - All Next.js dependencies

2. ✅ **Configuration Files Created**
   - Sentry configs (client, server, edge)
   - Environment variables (.env.local)
   - Test scripts ready

3. ✅ **Dev Server Running**
   - 🌐 Local: http://localhost:3000
   - 🌐 Network: http://192.168.0.13:3000

---

## 🚀 Next Steps (In Order)

### Step 1: Run Database Migrations (REQUIRED)

1. Open Supabase SQL Editor:
   - Go to: https://supabase.com/dashboard/project/wmiqtmtjhlpfsjwjvwgl/sql
   
2. Click "New Query"

3. Copy and paste the entire contents of:
   - `COMPLETE_MIGRATION.sql`

4. Click "RUN" ▶️

5. Wait for success message: "✅ Migration complete!"

6. Verify in Database → Tables:
   - `ai_prompt_templates` ✓
   - `ai_prompt_versions` ✓

---

### Step 2: Add Missing Service Role Key (REQUIRED)

1. Get your service role key:
   - Go to: https://supabase.com/dashboard/project/wmiqtmtjhlpfsjwjvwgl/settings/api
   - Copy the `service_role` key (keep it secret!)

2. Open `.env.local`

3. Replace this line:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

4. With your actual key:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_actual_key_here
   ```

5. Save the file

---

### Step 3: Enable OAuth Providers (OPTIONAL)

#### Google Login:
1. Go to: https://supabase.com/dashboard/project/wmiqtmtjhlpfsjwjvwgl/auth/providers
2. Enable "Google"
3. Create OAuth app at: https://console.cloud.google.com
4. Set redirect URI: `https://wmiqtmtjhlpfsjwjvwgl.supabase.co/auth/v1/callback`
5. Copy Client ID and Secret to Supabase

#### GitHub Login:
1. Enable "GitHub" in Supabase
2. Create OAuth app at: https://github.com/settings/developers
3. Set callback URL: `https://wmiqtmtjhlpfsjwjvwgl.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret to Supabase

---

### Step 4: Test Critical Flows

#### Test 1: Email Verification
```bash
npx tsx scripts/test-email-verification.ts
```
Expected: User created, verification email sent

#### Test 2: Content Moderation
```bash
npx tsx scripts/test-moderation.ts
```
Expected: Safe content passes, inappropriate content flagged

#### Test 3: Duplicate Detection
```bash
npx tsx scripts/test-duplicate.ts
```
Expected: Duplicate check runs (requires products in database)

#### Test 4: Visit Admin Pages
- Health Dashboard: http://localhost:3000/admin/system-health
- Prompts Management: http://localhost:3000/admin/prompts
- Products Import: http://localhost:3000/admin/products/import

---

## 📋 Quick Health Check

Run this checklist to verify everything works:

```bash
# 1. Check dev server is running
curl http://localhost:3000

# 2. Check health endpoint
curl http://localhost:3000/api/health

# 3. Test email verification (creates test user)
npx tsx scripts/test-email-verification.ts

# 4. Test moderation (requires OpenAI key)
npx tsx scripts/test-moderation.ts
```

---

## 🔧 Troubleshooting

### Server won't start:
```bash
# Kill existing process
npx kill-port 3000

# Restart
npm run dev
```

### Missing environment variables:
```bash
# Check which variables are set
cat .env.local | grep -v "^#" | grep "="
```

### Database connection fails:
- Verify Supabase URL and anon key in `.env.local`
- Check Supabase dashboard is accessible
- Verify service role key is correct

### OpenAI API errors:
- Check API key is valid: https://platform.openai.com/api-keys
- Verify billing is set up
- Check rate limits

---

## 🎉 You're Ready When...

- ✅ Dev server running on http://localhost:3000
- ✅ Database migrations completed
- ✅ Service role key added to `.env.local`
- ✅ Health endpoint returns 200: http://localhost:3000/api/health
- ✅ Test scripts run without errors
- ✅ Admin pages load successfully

---

## 🚀 Deploy to Production

When ready to deploy:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add all environment variables from .env.local
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
# ... etc

# Deploy to production
vercel --prod
```

---

## 📚 Additional Resources

- [PRODUCTION_SETUP_CHECKLIST.md](PRODUCTION_SETUP_CHECKLIST.md) - Complete production setup
- [ENV_SETUP_GUIDE.md](ENV_SETUP_GUIDE.md) - Environment variables guide
- [SECURITY_AUDIT.md](SECURITY_AUDIT.md) - Security status
- [Supabase Dashboard](https://supabase.com/dashboard/project/wmiqtmtjhlpfsjwjvwgl)
- [Stripe Dashboard](https://dashboard.stripe.com)

---

## 🆘 Need Help?

- Check [PRODUCTION_SETUP_CHECKLIST.md](PRODUCTION_SETUP_CHECKLIST.md) for detailed troubleshooting
- Verify all environment variables are set correctly
- Check Supabase logs for errors
- Monitor Stripe webhooks in dashboard

---

**Your AI Commerce Platform is 90% ready for production!** 🎊

Just complete Step 1 (database migrations) and Step 2 (service role key), and you're good to go! 🚀
