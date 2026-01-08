# Testing Stripe Connect Integration

## 🎯 Quick Test Guide

This guide helps you test the complete Stripe Connect OAuth flow for supplier payouts.

## Prerequisites

✅ Stripe Connect configured in Stripe Dashboard  
✅ Environment variables set in `.env.local`:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_CONNECT_CLIENT_ID=ca_...
```
✅ Database migration applied: `supabase-stripe-connect-migration.sql`

---

## 🧪 Test Flow (5 minutes)

### Step 1: Start Dev Server
```bash
npm run dev
```

### Step 2: Navigate to Supplier Dashboard
Open: `http://localhost:3000/supplier`

You should see:
- **Website Info Banner** (if supplier has a website)
- **Payment Account Banner** with "Connect Your Stripe Account" button

### Step 3: Click "Connect Your Stripe Account"

The button will:
1. Call `POST /api/stripe/connect/onboard`
2. Generate Stripe OAuth URL
3. Redirect to Stripe Connect page

### Step 4: Complete Stripe OAuth

On Stripe's page, you'll be asked to:
- **Email**: Pre-filled from supplier data
- **Business name**: Pre-filled from supplier data
- **Business details**: Type of business, address, tax ID, etc.
- **Bank account**: For receiving payouts

**For testing**, Stripe provides a **Skip this form** button. Click it!

### Step 5: Return to Dashboard

After completion, Stripe redirects back to:
```
http://localhost:3000/api/stripe/connect/callback?code=ac_xxx&state=supplier_123
```

The callback handler will:
1. Exchange `code` for Stripe account ID
2. Save `stripe_account_id` to database
3. Redirect to `/supplier?success=stripe_connected`

### Step 6: Verify Connection

On the dashboard, you should see:
- ✅ **Green checkmark**: "Stripe Connected"
- **Account ID**: `acct_xxxxxxxxxxxxx`
- **Success message**: "You're all set! Automatic payouts will be processed..."

---

## 🔍 Verify in Database

Check the database to confirm the connection:

```sql
SELECT 
  id, 
  business_name, 
  email, 
  stripe_account_id, 
  stripe_connected_at
FROM suppliers
WHERE id = 'supplier_123';
```

Expected result:
```
id            | supplier_123
business_name | Test Supplier
email         | test@example.com
stripe_account_id | acct_1234567890AbCdEf
stripe_connected_at | 2024-01-15 10:30:45+00
```

---

## 🎨 UI States

### Before Connection
```
┌─────────────────────────────────────────┐
│ 💳 Payment Account                      │
├─────────────────────────────────────────┤
│ Connect your Stripe account to receive  │
│ automatic payouts...                    │
│                                         │
│ ⚡ Why connect Stripe?                  │
│ • Instant setup with OAuth              │
│ • Automatic payouts after each order    │
│ • Full transaction history              │
│ • Bank-grade security                   │
│                                         │
│ [🔗 Connect Your Stripe Account]       │
└─────────────────────────────────────────┘
```

### After Connection
```
┌─────────────────────────────────────────┐
│ 💳 Payment Account                      │
├─────────────────────────────────────────┤
│ 🟢 ✓ Stripe Connected                   │
│ Account ID: acct_1234567890AbCdEf       │
│                                         │
│ 🎉 You're all set! Automatic payouts    │
│ will be processed within 2-3 business   │
│ days after each sale.                   │
└─────────────────────────────────────────┘
```

---

## 🔧 Troubleshooting

### Issue: "Failed to connect Stripe"
**Cause**: Missing `STRIPE_CONNECT_CLIENT_ID`  
**Fix**: Add to `.env.local` from Stripe Dashboard → Connect settings

### Issue: "Redirect URI mismatch"
**Cause**: OAuth redirect not configured in Stripe Dashboard  
**Fix**: Add `http://localhost:3000/api/stripe/connect/callback` to Stripe Dashboard → Connect → OAuth settings → Redirect URIs

### Issue: Button does nothing
**Cause**: API endpoint not found  
**Fix**: Verify files exist:
- `app/api/stripe/connect/onboard/route.ts`
- `app/api/stripe/connect/callback/route.ts`

### Issue: Database error
**Cause**: Missing `stripe_account_id` column  
**Fix**: Run migration:
```bash
psql -U postgres -d ai_city < supabase-stripe-connect-migration.sql
```

---

## 📊 Testing Payouts

Once connected, test the automatic payout flow:

### 1. Create Test Order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "supplierId": "supplier_123",
    "amount": 50.00,
    "status": "completed"
  }'
```

### 2. Trigger Payout Cron
```bash
curl -X POST http://localhost:3000/api/cron/process-payouts \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 3. Check Stripe Dashboard
Navigate to: **Stripe Dashboard → Connect → Transfers**

You should see a transfer to `acct_1234567890AbCdEf` for $47.50 (after 5% platform fee).

---

## 🚀 Production Checklist

Before deploying to production:

- [ ] Replace test Stripe keys with live keys
- [ ] Update OAuth redirect URI to production domain
- [ ] Test with real bank account (not test account)
- [ ] Verify webhook endpoint is configured for live mode
- [ ] Test payout timing (2-3 business days)
- [ ] Confirm platform fees are calculated correctly
- [ ] Add error logging to Sentry/LogRocket
- [ ] Create supplier support documentation

---

## 📚 Related Documentation

- [STRIPE_SETUP.md](./STRIPE_SETUP.md) - Complete Stripe configuration
- [STRIPE_CONNECT_QUICKSTART.md](./STRIPE_CONNECT_QUICKSTART.md) - Quick reference guide
- [Stripe Connect OAuth Docs](https://stripe.com/docs/connect/oauth-reference) - Official Stripe docs

---

## 💡 Common Questions

**Q: Can suppliers disconnect and reconnect?**  
A: Yes! They can revoke access in their Stripe dashboard and reconnect with a new account.

**Q: What happens if a supplier deletes their Stripe account?**  
A: The `stripe_account_id` becomes invalid. The system should check account status before attempting payouts.

**Q: Can we use Stripe Express accounts instead?**  
A: Yes, but Standard accounts are recommended for better control and reduced platform liability. See [STRIPE_SETUP.md](./STRIPE_SETUP.md#standard-vs-express) for comparison.

**Q: How long does onboarding take?**  
A: 2-5 minutes for most suppliers. Stripe may require additional verification for some businesses.

**Q: Are there any Stripe fees?**  
A: Yes, Stripe charges 2.9% + $0.30 per transaction, plus 0.25% for Connect payouts. See [Stripe Pricing](https://stripe.com/pricing).

---

**🎉 You're ready to test Stripe Connect!**

Run through the flow once to familiarize yourself with the user experience.
