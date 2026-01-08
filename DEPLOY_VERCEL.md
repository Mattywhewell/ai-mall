# 🚀 Deploy to Vercel - Complete Guide

## Quick Start (Recommended)

### Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Push to GitHub** (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit - AI Mall ready for deployment"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/ai-mall.git
   git push -u origin main
   ```

2. **Go to Vercel**:
   - Visit https://vercel.com
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Vercel auto-detects Next.js configuration ✅

3. **Configure Environment Variables**:
   Click "Environment Variables" and add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   OPENAI_API_KEY=your_openai_api_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

4. **Deploy**:
   - Click "Deploy"
   - Wait 2-3 minutes ⏱️
   - Your site is live! 🎉

---

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from project directory**:
   ```bash
   cd C:\Users\cupca\Documents\ai-mall
   vercel
   ```

4. **Follow prompts**:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N** (first time)
   - What's your project's name? `ai-mall`
   - In which directory is your code? `./`
   - Auto-detected Next.js. Override? **N**

5. **Set environment variables**:
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   vercel env add OPENAI_API_KEY
   vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   vercel env add STRIPE_SECRET_KEY
   vercel env add STRIPE_WEBHOOK_SECRET
   vercel env add NEXT_PUBLIC_BASE_URL
   ```

6. **Deploy to production**:
   ```bash
   vercel --prod
   ```

---

## 📋 Pre-Deployment Checklist

### 1. Environment Variables Ready
- [ ] Supabase URL and keys
- [ ] OpenAI API key
- [ ] Stripe keys (use **live keys** for production!)
- [ ] Base URL (your Vercel domain)
- [ ] Google Analytics ID (optional)

### 2. Database Setup
- [ ] All 17 migrations run successfully
- [ ] Row Level Security (RLS) policies enabled
- [ ] Tables populated with seed data (optional)

### 3. Stripe Configuration
- [ ] Switch to **live mode** keys
- [ ] Update webhook endpoint: `https://your-domain.vercel.app/api/stripe/webhook`
- [ ] Configure webhook in Stripe Dashboard
- [ ] Add legal page URLs to Stripe account settings

### 4. Supabase Configuration
- [ ] Add production URL to allowed domains
- [ ] Update Auth redirect URLs: `https://your-domain.vercel.app/auth/callback`
- [ ] Verify CORS settings

---

## 🔧 Deployment Configuration

### vercel.json (Optional - Already Auto-configured)

Create `vercel.json` in project root if you need custom settings:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["sfo1"],
  "env": {
    "NEXT_PUBLIC_BASE_URL": "https://your-domain.vercel.app"
  }
}
```

---

## 🌐 After Deployment

### 1. Update Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. URL: `https://your-domain.vercel.app/api/stripe/webhook`
4. Events to send:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy webhook secret
6. Add to Vercel environment variables

### 2. Update Supabase Settings

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Site URL: `https://your-domain.vercel.app`
3. Redirect URLs:
   - `https://your-domain.vercel.app/auth/callback`
   - `https://your-domain.vercel.app/**`

### 3. Test Your Deployment

Visit these URLs:
- ✅ Homepage: `https://your-domain.vercel.app`
- ✅ Login: `https://your-domain.vercel.app/auth/login`
- ✅ About: `https://your-domain.vercel.app/about`
- ✅ API Health: `https://your-domain.vercel.app/api/consciousness/healing-circles`

### 4. Configure Custom Domain (Optional)

1. In Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records as shown
4. Update all environment variables with new domain

---

## 🚨 Important: Production vs Development

### Switch to Production Keys

**Stripe:**
```bash
# Development (test mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Production (live mode) - USE THESE FOR VERCEL
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

**Supabase:**
- Use your production Supabase project URL and keys

**OpenAI:**
- Review rate limits for production usage
- Consider upgrading plan if needed

---

## 📊 Monitoring & Analytics

### Vercel Analytics (Built-in)
- Automatically tracks page views
- View in Vercel Dashboard → Analytics

### Google Analytics
- Verify `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set
- Check Google Analytics dashboard after deployment

### Error Monitoring
- View logs in Vercel Dashboard → Deployments → Logs
- Consider adding Sentry for error tracking

---

## 🔄 Continuous Deployment

Once connected to GitHub:

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Update feature"
   git push
   ```

2. **Auto-deploy**: Vercel automatically deploys on every push to `main`

3. **Preview Deployments**: Branches get preview URLs automatically

---

## 🐛 Troubleshooting

### Build Fails

**Error: Missing environment variables**
- Add all required env vars in Vercel Dashboard
- Check for typos in variable names

**Error: Module not found**
```bash
# Run locally first to verify
npm install
npm run build
```

**Error: API routes not working**
- Check environment variables are set
- Verify Supabase connection
- Check function logs in Vercel Dashboard

### Stripe Webhook Not Working

1. Verify webhook URL is correct: `https://your-domain.vercel.app/api/stripe/webhook`
2. Check webhook secret matches Vercel env var
3. Test webhook in Stripe Dashboard → Send test webhook

### Authentication Issues

1. Check redirect URLs in Supabase
2. Verify `NEXT_PUBLIC_BASE_URL` matches your domain
3. Check cookies are enabled

---

## 💰 Vercel Pricing

- **Hobby (Free)**:
  - Perfect for testing
  - 100 GB bandwidth/month
  - Unlimited deployments
  - Custom domain (1)

- **Pro ($20/month)**:
  - Better for production
  - 1 TB bandwidth/month
  - Advanced analytics
  - Password protection
  - More team members

---

## ⚡ Performance Optimization

### Before Deploying:

1. **Optimize Images**: Use Next.js `<Image>` component (already using ✅)
2. **Remove Console Logs**: Clean up debugging code
3. **Enable Compression**: Automatic with Vercel ✅
4. **Check Bundle Size**:
   ```bash
   npm run build
   # Check output for large bundles
   ```

---

## 📝 Quick Commands Reference

```bash
# Deploy to Vercel
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# List deployments
vercel ls

# Add environment variable
vercel env add VARIABLE_NAME

# Pull environment variables locally
vercel env pull .env.local

# Remove deployment
vercel rm deployment-url
```

---

## 🎯 Deployment Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Using **live** Stripe keys
- [ ] Webhook endpoint updated in Stripe
- [ ] Supabase redirect URLs updated
- [ ] Database migrations complete
- [ ] Legal pages reviewed
- [ ] Contact information updated
- [ ] Test authentication flow
- [ ] Test payment flow with live keys
- [ ] Test all API endpoints
- [ ] Check mobile responsiveness
- [ ] Review error handling
- [ ] Set up monitoring/alerts

---

## 🆘 Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Vercel Support**: support@vercel.com
- **Community**: https://github.com/vercel/next.js/discussions

---

## 🎉 You're Ready!

Your AI Mall is production-ready and optimized for Vercel deployment!

**Next steps:**
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Click Deploy
5. Update Stripe webhook
6. Test everything
7. Share with the world! 🚀
