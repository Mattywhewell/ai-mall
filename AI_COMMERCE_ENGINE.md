# 🤖 AI Commerce Engine - Complete Documentation

## 🚀 **LIVE & OPERATIONAL**

**🌐 Production URL**: https://ai-mall.vercel.app

**✅ Status**: Fully deployed on Vercel with enterprise security

---

## Overview

The **AI Commerce Engine** is an automated marketplace management system that evaluates every product against a rigorous 5-pillar scoring system to ensure only **profitable, high-demand, low-risk, on-brand products** enter AI City.

**Purpose**: Eliminate manual product curation, maximize profitability, and maintain marketplace quality automatically.

---

## 🎯 5-Pillar Scoring System

Every product receives a score from 0-100 based on weighted evaluation across five pillars:

### 1. **PROFITABILITY** (35% weight) 💰

**What it measures**: Profit margin and absolute profit after all fees

**Scoring logic**:
```typescript
profit = sale_price - (supplier_cost + shipping + platform_fee + stripe_fee)
margin = profit / sale_price

Score:
- Margin ≥ 40% → 100 points
- Margin 35-39% → 90 points
- Margin 30-34% → 80 points
- Margin 25-29% → 70 points
- Margin 20-24% → 60 points
- Margin 15-19% → 50 points
- Margin 10-14% → 40 points
- Margin 5-9% → 20 points
- Margin < 5% → 0 points

Bonuses:
- Absolute profit > $50 → +10 points
- Absolute profit > $30 → +5 points
```

**Why it matters**: Products must be profitable after all fees (platform 5%, Stripe 2.9% + $0.30, shipping).

### 2. **DEMAND** (25% weight) 📈

**What it measures**: Market demand and trend direction

**AI Evaluation Factors**:
- Search volume (High/Medium/Low)
- Trend direction (Rising/Stable/Declining)
- Seasonality (Year-round/Seasonal)
- Social buzz (High/Medium/Low)
- Purchase intent (High/Medium/Low)

**Scoring**:
- High demand + rising trend → 80-100 points
- Moderate demand → 50-79 points
- Low demand or declining → 0-49 points

**Why it matters**: Only products with proven or emerging demand are imported.

### 3. **COMPETITION** (15% weight, inverted) 🏆

**What it measures**: Competitive landscape (lower competition = higher score)

**AI Evaluation Factors**:
- Number of competing sellers
- Price war intensity
- Brand dominance level
- Market saturation

**Scoring (inverted)**:
- Low competition → 80-100 points
- Moderate competition → 50-79 points
- High competition → 0-49 points

**Why it matters**: Avoid saturated markets where profit margins are squeezed.

### 4. **SUPPLIER QUALITY** (15% weight) ✅

**What it measures**: Supplier reliability and product quality

**Evaluation Factors**:
- **Reviews**: Rating and count
  - 4.5+ stars, 100+ reviews → +30 points
  - 4.0+ stars, 50+ reviews → +20 points
  - 3.5+ stars, 20+ reviews → +10 points
  - < 3.5 stars → -20 points
- **Stock availability**:
  - 100+ units → +15 points
  - 50-99 units → +10 points
  - 20-49 units → +5 points
  - < 20 units → -10 points
- **SKU provided** → +5 points
- **3+ images** → +5 points

**Why it matters**: Reliable suppliers = fewer returns, better customer experience.

### 5. **STRATEGIC FIT** (10% weight) 🎯

**What it measures**: Alignment with AI City brand and aesthetic

**AI Evaluation Factors**:
- Category alignment (Innovation, Wellness, Craft, Motion, Light)
- Aesthetic alignment (Premium/Standard/Low-end)
- Storytelling potential (High/Medium/Low)
- Bundle potential (Yes/No)

**Scoring**:
- Strong fit → 80-100 points
- Moderate fit → 50-79 points
- Weak fit → 0-49 points

