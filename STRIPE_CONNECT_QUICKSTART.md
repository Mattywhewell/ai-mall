# 🚀 Stripe Connect Quick Setup Guide

## For AI City Marketplace

---

## ⚡ Quick Decision: Standard vs Express

### ✅ Choose **STANDARD** if:
- You want Stripe to handle support
- Suppliers should control their own payouts
- You want fastest/easiest setup
- You want minimal compliance responsibility
- **← RECOMMENDED FOR AI CITY**

### Choose **EXPRESS** if:
- You need full control over supplier UX
- You want custom branded experience
- You're building embedded dashboards
- You handle support yourself

---

## 📋 5-Minute Setup Checklist

### Step 1: Enable Connect (2 min)
```
1. Go to Stripe Dashboard
2. Settings → Connect → Get Started
3. Select "Standard" accounts
4. Complete business verification
5. Accept terms
```

### Step 2: Get Client ID (1 min)
```
1. Settings → Connect → Settings
2. Copy Client ID (ca_xxxxx)
3. Add to .env.local:
   STRIPE_CONNECT_CLIENT_ID=ca_xxxxx
```

### Step 3: Set Redirect URLs (1 min)
```
Development:
http://localhost:3000/api/stripe/connect/callback

Production:
https://yourdomain.com/api/stripe/connect/callback
```

### Step 4: Brand Settings (1 min)
```
1. Settings → Connect → Branding
2. Upload AI City logo
3. Set colors
4. Save
```

### Step 5: Test (Optional)
```
1. Visit /supplier dashboard
2. Click "Connect Stripe"
3. Complete onboarding
4. Verify in dashboard
```

---

## 🎯 What You Get

### With Standard Accounts:
✅ Instant supplier payouts
✅ Automatic revenue splitting
✅ Stripe handles compliance
✅ Full supplier dashboard access
✅ Professional experience
✅ Minimal platform liability

### How It Works:
```
1. Supplier clicks "Connect Stripe" in AI City
2. Redirects to Stripe OAuth
3. Supplier logs in/creates account
4. Completes verification (business info, bank)
5. Returns to AI City - Connected! ✨
6. AI City can now send payouts automatically
```

---

## 💰 Payout Flow

```
Customer Purchase ($100)
         ↓
Platform Fee (10% = $10) → AI City
         ↓
Supplier Share (90% = $90) → Supplier's Stripe
         ↓
Automatic Transfer → Supplier's Bank
```

**Timing:**
- Instant: Every 6 hours (for high volume)
- Weekly: Every Monday
- Monthly: 1st of month

---

## 🔑 Required Environment Variables

```bash
# After setup, you need these in .env.local:

STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_CONNECT_CLIENT_ID=ca_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
CRON_SECRET=your-random-string
```

---

## 🧪 Test the Integration

### 1. Test Account Connection
```bash
# Supplier connects their Stripe
Visit: http://localhost:3000/supplier
Click: "Connect Stripe Account"
Complete: Stripe OAuth flow
Result: Account connected ✅
```

### 2. Test Payout
```bash
# Trigger a test payout
POST /api/admin/payouts/process
{
  "supplierId": "test_supplier_123",
  "amount": 1000
}

# Check Stripe Dashboard
- View in Connect → Accounts
- See transfer in Payments
- Verify supplier received funds
```

### 3. Test Webhook
```bash
# Use Stripe CLI
stripe trigger transfer.created
stripe trigger payout.paid

# Check your webhook endpoint
# Should see events logged
```

---

## 🚨 Common Issues

### "No Client ID found"
**Fix:** Add `STRIPE_CONNECT_CLIENT_ID` to `.env.local`

### "Invalid redirect URI"
**Fix:** Add your callback URL in Stripe Settings → Connect → OAuth settings

### "Account not connected"
**Fix:** Supplier needs to complete Stripe onboarding first

### "Cannot create payout"
**Fix:** 
- Check supplier completed verification
- Verify they have a bank account connected
- Ensure account is active in dashboard

---

## 📱 Supplier Experience

### What Suppliers See:

1. **In AI City Supplier Dashboard:**
   ```
   [Connect Stripe Account] button
   ↓
   "Connect your Stripe account to receive automatic payouts"
   ```

2. **On Stripe:**
   ```
   - "AI City wants to connect to your Stripe account"
   - Business information form
   - Bank account connection
   - Verification documents (if needed)
   ```

3. **After Connection:**
   ```
   ✅ Connected to Stripe
   - View payouts in your Stripe dashboard
   - Update bank account anytime
   - See transaction history
   - Manage payout schedule
   ```

---

## 🎓 Resources

**Stripe Documentation:**
- Connect Overview: https://stripe.com/docs/connect
- Standard Accounts: https://stripe.com/docs/connect/standard-accounts
- Express Accounts: https://stripe.com/docs/connect/express-accounts
- OAuth Flow: https://stripe.com/docs/connect/oauth-reference

**AI City Files:**
- Connect Onboarding: `/app/api/stripe/connect/onboard/route.ts`
- Connect Callback: `/app/api/stripe/connect/callback/route.ts`
- Payout Processor: `/lib/stripe/payout-processor.ts`
- Cron Job: `/app/api/cron/process-payouts/route.ts`

---

## ✅ Final Checklist

Before going live:

- [ ] Stripe Connect enabled
- [ ] Standard accounts selected
- [ ] Client ID copied to `.env.local`
- [ ] Redirect URIs configured
- [ ] Brand settings updated
- [ ] Test mode working
- [ ] Webhooks configured
- [ ] Supplier onboarding tested
- [ ] Test payout successful
- [ ] Switch to live mode keys
- [ ] Deploy to production

---

**You're ready! Suppliers can now connect and receive automatic payouts! 💰✨**
