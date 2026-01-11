# AI Commerce Engine - Extended Features

## 🚀 **LIVE & OPERATIONAL**

**🌐 Production URL**: https://ai-mall.vercel.app

**✅ Status**: Fully deployed on Vercel with enterprise security

---

This document describes the **extended features** added to the AI Commerce Engine. These features complement the core 5-pillar scoring system and expand the engine's capabilities across product intelligence, supplier management, bundling, personalization, and more.

---

## 📋 Table of Contents

1. [Catalog Optimization](#1-catalog-optimization)
2. [Demand Forecasting](#2-demand-forecasting)
3. [Dynamic Pricing Strategies](#3-dynamic-pricing-strategies)
4. [Supplier Risk Detection](#4-supplier-risk-detection)
5. [Supplier Negotiation Strategies](#5-supplier-negotiation-strategies)
6. [Bundle & Ritual Kit Generation](#6-bundle--ritual-kit-generation)
7. [Personalization Engine](#7-personalization-engine)
8. [Self-Evolving Weights](#8-self-evolving-weights)
9. [Digital Product Generation](#9-digital-product-generation)
10. [Quality Assurance System](#10-quality-assurance-system)

---

## 1. Catalog Optimization

**Purpose**: Automatically identify and manage low-performing products in your marketplace.

### Features

- **Remove Low Performers**: Products with <5 sales in 30+ days and score <60
- **Deprioritize Underperformers**: Products with score <70 and conversion <2%
- **Promote Star Products**: Products with score ≥80 and conversion >5%

### Usage

```typescript
import { optimizeCatalog } from '@/lib/autonomous/product-scoring-engine';

const result = await optimizeCatalog(products);

console.log('To Remove:', result.products_to_remove);
console.log('To Deprioritize:', result.products_to_deprioritize);
console.log('To Promote:', result.products_to_promote);
```

### Output

```json
{
  "products_to_remove": ["prod_123", "prod_456"],
  "products_to_deprioritize": ["prod_789"],
  "products_to_promote": ["prod_321"],
  "reasoning": {
    "prod_123": "Low performer: 2 sales in 45 days, score 48/100"
  }
}
```

### Automation Strategy

Run this function **weekly** as a cron job to automatically clean up your catalog.

---

## 2. Demand Forecasting

**Purpose**: Predict future demand for products to optimize inventory and purchasing decisions.

### Features

- **30-Day Forecast**: Predicts sales for next 30 days
- **Trend Detection**: Identifies rising/stable/declining trends
- **Seasonal Factors**: Flags seasonal patterns
- **Stock Recommendations**: Suggests optimal inventory levels

### Usage

```typescript
import { forecastDemand } from '@/lib/autonomous/product-scoring-engine';

const forecast = await forecastDemand({
  product_id: 'prod_123',
  title: 'Smart Yoga Mat',
  historical_sales: [10, 12, 15, 18, 20], // Last 5 periods
  supplier_cost: 30,
  category: 'wellness',
});

console.log('Forecast:', forecast.forecast_next_30_days, 'units');
console.log('Recommended Stock:', forecast.recommended_stock);
```

### Output

```json
{
  "product_id": "prod_123",
  "forecast_next_30_days": 540,
  "confidence": "high",
  "trend": "rising",
  "seasonal_factors": ["Summer wellness surge", "Back-to-school fitness"],
  "recommended_stock": 810
}
```

### Integration Points

- **Purchase Orders**: Auto-generate POs based on forecasted demand
- **Low Stock Alerts**: Trigger alerts when stock < recommended level
- **Dynamic Pricing**: Increase prices during high-demand periods

---

## 3. Dynamic Pricing Strategies

**Purpose**: Optimize product pricing based on competition, demand, and margin targets.

### Pricing Strategies

1. **Premium**: High margin, low competition → Price 15% above competitors
2. **Competitive**: Multiple competitors → Undercut by 2%
3. **Value**: Good margin → Test 5% price increase
4. **Clearance**: Low sales velocity → 15% discount

### Usage

```typescript
import { calculateDynamicPrice } from '@/lib/autonomous/product-scoring-engine';

const pricing = await calculateDynamicPrice({
  title: 'Meditation Cushion',
  supplier_cost: 20,
  current_price: 59.99,
  competitor_prices: [64.99, 69.99, 62.50],
  recent_sales_velocity: 0.3, // Sales per day
});

console.log('Recommended Price:', pricing.recommended_price);
console.log('Strategy:', pricing.strategy);
```

### Output

```json
{
  "current_price": 59.99,
  "recommended_price": 61.24,
  "strategy": "competitive",
  "expected_margin": 0.42,
  "reasoning": "Multiple competitors - competitive pricing to capture market share",
  "price_elasticity": "medium"
}
```

### Automation

- Run **daily** to adjust prices based on market conditions
- Implement A/B testing to validate price changes
- Set floor prices to maintain minimum margins

---

## 4. Supplier Risk Detection

**Purpose**: Identify risky suppliers before they cause problems.

### Risk Factors

| Factor | Weight | Threshold |
|--------|--------|-----------|
| Slow delivery | 25 pts | >10 days avg |
| High return rate | 30 pts | >10% |
| Frequent disputes | 20 pts | >5% |
| Stockouts | 15 pts | >15% |
| Poor communication | 10 pts | >48h response |
| New supplier | 15 pts | <30 days active |

### Risk Levels

- **Critical** (75+ pts): Pause all imports immediately
- **High** (50-74 pts): Weekly monitoring required
- **Medium** (25-49 pts): Monthly review
- **Low** (0-24 pts): Standard monitoring

### Usage

```typescript
import { assessSupplierRisk } from '@/lib/autonomous/product-scoring-engine';

const risk = assessSupplierRisk({
  supplier_id: 'sup_123',
  avg_delivery_days: 12,
  return_rate: 0.08,
  dispute_rate: 0.02,
  stockout_rate: 0.05,
  response_time_hours: 24,
  days_active: 90,
});

if (risk.should_pause_imports) {
  console.log('⚠️ CRITICAL: Pause imports from this supplier!');
}
```

### Output

```json
{
  "supplier_id": "sup_123",
  "risk_level": "medium",
  "risk_score": 33,
  "risk_factors": [
    "Slow delivery: 12 days average",
    "High return rate: 8.0%"
  ],
  "recommendations": [
    "Request faster shipping options or find alternative supplier",
    "Review product quality and descriptions for accuracy"
  ],
  "should_pause_imports": false
}
```

---

## 5. Supplier Negotiation Strategies

**Purpose**: Generate data-driven negotiation scripts to secure better supplier terms.

### Leverage Points

- **High Revenue**: Partner generating >$50k → 8% discount potential
- **Volume**: 20+ active products → 3% discount potential
- **Low Margins**: Avg margin <25% → 5% discount potential
- **Competition**: 3+ alternative suppliers → 4% discount potential

### Usage

```typescript
import { generateNegotiationStrategy } from '@/lib/autonomous/product-scoring-engine';

const strategy = generateNegotiationStrategy({
  supplier_id: 'sup_123',
  total_revenue_generated: 75000,
  product_count: 35,
  avg_margin: 0.22,
  competitor_count: 4,
});

console.log('Priority:', strategy.priority);
console.log('Discount Potential:', strategy.discount_potential, '%');
console.log('Script:\n', strategy.script);
```

### Output

```json
{
  "supplier_id": "sup_123",
  "leverage_points": [
    "High revenue partner: $75,000",
    "35 active products",
    "Margin pressure - need better rates to continue",
    "4 alternative suppliers available"
  ],
  "discount_potential": 15,
  "alternative_terms": [
    "Volume discounts at 50/100/200 units",
    "Exclusive partnership in exchange for 10% discount",
    "Price match guarantee with competitors"
  ],
  "priority": "high",
  "script": "Hi [Supplier], I wanted to reach out regarding our partnership..."
}
```

### Best Practices

- **Time negotiations** during high-volume periods (leverage)
- **Offer exclusivity** in exchange for better rates
- **Bundle multiple asks** (pricing + faster shipping + payment terms)

---

## 6. Bundle & Ritual Kit Generation

**Purpose**: Automatically create compelling product bundles using AI.

### Bundle Types

1. **Complementary**: Products used together (yoga mat + blocks + strap)
2. **Ritual Kits**: Products for specific practices (morning meditation kit)
3. **Seasonal**: Holiday/season-themed bundles
4. **Discovery**: Sample packs for new customers

### Bundle Scoring

- **Expected Margin**: Higher margin = higher score
- **Product Count**: More products = higher perceived value
- **Theme Coherence**: Strong theme = higher score
- **Discount Sweet Spot**: 15-20% discount optimal

### Usage

```typescript
import { generateBundles } from '@/lib/autonomous/product-scoring-engine';

const bundles = await generateBundles(products);

bundles.forEach(bundle => {
  console.log('Bundle:', bundle.bundle_name);
  console.log('Discount:', bundle.discount_percentage, '%');
  console.log('Margin:', (bundle.expected_margin * 100).toFixed(1), '%');
});
```

### Output

```json
{
  "bundle_name": "Complete Meditation Starter Kit",
  "products": [
    {
      "product_id": "prod_123",
      "product_title": "Meditation Cushion",
      "role": "anchor"
    },
    {
      "product_id": "prod_456",
      "product_title": "Singing Bowl",
      "role": "complement"
    },
    {
      "product_id": "prod_789",
      "product_title": "Incense Set",
      "role": "addon"
    }
  ],
  "bundle_price": 129.99,
  "individual_price_sum": 159.97,
  "discount_percentage": 19,
  "expected_margin": 0.48,
  "bundle_score": 126,
  "theme": "Mindfulness & meditation practice",
  "description": "Everything you need to start a daily meditation practice...",
  "seasonal": false
}
```

### Marketing Ideas

- **Offer bundles as subscriptions** (monthly ritual boxes)
- **Create limited editions** (seasonal kits)
- **Gift bundles** (curated for occasions)

---

## 7. Personalization Engine

**Purpose**: Adjust product scores based on individual customer preferences.

### Personalization Factors

- **Category Preference**: +15 boost if matches preferred category
- **Price Range**: +10 boost if within customer's typical range
- **Premium Customer**: +5 boost for high-value customers
- **Browsing History**: Match past viewing patterns
- **Goals**: Align with stated user goals (wellness, productivity, etc.)

### Usage

```typescript
import { personalizeProductScore } from '@/lib/autonomous/product-scoring-engine';

const profile = {
  user_id: 'user_123',
  preferences: {
    categories: ['wellness', 'tech'],
    price_range: { min: 30, max: 100 },
    styles: ['minimalist', 'modern'],
    values: ['eco-friendly', 'artisan'],
  },
  behavior: {
    avg_order_value: 87.50,
    purchase_frequency: 2.3, // per month
    browsing_patterns: ['evening', 'mobile'],
  },
  goals: ['stress-relief', 'better-sleep'],
};

const result = personalizeProductScore(product, 75, profile);

console.log('Base Score:', 75);
console.log('Personalized Score:', result.adjusted_score);
console.log('Boost:', result.personalization_boost);
```

### Output

```json
{
  "adjusted_score": 90,
  "personalization_boost": 15,
  "reasons": [
    "Matches preferred category",
    "Within preferred price range"
  ]
}
```

### Implementation

Store user profiles in database:

```sql
CREATE TABLE user_personalization_profiles (
  user_id UUID PRIMARY KEY,
  preferences JSONB,
  behavior JSONB,
  goals TEXT[],
  updated_at TIMESTAMP DEFAULT NOW()
);
```

Update profiles after each interaction:
- **Purchase**: Strengthen category/price preferences
- **Browse**: Track viewing patterns
- **Search**: Extract intent signals

---

## 8. Self-Evolving Weights

**Purpose**: Automatically adjust scoring pillar weights based on actual performance data.

### How It Works

1. **Collect Performance Data**: Track which products sell best
2. **Calculate Correlations**: Which pillar scores correlate with sales?
3. **Adjust Weights**: Increase weight for high-correlation pillars
4. **Normalize**: Ensure weights sum to 100%

### Default Weights

```
Profitability: 35%
Demand: 25%
Competition: 15%
Supplier Quality: 15%
Strategic Fit: 10%
```

### Usage

```typescript
import { evolveWeights } from '@/lib/autonomous/product-scoring-engine';

const performanceData = [
  {
    product_id: 'prod_123',
    profitability_score: 85,
    demand_score: 70,
    competition_score: 60,
    supplier_quality_score: 80,
    strategic_fit_score: 90,
    actual_sales: 45,
    actual_margin: 0.42,
    days_listed: 30,
  },
  // ... more products
];

const result = evolveWeights(currentWeights, performanceData);

if (result.confidence > 0.7) {
  console.log('High confidence - apply new weights');
  console.log('New Weights:', result.new_weights);
  // Save to database for future scoring
}
```

### Output

```json
{
  "new_weights": {
    "profitability": 0.40,
    "demand": 0.30,
    "competition": 0.12,
    "supplier_quality": 0.10,
    "strategic_fit": 0.08
  },
  "improvements": [
    "demand shows strongest correlation with sales (0.78)",
    "Profitability weight increased to 40.0%"
  ],
  "confidence": 0.9
}
```

### Automation Strategy

- Run **monthly** with minimum 50 products of data
- Compare old vs new weights before applying
- A/B test weight changes on subset of products first
- Store weight history for analysis

---

## 9. Digital Product Generation

**Purpose**: Create zero-cost, high-margin digital products that complement physical inventory.

### Digital Product Types

1. **Guides**: How-to guides, eBooks, tutorials
2. **Templates**: Worksheets, planners, checklists
3. **Rituals**: Step-by-step practice guides
4. **Courses**: Video/text lessons
5. **Checklists**: Quick reference materials

### Margin Advantage

- **Physical Product**: 30-40% margin (after costs, fees, shipping)
- **Digital Product**: 95% margin (no inventory, shipping, or returns)

### Usage

```typescript
import { generateDigitalProducts } from '@/lib/autonomous/product-scoring-engine';

const digitalIdeas = await generateDigitalProducts(physicalProducts);

digitalIdeas.forEach(idea => {
  console.log('Digital Product:', idea.title);
  console.log('Type:', idea.type);
  console.log('Price:', idea.price);
  console.log('Margin:', (idea.expected_margin * 100).toFixed(0), '%');
});
```

### Output

```json
{
  "title": "30-Day Meditation Challenge Guide",
  "type": "guide",
  "related_physical_products": ["prod_123", "prod_456"],
  "price": 29.99,
  "expected_margin": 0.95,
  "content_outline": [
    "Week 1: Foundation (Days 1-7)",
    "Week 2: Deepening (Days 8-14)",
    "Week 3: Challenges (Days 15-21)",
    "Week 4: Integration (Days 22-30)",
    "Bonus: Advanced Techniques"
  ],
  "target_audience": "Meditation beginners seeking structure",
  "bundle_opportunity": true
}
```

### Implementation Strategy

1. **Generate Ideas**: Use AI to create concepts
2. **Content Creation**: 
   - Use GPT-4 to write guide content
   - Use Midjourney/DALL-E for visuals
   - Use Canva templates for layout
3. **Delivery**: 
   - PDF download after purchase
   - Email with access link
   - Member portal for courses
4. **Bundling**:
   - Offer digital + physical bundles
   - "Complete kit" = physical products + digital guide
   - 10-15% bundle discount

### Example Bundles

**Physical + Digital Bundle**:
- Meditation Cushion ($59) + 30-Day Challenge Guide ($30) = $89 → **$75.99** (15% off)
- Yoga Mat ($79) + Video Course ($49) = $128 → **$108.99** (15% off)

---

## 10. Quality Assurance System

**Purpose**: Automated quality checks before products go live.

### Quality Checks

| Check | Severity | Points Deducted |
|-------|----------|----------------|
| Missing/short title (<10 chars) | Critical | -30 |
| Invalid pricing | Critical | -25 |
| No images | Critical | -20 |
| Missing/short description (<50 chars) | Warning | -10 |
| Few images (<3) | Warning | -5 |
| No category | Warning | -10 |
| No reviews | Info | 0 |
| Low stock (<10) | Info | 0 |

### Pass/Fail Criteria

- **Pass**: No critical issues (score can be <100)
- **Fail**: Any critical issue present

### Usage

```typescript
import { performQualityCheck } from '@/lib/autonomous/product-scoring-engine';

const qc = performQualityCheck(product);

if (!qc.passed) {
  console.log('❌ Quality Check Failed');
  qc.issues.forEach(issue => {
    if (issue.severity === 'critical') {
      console.log('CRITICAL:', issue.message);
    }
  });
} else {
  console.log('✅ Quality Check Passed');
  console.log('Score:', qc.score, '/100');
}
```

### Output

```json
{
  "product_id": "prod_123",
  "passed": false,
  "score": 55,
  "issues": [
    {
      "severity": "critical",
      "category": "Images",
      "message": "No product images"
    },
    {
      "severity": "warning",
      "category": "Description",
      "message": "Description missing or too short"
    },
    {
      "severity": "info",
      "category": "Reviews",
      "message": "No reviews yet"
    }
  ],
  "recommendations": [
    "Add product images (minimum 1, recommended 3+)",
    "Add detailed product description (minimum 50 characters)"
  ]
}
```

### Workflow Integration

```typescript
// Before importing product
const qc = performQualityCheck(product);

if (qc.passed) {
  // Proceed with scoring
  const score = await scoreProduct(product);
  
  if (score.import_decision !== 'reject') {
    // Import to marketplace
    await importProduct(product, score);
  }
} else {
  // Send to supplier for fixes
  await requestProductImprovement(product.supplier_id, qc);
}
```

---

## 🔄 Complete Workflow Example

Here's how all features work together:

```typescript
// 1. Quality Check
const qc = performQualityCheck(product);
if (!qc.passed) {
  console.log('Quality issues:', qc.issues);
  return; // Don't proceed
}

// 2. Score Product
const score = await scoreProduct(product);

// 3. Risk Check Supplier
const supplierRisk = assessSupplierRisk(supplier);
if (supplierRisk.should_pause_imports) {
  console.log('⚠️ Supplier risk too high');
  return;
}

// 4. Make Import Decision
if (score.import_decision === 'import_high_priority') {
  // 5. Calculate Dynamic Price
  const pricing = await calculateDynamicPrice(product);
  
  // 6. Import to marketplace
  await importProduct({
    ...product,
    sale_price: pricing.recommended_price,
    is_active: true,
  });
  
  // 7. Check for bundle opportunities
  if (score.bundle_potential) {
    const bundles = await generateBundles([product, ...relatedProducts]);
    await createBundles(bundles);
  }
  
  // 8. Generate complementary digital products
  const digitalProducts = await generateDigitalProducts([product]);
  await createDigitalProducts(digitalProducts);
}

// 9. Forecast demand & set stock alerts
const forecast = await forecastDemand(product);
await setStockAlert(product.product_id, forecast.recommended_stock);

// 10. Monthly: Optimize catalog
const catalogOptimization = await optimizeCatalog(allProducts);
await archiveProducts(catalogOptimization.products_to_remove);

// 11. Monthly: Evolve weights based on performance
const performanceData = await getPerformanceData();
const newWeights = evolveWeights(currentWeights, performanceData);
if (newWeights.confidence > 0.8) {
  await updateScoringWeights(newWeights.new_weights);
}
```

---

## 📊 Performance Metrics

Track these KPIs to measure system effectiveness:

### Product Success Metrics
- **Import Approval Rate**: % of products scoring ≥60
- **High-Priority Rate**: % scoring ≥80
- **Rejection Rate**: % scoring <60
- **Avg Product Score**: Mean score across all products

### Financial Metrics
- **Avg Profit Margin**: Actual margins achieved
- **Revenue per Product**: Total revenue / product count
- **Bundle Conversion Rate**: % of customers buying bundles
- **Digital Product Revenue**: Pure profit from digital products

### Supplier Metrics
- **Supplier Risk Distribution**: % in each risk tier
- **Avg Delivery Time**: Days from order to delivery
- **Return Rate**: % of orders returned
- **Negotiation Success Rate**: % achieving discount targets

### Optimization Metrics
- **Catalog Churn**: % products removed monthly
- **Star Product Rate**: % products promoted
- **Forecast Accuracy**: Actual sales vs forecasted (MAPE)
- **Dynamic Pricing Lift**: Revenue increase from price optimization

---

## 🚀 Deployment Checklist

- [ ] Apply database migrations for new fields
- [ ] Set up cron jobs for automation:
  - [ ] Daily: Dynamic pricing updates
  - [ ] Weekly: Catalog optimization
  - [ ] Monthly: Weight evolution
- [ ] Configure AI API keys (OpenAI)
- [ ] Set business rules thresholds
- [ ] Create admin dashboard for monitoring
- [ ] Train team on negotiation strategies
- [ ] Build digital product creation workflow
- [ ] Set up quality check notifications

---

## 🎯 Next Steps

1. **Test Each Feature**: Start with quality checks, then scoring, then advanced features
2. **Monitor Performance**: Track KPIs for 30 days
3. **Adjust Thresholds**: Fine-tune based on your marketplace
4. **Automate Gradually**: Start manual, then automate one feature at a time
5. **Scale Up**: Once proven, process all supplier feeds automatically

---

**Built with ❤️ for AI City Marketplace**
*Empowering autonomous commerce through intelligent automation*