**Why it matters**: Maintain AI City's unique brand identity and mystical aesthetic.

---

## 📊 Final Score Calculation

```typescript
final_score = 
  (profitability_score * 0.35) +
  (demand_score * 0.25) +
  (competition_score * 0.15) +
  (supplier_quality_score * 0.15) +
  (strategic_fit_score * 0.10)
```

### Example Calculation

**Product**: "Smart Meditation Pod"
- Profitability: 90 (45% margin)
- Demand: 85 (high and rising)
- Competition: 75 (moderate competition)
- Supplier Quality: 80 (4.3 stars, 75 reviews, 100 stock)
- Strategic Fit: 95 (perfect for Wellness Garden)

**Final Score**:
```
(90 * 0.35) + (85 * 0.25) + (75 * 0.15) + (80 * 0.15) + (95 * 0.10)
= 31.5 + 21.25 + 11.25 + 12 + 9.5
= 85.5 → IMPORT (High Priority)
```

---

## 🚦 Import Decision Rules

Based on final score, the engine makes one of four decisions:

### ✅ Import (High Priority) - Score ≥ 80
- **Action**: Immediately import and activate
- **Priority**: Featured in recommendations
- **Pricing**: Optimized for maximum margin
- **Why**: Top-tier products that excel across all pillars

### ✅ Import (Low Priority) - Score 70-79
- **Action**: Import but lower visibility
- **Priority**: Standard listings
- **Pricing**: Competitive but profitable
- **Why**: Good products that may have one weak pillar

### 🎁 Import (For Bundles) - Score 60-69
- **Action**: Import only if bundle potential detected
- **Priority**: Bundle/kit component only
- **Pricing**: Moderate margin acceptable
- **Why**: May not shine alone but valuable in curated sets

### ❌ Reject - Score < 60
- **Action**: Do not import
- **Re-evaluation**: After 30 days if supplier improves
- **Why**: Fails to meet quality/profitability standards

---

## 🔄 How It Works

### Step 1: Pull Product Feed
```typescript
// From supplier integration or manual upload
const products = await fetchSupplierProducts(supplierId);
```

### Step 2: Score Each Product
```typescript
for (const product of products) {
  // Run through 5-pillar evaluation
  const score = await scoreProduct(product);
  
  console.log({
    product: product.title,
    profitability: score.profitability_score,
    demand: score.demand_score,
    competition: score.competition_score,
    supplier_quality: score.supplier_quality_score,
    strategic_fit: score.strategic_fit_score,
    final_score: score.final_score,
    decision: score.import_decision
  });
}
```

### Step 3: Make Import Decisions
```typescript
if (score.final_score >= 80) {
  // High priority import
  await importProduct(product, { priority: 'high' });
  await enableProductSale(product.id);
  await generateBundles(product);
  
} else if (score.final_score >= 70) {
  // Low priority import
  await importProduct(product, { priority: 'low' });
  await enableProductSale(product.id);
  
} else if (score.final_score >= 60 && score.bundle_potential) {
  // Bundle-only import
  await importProduct(product, { priority: 'bundle' });
  await disableStandaloneSale(product.id);
  
} else {
  // Reject
  console.log(`❌ Rejected: ${product.title} (score: ${score.final_score})`);
}
```

### Step 4: Return Summary
```typescript
return {
  total_products: 50,
  imported_high_priority: 12,
  imported_low_priority: 18,
  imported_for_bundles: 5,
  rejected: 15,
  total_profit_potential: 4250.75,
  avg_score: 67
};
```

---

## 🖥️ Admin Dashboard

Access the Commerce Engine dashboard at: `/admin/commerce-engine`

### Features

**📊 Real-time Statistics**
- Total products evaluated
- Imported vs rejected breakdown
- Average score across all products
- Total profit potential

**⚡ Run Engine**
- **Dry Run Mode**: Score products without importing
- **Live Mode**: Score and automatically import approved products
- Batch processing (50 products at a time)
- Progress tracking and logging

