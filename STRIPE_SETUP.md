# Stripe Configuration Guide

## 🚀 **LIVE & OPERATIONAL**

**🌐 Production URL**: https://ai-mall.vercel.app

**✅ Status**: Fully deployed on Vercel with enterprise security

---

## Required Stripe Keys for AI City

AI City uses Stripe for two main purposes:
1. **Customer Payments** - Process purchases from customers
2. **Supplier Payouts** - Automatic revenue distribution to suppliers

---

## 🔑 Environment Variables Setup

Add these to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51xxxxx...
STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxx...
STRIPE_WEBHOOK_SECRET=whsec_xxxxx...

# Stripe Connect (for supplier payouts)
STRIPE_CONNECT_CLIENT_ID=ca_xxxxx...

# Cron Security
CRON_SECRET=your-random-secure-string-here
```

---

## 📋 How to Get Your Stripe Keys

### 1. Create Stripe Account
- Go to https://stripe.com
- Sign up or log in
- Complete account verification

### 2. Get API Keys
**Location:** Dashboard → Developers → API Keys

**For Development (Test Mode):**
- **Publishable Key:** Starts with `pk_test_`
- **Secret Key:** Starts with `sk_test_`

**For Production (Live Mode):**
- **Publishable Key:** Starts with `pk_live_`
- **Secret Key:** Starts with `sk_live_`

⚠️ **Never commit secret keys to git!**

---

## 🔗 Stripe Connect Setup (Supplier Payouts)

Stripe Connect enables AI City to automatically pay suppliers. Choose the right account type for your marketplace.

### Account Type Selection 🎯

**📊 Comparison:**

| Feature | Standard Accounts | Express Accounts |
|---------|-------------------|------------------|
| Setup Complexity | ⭐ Easiest | ⭐⭐ Moderate |
| Supplier Experience | Own Stripe Dashboard | Embedded Dashboard |
| Branding | Stripe | Your Brand (AI City) |
| Support Responsibility | Stripe | You |
| Payout Control | Supplier Controls | Platform Controls |
| Best For | **AI City (Recommended)** | Custom Experience |

### ✅ Recommended: Standard Accounts

**Why Standard for AI City:**
- ✅ Suppliers get full Stripe dashboard access
- ✅ Stripe handles support and compliance
- ✅ Faster onboarding (suppliers may already have Stripe)
- ✅ Less liability for platform
- ✅ Suppliers control their own payout schedule
- ✅ Professional and trustworthy

**Perfect for:**
- Marketplaces with established vendors
- Platforms wanting minimal overhead
- When supplier independence is valued

### Express Accounts (Alternative)

**When to use Express:**
- You want full control over supplier experience
- Custom branded onboarding flow
- Suppliers are less tech-savvy
- You want to control payout timing
- Embedded dashboard within AI City

**Trade-offs:**
- More development work required
- You handle support questions
- More compliance responsibility

---

### 1. Enable Stripe Connect

**Step-by-Step:**

1. **Go to Stripe Dashboard**
   - Navigate to: **Settings → Connect**
   - Click **"Get Started"**

2. **Choose Account Type**
   - Select **"Standard"** (recommended for AI City)
   - Or **"Express"** if you need more control

3. **Complete Business Verification**
   - Provide business details
   - Verify identity
   - Submit for review

4. **Agree to Terms**
   - Review Stripe Connect agreement
   - Accept terms of service

**Approval Time:** Usually instant for test mode, 1-2 days for live mode

---

### 2. Get Connect Client ID

**After enabling Connect:**

1. Go to **Settings → Connect → Settings**
2. Find **"Development"** or **"Production"** section
3. Copy your **Client ID** (starts with `ca_`)
4. Add to `.env.local`:
   ```bash
   STRIPE_CONNECT_CLIENT_ID=ca_xxxxxxxxxxxxx
   ```

**Note:** You'll have separate Client IDs for test and live modes.

---

### 3. Configure OAuth Settings

**Set Redirect URIs** (where suppliers return after connecting):

**For Development:**
```
http://localhost:3000/api/stripe/connect/callback
```

**For Production:**
```
https://yourdomain.com/api/stripe/connect/callback
https://www.yourdomain.com/api/stripe/connect/callback
```

**Steps:**
1. Settings → Connect → Settings
2. Scroll to **"OAuth settings"**
3. Click **"Add redirect URI"**
4. Paste your URLs
5. Save changes

---

### 4. Configure Brand Settings

**Make it look professional:**

1. Settings → Connect → Branding
2. Upload your AI City logo
3. Set brand colors
4. Add company info
5. Save

**Suppliers will see this when connecting!**

---

### 5. Test Connect Flow

**Standard Accounts (Test Mode):**

```bash
# Generate connect link
POST /api/stripe/connect/onboard
{
  "supplierId": "test_supplier_123"
}

# Supplier clicks link → redirects to Stripe
# Supplier creates/connects Stripe account
# Redirects back to: /api/stripe/connect/callback
# Account saved, ready for payouts!
```

**Test with:**
- Use test mode keys
- Complete onboarding flow
- Verify account appears in dashboard
- Test a payout

---

## 🪝 Webhook Configuration

### 1. Create Webhook Endpoint
- Dashboard → Developers → Webhooks
- Click "Add endpoint"

**Development:**
```
http://localhost:3000/api/webhooks/stripe
```

**Production:**
```
https://yourdomain.com/api/webhooks/stripe
```

### 2. Select Events to Listen To
For AI City, select these events:

**Payment Events:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.succeeded`
- `charge.refunded`

