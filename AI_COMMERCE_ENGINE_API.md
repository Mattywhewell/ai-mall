# 🔌 AI Commerce Engine - API Reference

## 🚀 **LIVE & OPERATIONAL**

**🌐 Production URL**: https://ai-mall.vercel.app

**✅ Status**: Fully deployed on Vercel with enterprise security

---

Quick reference for all AI Commerce Engine API endpoints.

---

## Base URLs

- **Core Engine**: `/api/admin/commerce-engine`
- **Advanced Features**: `/api/admin/commerce-engine/advanced`

---

## 🎯 Core Engine APIs

### 1. Run Commerce Engine

**Endpoint**: `POST /api/admin/commerce-engine`

Score and import products from supplier feeds.

**Request Body**:
```json
{
  "supplierId": "optional-supplier-id",
  "dryRun": true
}
```

**Parameters**:
- `supplierId` (optional): Process specific supplier only
- `dryRun` (boolean): If true, score only (don't import)

**Response**:
```json
{
  "success": true,
  "result": {
    "total_products": 20,
    "imported_high_priority": 8,
    "imported_low_priority": 5,
    "imported_for_bundles": 3,
    "rejected": 4,
    "total_profit_potential": 15420.50,
    "avg_score": 73,
    "products": [
      {
        "product_title": "Smart Yoga Mat",
        "profitability_score": 85,
        "demand_score": 78,
        "competition_score": 65,
        "supplier_quality_score": 82,
        "strategic_fit_score": 90,
        "final_score": 81,
        "import_decision": "import_high_priority",
        "reasoning": "Strong 42% margin, High demand",
        "calculated_price": 129.99,
        "profit_margin": 0.42,
        "bundle_potential": true
      }
    ]
  }
}
```

---

### 2. Get Engine Statistics

**Endpoint**: `GET /api/admin/commerce-engine`

Fetch overall commerce engine stats and recent evaluations.

**Response**:
```json
{
  "success": true,
  "stats": {
    "total_evaluated": 450,
    "imported": 320,
    "rejected": 130,
    "avg_score": 71
  },
  "recent_evaluations": [...]
}
```

---

## 🚀 Advanced Feature APIs

### 3. Catalog Optimization

**Endpoint**: `GET /api/admin/commerce-engine/advanced?action=catalog-optimization`

Identify products to remove, deprioritize, or promote.

**Response**:
```json
{
  "success": true,
  "optimization": {
    "products_to_remove": ["prod_123", "prod_456"],
    "products_to_deprioritize": ["prod_789"],
    "products_to_promote": ["prod_321"],
    "reasoning": {
      "prod_123": "Low performer: 2 sales in 45 days, score 48/100"
    }
  },
  "summary": {
    "to_remove": 2,
    "to_deprioritize": 1,
    "to_promote": 1
  }
}
```

**Apply Action**: `POST /api/admin/commerce-engine/advanced`
```json
{
  "action": "apply-catalog-optimization",
  "params": {
    "products_to_remove": ["prod_123"],
    "products_to_deprioritize": ["prod_789"]
  }
}
```

---

### 4. Supplier Risk Assessment

**Endpoint**: `GET /api/admin/commerce-engine/advanced?action=supplier-risk`

Get risk assessments for all suppliers.

**Response**:
```json
{
  "success": true,
  "risk_assessments": [
    {
      "supplier_name": "Acme Wellness",
      "supplier_id": "sup_123",
      "risk_level": "medium",
      "risk_score": 45,
      "risk_factors": [
        "Slow delivery: 12 days average",
        "High return rate: 8.0%"
      ],
      "recommendations": [
        "Request faster shipping options",
        "Review product quality"
      ],
      "should_pause_imports": false
    }
  ],
  "by_risk_level": {
    "critical": [],
    "high": [],
    "medium": [...],
    "low": [...]
  },
  "summary": {
    "critical": 0,
    "high": 2,
    "medium": 5,
    "low": 8
  }
}
```

---

### 5. Negotiation Strategies

**Endpoint**: `GET /api/admin/commerce-engine/advanced?action=negotiation-strategies&supplierId=sup_123`

Generate negotiation strategy for a specific supplier.

**Parameters**:
- `supplierId` (required): Supplier ID

**Response**:
```json
{
  "success": true,
  "supplier_name": "Acme Wellness",
  "strategy": {
    "supplier_id": "sup_123",
    "leverage_points": [
      "High revenue partner: $75,000",
      "35 active products"
    ],
    "discount_potential": 12,
    "alternative_terms": [
      "Volume discounts at 50/100/200 units",
      "Exclusive partnership in exchange for 10% discount"
    ],
    "priority": "high",
    "script": "Hi [Supplier], I wanted to reach out..."
  }
}
```

---

### 6. Bundle Recommendations

**Endpoint**: `GET /api/admin/commerce-engine/advanced?action=bundle-recommendations`

AI-generated product bundle suggestions.

**Response**:
```json
{
  "success": true,
  "bundles": [
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
        }
      ],
      "bundle_price": 129.99,
      "individual_price_sum": 159.97,
      "discount_percentage": 19,
      "expected_margin": 0.48,
      "bundle_score": 96,
      "theme": "Mindfulness & meditation",
      "description": "Everything you need...",
      "seasonal": false
    }
  ],
  "summary": {
    "total_bundles": 12,
    "avg_discount": 17.5,
    "avg_margin": 0.45
  }
}
```

**Create Bundles**: `POST /api/admin/commerce-engine/advanced`
```json
{
  "action": "create-bundles",
  "params": {
    "bundles": [...]
  }
}
```

---

### 7. Digital Product Ideas

**Endpoint**: `GET /api/admin/commerce-engine/advanced?action=digital-products`

Generate digital product ideas based on physical inventory.

**Response**:
```json
{
  "success": true,
  "digital_products": [
    {
      "title": "30-Day Meditation Challenge Guide",
      "type": "guide",
      "related_physical_products": ["prod_123", "prod_456"],
      "price": 29.99,
      "expected_margin": 0.95,
      "content_outline": [
        "Week 1: Foundation",
        "Week 2: Deepening",
        "Week 3: Challenges",
        "Week 4: Integration"
      ],
      "target_audience": "Meditation beginners",
      "bundle_opportunity": true
    }
  ],
  "summary": {
    "total_ideas": 8,
    "total_revenue_potential": 239.92,
    "avg_margin": 0.95
  }
}
```

---

### 8. Weight Evolution

**Endpoint**: `GET /api/admin/commerce-engine/advanced?action=weight-evolution`

Analyze performance data and recommend scoring weight adjustments.

**Response**:
```json
{
  "success": true,
  "current_weights": {
    "profitability": 0.35,
    "demand": 0.25,
    "competition": 0.15,
    "supplier_quality": 0.15,
    "strategic_fit": 0.10
  },
  "evolved_weights": {
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
  "confidence": 0.9,
  "recommendation": "High confidence - apply new weights"
}
```

**Apply Weights**: `POST /api/admin/commerce-engine/advanced`
```json
{
  "action": "save-evolved-weights",
  "params": {
    "weights": {
      "profitability": 0.40,
      "demand": 0.30,
      ...
    }
  }
}
```

---

### 9. Quality Report

**Endpoint**: `GET /api/admin/commerce-engine/advanced?action=quality-report`

Get quality check results for recent products.

**Response**:
```json
{
  "success": true,
  "quality_checks": [
    {
      "product_id": "prod_123",
      "product_title": "Smart Yoga Mat",
      "passed": true,
      "score": 85,
      "issues": [
        {
          "severity": "info",
          "category": "Reviews",
          "message": "No reviews yet"
        }
      ],
      "recommendations": [
        "Request reviews from test customers"
      ]
    }
  ],
  "summary": {
    "total": 50,
    "passed": 42,
    "failed": 8,
    "pass_rate": "84.0%",
    "avg_score": "78.5"
  }
}
```

---

### 10. Dynamic Pricing

**Endpoint**: `POST /api/admin/commerce-engine/advanced`

Apply dynamic pricing recommendation.

**Request**:
```json
{
  "action": "apply-dynamic-pricing",
  "params": {
    "product_id": "prod_123",
    "new_price": 134.99
  }
}
```

**Response**:
```json
{
  "success": true,
  "product_id": "prod_123",
  "new_price": 134.99
}
```

---

## 🔄 Typical Workflow

### Daily Operations

```bash
# 1. Run quality checks on new products
curl http://localhost:3000/api/admin/commerce-engine/advanced?action=quality-report

# 2. Score and import new products
curl -X POST http://localhost:3000/api/admin/commerce-engine \
  -H "Content-Type: application/json" \
  -d '{"dryRun": false}'

# 3. Update pricing (optional)
curl -X POST http://localhost:3000/api/admin/commerce-engine/advanced \
  -H "Content-Type: application/json" \
  -d '{"action": "apply-dynamic-pricing", "params": {...}}'
```

### Weekly Operations

```bash
# 1. Optimize catalog
curl http://localhost:3000/api/admin/commerce-engine/advanced?action=catalog-optimization

# 2. Apply optimization
curl -X POST http://localhost:3000/api/admin/commerce-engine/advanced \
  -H "Content-Type: application/json" \
  -d '{"action": "apply-catalog-optimization", "params": {...}}'

# 3. Check supplier risk
curl http://localhost:3000/api/admin/commerce-engine/advanced?action=supplier-risk

# 4. Generate bundles
curl http://localhost:3000/api/admin/commerce-engine/advanced?action=bundle-recommendations
```

### Monthly Operations

```bash
# 1. Review weight evolution
curl http://localhost:3000/api/admin/commerce-engine/advanced?action=weight-evolution

# 2. Apply new weights (if confident)
curl -X POST http://localhost:3000/api/admin/commerce-engine/advanced \
  -H "Content-Type: application/json" \
  -d '{"action": "save-evolved-weights", "params": {...}}'

# 3. Generate digital products
curl http://localhost:3000/api/admin/commerce-engine/advanced?action=digital-products
```

---

## 🔐 Authentication

All admin APIs require authentication. Include your auth token:

```bash
curl http://localhost:3000/api/admin/commerce-engine \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ⚠️ Error Handling

All endpoints return errors in this format:

```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

**Common HTTP Status Codes**:
- `200`: Success
- `400`: Bad request (invalid parameters)
- `401`: Unauthorized
- `500`: Internal server error

---

## 📊 Rate Limits

- **Core Engine**: 10 requests/minute
- **Advanced APIs**: 30 requests/minute per action

---

## 🧪 Testing

### Test with Dry Run

```bash
# Score products without importing
curl -X POST http://localhost:3000/api/admin/commerce-engine \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}'
```

### Test Individual Features

```bash
# Test each advanced feature
for action in catalog-optimization supplier-risk bundle-recommendations quality-report weight-evolution digital-products; do
  echo "Testing: $action"
  curl "http://localhost:3000/api/admin/commerce-engine/advanced?action=$action"
  echo ""
done
```

---

## 📝 Notes

- All prices are in USD by default
- Scores are 0-100 scale
- Dates are ISO 8601 format
- IDs are UUID format
- Replace `localhost:3000` with your actual domain

---

**Need Help?** See [AI_COMMERCE_ENGINE_EXTENDED.md](./AI_COMMERCE_ENGINE_EXTENDED.md) for detailed feature documentation.