**📈 Recent Evaluations Table**
- Product name and score
- Decision made (High/Low/Bundle/Reject)
- Individual pillar scores breakdown
- Evaluation timestamp

**🎯 Detailed Results**
- Per-product scoring breakdown
- Reasoning for each decision
- Calculated price and margin
- Bundle potential flag

---

## 🧪 Testing the Commerce Engine

### Test Mode (Dry Run)

```bash
# Score products without importing
curl -X POST http://localhost:3000/api/admin/commerce-engine \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}'
```

**Output**:
```json
{
  "success": true,
  "dry_run": true,
  "result": {
    "total_products": 20,
    "imported_high_priority": 5,
    "imported_low_priority": 8,
    "imported_for_bundles": 3,
    "rejected": 4,
    "total_profit_potential": 2150.50,
    "avg_score": 71,
    "products": [...]
  }
}
```

### Live Mode (Import Products)

```bash
# Score and import approved products
curl -X POST http://localhost:3000/api/admin/commerce-engine \
  -H "Content-Type: application/json" \
  -d '{"dryRun": false}'
```

### Process Specific Supplier

```bash
# Only evaluate products from one supplier
curl -X POST http://localhost:3000/api/admin/commerce-engine \
  -H "Content-Type: application/json" \
  -d '{"supplierId": "supplier_123", "dryRun": false}'
```

---

## 📊 Database Schema

Products table includes commerce engine fields:

```sql
ALTER TABLE products ADD COLUMN commerce_score INTEGER;
ALTER TABLE products ADD COLUMN commerce_decision TEXT;
ALTER TABLE products ADD COLUMN commerce_reasoning TEXT;
ALTER TABLE products ADD COLUMN commerce_last_scored TIMESTAMP;
ALTER TABLE products ADD COLUMN profitability_score INTEGER;
ALTER TABLE products ADD COLUMN demand_score INTEGER;
ALTER TABLE products ADD COLUMN competition_score INTEGER;
ALTER TABLE products ADD COLUMN supplier_quality_score INTEGER;
ALTER TABLE products ADD COLUMN strategic_fit_score INTEGER;
ALTER TABLE products ADD COLUMN profit_margin DECIMAL(5,2);
ALTER TABLE products ADD COLUMN bundle_potential BOOLEAN;
```

### Query Examples

**Get top-scoring products**:
```sql
SELECT name, commerce_score, profit_margin, commerce_decision
FROM products
WHERE commerce_decision != 'reject'
ORDER BY commerce_score DESC
LIMIT 20;
```

**Get products needing re-evaluation**:
```sql
SELECT name, commerce_score, commerce_last_scored
FROM products
WHERE commerce_decision = 'reject'
  AND commerce_last_scored < NOW() - INTERVAL '30 days'
ORDER BY commerce_last_scored ASC;
```

**Performance metrics**:
```sql
SELECT 
  commerce_decision,
  COUNT(*) as count,
  AVG(commerce_score) as avg_score,
  AVG(profit_margin) as avg_margin
FROM products
WHERE commerce_score IS NOT NULL
GROUP BY commerce_decision;
```

---

## 🔧 Configuration

### Environment Variables

```env
OPENAI_API_KEY=sk-...  # Required for AI scoring
```

### Customization

Adjust weights in `lib/autonomous/product-scoring-engine.ts`:

```typescript
const final_score = Math.round(
  (profitability_score * 0.35) +  // Adjust weight here
  (demand_score * 0.25) +
  (competition_score * 0.15) +
  (supplier_quality_score * 0.15) +
  (strategic_fit_score * 0.10)
);
```

### Scoring Thresholds

Modify import decision thresholds:

```typescript
if (finalScore >= 80) {
  importDecision = 'import_high_priority';
} else if (finalScore >= 70) {
  importDecision = 'import_low_priority';
} else if (finalScore >= 60 && strategicFit.bundle_potential) {
  importDecision = 'import_for_bundles';
} else {
  importDecision = 'reject';
}
```