**Connect Events (Payouts):**
- `account.updated`
- `payout.paid`
- `payout.failed`
- `transfer.created`

### 3. Get Webhook Secret
- After creating webhook, copy the **Signing Secret**
- Starts with `whsec_`
- Add to `.env.local` as `STRIPE_WEBHOOK_SECRET`

---

## 🧪 Testing with Stripe CLI

### Install Stripe CLI
```bash
# Windows (with Scoop)
scoop install stripe

# Or download from:
# https://stripe.com/docs/stripe-cli
```

### Login to Stripe
```bash
stripe login
```

### Forward Webhooks to Local Development
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will output a webhook secret starting with `whsec_` - use this for local testing!

### Test Payments
```bash
# Trigger test payment
stripe trigger payment_intent.succeeded

# Trigger test payout
stripe trigger payout.paid
```

---

## 💳 Test Cards

Stripe provides test card numbers:

**Successful Payment:**
```
Card: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
```

**Authentication Required (3D Secure):**
```
Card: 4000 0025 0000 3155
```

**Payment Declined:**
```
Card: 4000 0000 0000 9995
```

More test cards: https://stripe.com/docs/testing

---

## 🔒 Security Best Practices

### 1. Environment Variables
✅ Store keys in `.env.local`
✅ Add `.env.local` to `.gitignore`
❌ Never commit keys to repository
❌ Never expose secret keys in client code

### 2. Key Usage
- **Secret Key:** Server-side only (API routes)
- **Publishable Key:** Client-side safe
- **Webhook Secret:** Server-side only (webhook verification)

### 3. Production Checklist
- [ ] Use live keys (not test keys)
- [ ] Enable webhook signature verification
- [ ] Set up proper error handling
- [ ] Monitor webhook delivery in Stripe dashboard
- [ ] Configure webhook retries
- [ ] Set up Stripe alerting

---

## 🚀 AI City Specific Configuration

### 1. Payout System
**File:** `lib/stripe/payout-processor.ts`

The payout processor requires:
- `STRIPE_SECRET_KEY` - To create transfers
- Connected supplier Stripe accounts (via Stripe Connect)

**Payout Flow:**
1. Customer makes purchase
2. Revenue split calculated (platform fee + supplier share)
3. Cron job triggers payout processor
4. Automatic transfer to supplier's connected account

### 2. Automatic Payouts Schedule
**File:** `app/api/cron/process-payouts/route.ts`

**Cron Jobs:**
- Every 6 hours: Instant payouts (for high-volume suppliers)
- Weekly: Standard payouts (every Monday)
- Monthly: Low-volume payouts (1st of month)

**Vercel Cron Configuration:**
```json
{
  "crons": [
    {
      "path": "/api/cron/process-payouts",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### 3. Supplier Onboarding
**File:** `app/api/stripe/connect/onboard/route.ts`

Suppliers connect their Stripe account:
1. Click "Connect Stripe" in supplier dashboard
2. Redirected to Stripe OAuth
3. Complete verification
4. Connected account saved
5. Ready to receive payouts

---

## 📊 Monitoring & Analytics

### Stripe Dashboard
Monitor these metrics:
- Total volume
- Successful payments
- Failed payments
- Payout status
- Connected accounts
- Webhook delivery

### Stripe Connect Dashboard
Track supplier payouts:
- Connected accounts
- Transfer volume
- Payout history
- Account statuses

---

## 🐛 Common Issues

### Issue: "Invalid API Key"
**Solution:** Check that key starts with `sk_test_` or `sk_live_` and has no extra spaces

### Issue: "Webhook signature verification failed"
**Solution:** 
- Ensure `STRIPE_WEBHOOK_SECRET` is set correctly
- For local dev, use Stripe CLI webhook secret
- For production, use dashboard webhook secret

### Issue: "No such customer"
**Solution:** Ensure customer is created in same Stripe mode (test vs live)

### Issue: "Cannot create payout"
**Solution:** 
- Verify supplier has completed Stripe Connect onboarding
- Check that account is active and verified
- Ensure sufficient balance for payout

---

## 📚 Resources

**Stripe Documentation:**
- Getting Started: https://stripe.com/docs
- API Reference: https://stripe.com/docs/api
- Connect Guide: https://stripe.com/docs/connect
- Webhooks: https://stripe.com/docs/webhooks
- Testing: https://stripe.com/docs/testing

**AI City Implementation:**
- Payout Processor: `/lib/stripe/payout-processor.ts`
- Webhook Handler: `/app/api/webhooks/stripe/route.ts`
- Connect Onboarding: `/app/api/stripe/connect/onboard/route.ts`
- Cron Jobs: `/app/api/cron/process-payouts/route.ts`

---

## ✅ Quick Setup Checklist

- [ ] Create Stripe account
- [ ] Copy API keys to `.env.local`
- [ ] Enable Stripe Connect
- [ ] Copy Connect Client ID to `.env.local`
- [ ] Create webhook endpoint
- [ ] Copy webhook secret to `.env.local`
- [ ] Install Stripe CLI (for local testing)
- [ ] Test with test cards
- [ ] Verify webhook delivery
- [ ] Test supplier payout flow
- [ ] Configure cron jobs in Vercel
- [ ] Monitor dashboard for activity

---

**Your AI City marketplace is now ready to process payments and automatically pay suppliers! 💰✨**