---

## 🚀 Automation & Scheduling

### Daily Automated Run

Set up a cron job to run the engine daily:

```typescript
// app/api/cron/commerce-engine/route.ts
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Run commerce engine
  await fetch('http://localhost:3000/api/admin/commerce-engine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dryRun: false })
  });
  
  return new Response('OK');
}
```

### Vercel Cron Configuration

```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/commerce-engine",
    "schedule": "0 2 * * *"  // Daily at 2 AM
  }]
}
```

---

## 📈 Performance Metrics

Track these KPIs:

**Quality Metrics**:
- Average score of imported products
- Approval rate (imported / total)
- Re-evaluation rate (rejected → approved)

**Profitability Metrics**:
- Average profit margin of approved products
- Total profit potential per batch
- High-margin product count

**Efficiency Metrics**:
- Processing time per product
- API call count (for cost management)
- Batch size and frequency

---

## 🎯 Best Practices

### 1. Start with Dry Runs
Always test in dry run mode first to understand scoring patterns before going live.

### 2. Review Rejected Products
Occasionally review rejected products to ensure the engine isn't too strict.

### 3. Adjust Weights Seasonally
Increase `demand_score` weight during peak shopping seasons.

### 4. Monitor Supplier Quality
Track supplier quality scores over time to identify declining suppliers early.

### 5. Bundle Strategy
Products with 60-69 scores but high strategic fit should be bundled together.

### 6. Re-evaluate Rejected Products
Set up automated re-evaluation after 30 days (suppliers may improve).

---

## 🛠️ Troubleshooting

### Issue: All products rejected
**Cause**: Thresholds too strict or cost data incorrect  
**Fix**: Review `calculateProfitabilityScore()` and verify supplier cost data

### Issue: AI scoring fails
**Cause**: OpenAI API key invalid or rate limit hit  
**Fix**: Check `OPENAI_API_KEY` and add delays between requests

### Issue: Low profit margins
**Cause**: Price calculation not accounting for all fees  
**Fix**: Verify platform fee (5%) and Stripe fee (2.9% + $0.30) calculations

### Issue: Products not appearing in marketplace
**Cause**: `is_active` flag not set  
**Fix**: Check that approved products have `is_active = true`

---

## 🔗 Integration with Supplier System

The Commerce Engine integrates seamlessly with the Supplier Integration Engine:

```typescript
// Step 1: Supplier registers
// Step 2: Website analyzed for brand intelligence
// Step 3: Products auto-imported from website
// Step 4: Commerce Engine scores each product ← HERE
// Step 5: Approved products activated
// Step 6: AI Spirits trained on product data
// Step 7: Supplier connects Stripe for payouts
```

---

## 📚 Related Documentation

- [STRIPE_CONNECT_IMPLEMENTATION.md](./STRIPE_CONNECT_IMPLEMENTATION.md) - Payment automation
- [AUTONOMOUS_SYSTEMS.md](./AUTONOMOUS_SYSTEMS.md) - Full integration pipeline
- [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md) - System overview

---

## 🎉 Success Metrics

**Target Performance**:
- ≥70% approval rate (30% rejected)
- ≥75 average score for approved products
- ≥35% average profit margin
- ≥$50 profit potential per approved product

**Example Results**:
```
Batch of 100 products processed:
✅ 25 High Priority (score 80+)
✅ 35 Low Priority (score 70-79)
🎁 10 Bundle-Only (score 60-69)
❌ 30 Rejected (score <60)

Approval Rate: 70%
Avg Score: 73
Total Profit Potential: $4,250
Avg Margin: 38%
```

---

**🤖 The AI Commerce Engine ensures AI City remains a curated, profitable, high-quality marketplace without manual intervention.**

**Questions?** Run the engine in dry run mode and review the scoring logic!
