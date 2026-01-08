/**
 * AI COMMERCE ENGINE - Product Scoring System
 * 
 * Automated marketplace product evaluation and import decision engine.
 * Scores products on 5 pillars: Profitability, Demand, Competition, Supplier Quality, Strategic Fit
 * 
 * Score Thresholds:
 * - ≥80: Import (high priority)
 * - 70-79: Import (low priority)
 * - 60-69: Import only if needed for bundles
 * - <60: Reject
 */

import { getOpenAI } from '../openai';

const openai = {
  chat: { completions: { create: (...args: any[]) => getOpenAI().chat.completions.create(...args) } },
  embeddings: { create: (...args: any[]) => getOpenAI().embeddings.create(...args) },
};

// ==================== INTERFACES ====================

export interface ProductData {
  title: string;
  description?: string;
  supplier_cost: number;
  suggested_price?: number;
  supplier_id: string;
  supplier_name: string;
  category?: string;
  images?: string[];
  reviews?: {
    rating: number;
    count: number;
  };
  stock_quantity?: number;
  shipping_cost?: number;
  sku?: string;
  attributes?: Record<string, any>;
}

export interface ProductScore {
  product_title: string;
  profitability_score: number;
  demand_score: number;
  competition_score: number;
  supplier_quality_score: number;
  strategic_fit_score: number;
  final_score: number;
  import_decision: 'import_high_priority' | 'import_low_priority' | 'import_for_bundles' | 'reject';
  reasoning: string;
  calculated_price?: number;
  profit_margin?: number;
  bundle_potential?: boolean;
}

export interface CommerceEngineResult {
  total_products: number;
  imported_high_priority: number;
  imported_low_priority: number;
  imported_for_bundles: number;
  rejected: number;
  total_profit_potential: number;
  avg_score: number;
  products: ProductScore[];
}

// ==================== SCORING PILLARS ====================

/**
 * PILLAR 1: PROFITABILITY (35% weight)
 * Evaluates profit margin and absolute profit
 */
function calculateProfitabilityScore(product: ProductData): {
  score: number;
  margin: number;
  profit: number;
  suggested_price: number;
} {
  const supplierCost = product.supplier_cost || 0;
  const shippingCost = product.shipping_cost || 0;
  
  // Platform fees (5% platform fee + 2.9% + $0.30 Stripe fee)
  const platformFeeRate = 0.05;
  const stripeFeeRate = 0.029;
  const stripeFeeFixed = 0.30;
  
  // Calculate optimal sale price (3x cost is target)
  let salePrice = product.suggested_price || (supplierCost * 3);
  if (salePrice < supplierCost * 2) {
    salePrice = supplierCost * 2.5; // Minimum 2.5x markup
  }
  
  // Calculate all fees
  const platformFee = salePrice * platformFeeRate;
  const stripeFee = (salePrice * stripeFeeRate) + stripeFeeFixed;
  const totalFees = platformFee + stripeFee;
  
  // Calculate profit
  const profit = salePrice - supplierCost - shippingCost - totalFees;
  const margin = profit / salePrice;
  
  // Score based on margin
  let score = 0;
  if (margin >= 0.40) score = 100;
  else if (margin >= 0.35) score = 90;
  else if (margin >= 0.30) score = 80;
  else if (margin >= 0.25) score = 70;
  else if (margin >= 0.20) score = 60;
  else if (margin >= 0.15) score = 50;
  else if (margin >= 0.10) score = 40;
  else if (margin >= 0.05) score = 20;
  else score = 0;
  
  // Bonus for high absolute profit
  if (profit > 50) score = Math.min(100, score + 10);
  else if (profit > 30) score = Math.min(100, score + 5);
  
  return {
    score,
    margin: Math.round(margin * 100) / 100,
    profit: Math.round(profit * 100) / 100,
    suggested_price: Math.round(salePrice * 100) / 100,
  };
}

/**
 * PILLAR 2: DEMAND (25% weight)
 * Evaluates market demand using AI analysis
 */
async function calculateDemandScore(product: ProductData): Promise<{
  score: number;
  signals: string[];
}> {
  try {
    const prompt = `Analyze market demand for this product:

Product: ${product.title}
Category: ${product.category || 'Unknown'}
Description: ${product.description?.substring(0, 200) || 'N/A'}
Reviews: ${product.reviews?.count || 0} reviews, ${product.reviews?.rating || 0}/5 rating

Rate the demand on these factors:
1. Search volume (High/Medium/Low)
2. Trend direction (Rising/Stable/Declining)
3. Seasonality (Year-round/Seasonal)
4. Social buzz (High/Medium/Low)
5. Purchase intent (High/Medium/Low)

Return a JSON object:
{
  "demand_level": "high" | "medium" | "low",
  "score": <0-100>,
  "signals": ["signal1", "signal2", "signal3"],
  "reasoning": "brief explanation"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 300,
    });

    const content = response.choices[0].message.content || '{}';
    const analysis = JSON.parse(content.replace(/```json\n?|\n?```/g, ''));
    
    return {
      score: analysis.score || 50,
      signals: analysis.signals || [],
    };
  } catch (error) {
    console.error('Demand analysis error:', error);
    // Default: moderate demand if AI fails
    return {
      score: 50,
      signals: ['AI analysis unavailable'],
    };
  }
}

/**
 * PILLAR 3: COMPETITION (15% weight)
 * Evaluates competitive landscape (inverted scoring - low competition = high score)
 */
async function calculateCompetitionScore(product: ProductData): Promise<{
  score: number;
  level: string;
}> {
  try {
    const prompt = `Analyze competition for this product:

Product: ${product.title}
Category: ${product.category || 'Unknown'}
Price Point: $${product.suggested_price || product.supplier_cost * 2.5}

Evaluate:
1. Number of competing sellers (Many/Some/Few)
2. Price war intensity (High/Medium/Low)
3. Brand dominance (Monopoly/Competitive/Fragmented)
4. Market saturation (Saturated/Moderate/Open)

Return a JSON object:
{
  "competition_level": "high" | "medium" | "low",
  "score": <0-100>,
  "reasoning": "brief explanation"
}

Note: Low competition = high score (inverted)`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 200,
    });

    const content = response.choices[0].message.content || '{}';
    const analysis = JSON.parse(content.replace(/```json\n?|\n?```/g, ''));
    
    return {
      score: analysis.score || 60,
      level: analysis.competition_level || 'medium',
    };
  } catch (error) {
    console.error('Competition analysis error:', error);
    return {
      score: 60,
      level: 'medium',
    };
  }
}

/**
 * PILLAR 4: SUPPLIER QUALITY (15% weight)
 * Evaluates supplier reliability and track record
 */
function calculateSupplierQualityScore(product: ProductData): {
  score: number;
  factors: string[];
} {
  let score = 50; // Start at neutral
  const factors: string[] = [];
  
  // Reviews quality
  if (product.reviews) {
    const { rating, count } = product.reviews;
    if (rating >= 4.5 && count >= 100) {
      score += 30;
      factors.push('Excellent reviews (4.5+, 100+)');
    } else if (rating >= 4.0 && count >= 50) {
      score += 20;
      factors.push('Good reviews (4.0+)');
    } else if (rating >= 3.5 && count >= 20) {
      score += 10;
      factors.push('Mixed reviews (3.5+)');
    } else if (rating < 3.5) {
      score -= 20;
      factors.push('Poor reviews (<3.5)');
    }
  }
  
  // Stock availability
  if (product.stock_quantity) {
    if (product.stock_quantity >= 100) {
      score += 15;
      factors.push('High stock (100+)');
    } else if (product.stock_quantity >= 50) {
      score += 10;
      factors.push('Good stock (50+)');
    } else if (product.stock_quantity >= 20) {
      score += 5;
      factors.push('Moderate stock (20+)');
    } else {
      score -= 10;
      factors.push('Low stock (<20)');
    }
  }
  
  // SKU (indicates organized supplier)
  if (product.sku) {
    score += 5;
    factors.push('SKU provided');
  }
  
  // Images (indicates quality listing)
  if (product.images && product.images.length >= 3) {
    score += 5;
    factors.push(`${product.images.length} images`);
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    factors,
  };
}

/**
 * PILLAR 5: STRATEGIC FIT (10% weight)
 * Evaluates alignment with AI City brand and marketplace strategy
 */
async function calculateStrategicFitScore(product: ProductData): Promise<{
  score: number;
  fit_reasons: string[];
  bundle_potential: boolean;
}> {
  try {
    const prompt = `Evaluate strategic fit for AI City marketplace:

Product: ${product.title}
Category: ${product.category || 'Unknown'}
Description: ${product.description?.substring(0, 200) || 'N/A'}

AI City is a mystical, high-aesthetic marketplace organized by Halls (Innovation, Wellness, Craft, Motion, Light), Streets, and Districts. We focus on:
- Tech gadgets & innovation
- Wellness & self-care
- Artisan crafts & handmade goods
- Unique experiences & storytelling
- Bundle/ritual kit potential

Evaluate:
1. Category alignment (Strong/Moderate/Weak)
2. Aesthetic alignment (Premium/Standard/Low-end)
3. Storytelling potential (High/Medium/Low)
4. Bundle potential (Yes/No)

Return JSON:
{
  "fit_level": "strong" | "moderate" | "weak",
  "score": <0-100>,
  "fit_reasons": ["reason1", "reason2"],
  "bundle_potential": true | false,
  "suggested_hall": "Innovation Hall" | "Wellness Garden" | "Craft Sanctuary" | "Motion Plaza" | "Light Pavilion"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 300,
    });

    const content = response.choices[0].message.content || '{}';
    const analysis = JSON.parse(content.replace(/```json\n?|\n?```/g, ''));
    
    return {
      score: analysis.score || 50,
      fit_reasons: analysis.fit_reasons || [],
      bundle_potential: analysis.bundle_potential || false,
    };
  } catch (error) {
    console.error('Strategic fit analysis error:', error);
    return {
      score: 50,
      fit_reasons: ['Default evaluation'],
      bundle_potential: false,
    };
  }
}

// ==================== MAIN SCORING ENGINE ====================

/**
 * Score a single product across all 5 pillars
 */
export async function scoreProduct(product: ProductData): Promise<ProductScore> {
  console.log(`\n🔍 Scoring: ${product.title}`);
  
  // PILLAR 1: Profitability (35% weight)
  const profitability = calculateProfitabilityScore(product);
  console.log(`  💰 Profitability: ${profitability.score}/100 (${profitability.margin * 100}% margin)`);
  
  // PILLAR 2: Demand (25% weight)
  const demand = await calculateDemandScore(product);
  console.log(`  📈 Demand: ${demand.score}/100`);
  
  // PILLAR 3: Competition (15% weight)
  const competition = await calculateCompetitionScore(product);
  console.log(`  🏆 Competition: ${competition.score}/100 (${competition.level})`);
  
  // PILLAR 4: Supplier Quality (15% weight)
  const supplierQuality = calculateSupplierQualityScore(product);
  console.log(`  ✅ Supplier Quality: ${supplierQuality.score}/100`);
  
  // PILLAR 5: Strategic Fit (10% weight)
  const strategicFit = await calculateStrategicFitScore(product);
  console.log(`  🎯 Strategic Fit: ${strategicFit.score}/100`);
  
  // Calculate weighted final score
  const finalScore = Math.round(
    (profitability.score * 0.35) +
    (demand.score * 0.25) +
    (competition.score * 0.15) +
    (supplierQuality.score * 0.15) +
    (strategicFit.score * 0.10)
  );
  
  // Make import decision
  let importDecision: ProductScore['import_decision'];
  if (finalScore >= 80) {
    importDecision = 'import_high_priority';
  } else if (finalScore >= 70) {
    importDecision = 'import_low_priority';
  } else if (finalScore >= 60 && strategicFit.bundle_potential) {
    importDecision = 'import_for_bundles';
  } else {
    importDecision = 'reject';
  }
  
  // Generate reasoning
  const reasoning = generateReasoning(
    finalScore,
    profitability,
    demand,
    competition,
    supplierQuality,
    strategicFit
  );
  
  console.log(`  🎯 Final Score: ${finalScore}/100 → ${importDecision.toUpperCase()}`);
  
  return {
    product_title: product.title,
    profitability_score: profitability.score,
    demand_score: demand.score,
    competition_score: competition.score,
    supplier_quality_score: supplierQuality.score,
    strategic_fit_score: strategicFit.score,
    final_score: finalScore,
    import_decision: importDecision,
    reasoning,
    calculated_price: profitability.suggested_price,
    profit_margin: profitability.margin,
    bundle_potential: strategicFit.bundle_potential,
  };
}

/**
 * Process entire supplier product feed
 */
export async function processSupplierFeed(
  products: ProductData[]
): Promise<CommerceEngineResult> {
  console.log(`\n🚀 AI COMMERCE ENGINE - Processing ${products.length} products\n`);
  console.log('='.repeat(80));
  
  const scoredProducts: ProductScore[] = [];
  let totalProfitPotential = 0;
  
  for (const product of products) {
    try {
      const score = await scoreProduct(product);
      scoredProducts.push(score);
      
      // Calculate profit potential for imported products
      if (score.import_decision !== 'reject' && score.calculated_price) {
        const profit = score.calculated_price * (score.profit_margin || 0);
        totalProfitPotential += profit;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error scoring ${product.title}:`, error);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  
  // Calculate summary statistics
  const imported_high_priority = scoredProducts.filter(p => p.import_decision === 'import_high_priority').length;
  const imported_low_priority = scoredProducts.filter(p => p.import_decision === 'import_low_priority').length;
  const imported_for_bundles = scoredProducts.filter(p => p.import_decision === 'import_for_bundles').length;
  const rejected = scoredProducts.filter(p => p.import_decision === 'reject').length;
  const avg_score = Math.round(
    scoredProducts.reduce((sum, p) => sum + p.final_score, 0) / scoredProducts.length
  );
  
  const result: CommerceEngineResult = {
    total_products: products.length,
    imported_high_priority,
    imported_low_priority,
    imported_for_bundles,
    rejected,
    total_profit_potential: Math.round(totalProfitPotential * 100) / 100,
    avg_score,
    products: scoredProducts,
  };
  
  // Print summary
  console.log('\n📊 PROCESSING SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Products Evaluated: ${result.total_products}`);
  console.log(`✅ Import (High Priority): ${imported_high_priority}`);
  console.log(`✅ Import (Low Priority): ${imported_low_priority}`);
  console.log(`🎁 Import (For Bundles): ${imported_for_bundles}`);
  console.log(`❌ Rejected: ${rejected}`);
  console.log(`💰 Total Profit Potential: $${totalProfitPotential.toLocaleString()}`);
  console.log(`📈 Average Score: ${avg_score}/100`);
  console.log('='.repeat(80) + '\n');
  
  return result;
}

// ==================== HELPER FUNCTIONS ====================

function generateReasoning(
  finalScore: number,
  profitability: any,
  demand: any,
  competition: any,
  supplierQuality: any,
  strategicFit: any
): string {
  const reasons: string[] = [];
  
  // Profitability
  if (profitability.score >= 80) {
    reasons.push(`Strong ${profitability.margin * 100}% margin`);
  } else if (profitability.score < 40) {
    reasons.push(`Low margin (${profitability.margin * 100}%)`);
  }
  
  // Demand
  if (demand.score >= 80) {
    reasons.push('High demand');
  } else if (demand.score < 40) {
    reasons.push('Low demand');
  }
  
  // Competition
  if (competition.score >= 80) {
    reasons.push('Low competition');
  } else if (competition.score < 40) {
    reasons.push('High competition');
  }
  
  // Supplier Quality
  if (supplierQuality.score >= 80) {
    reasons.push('Reliable supplier');
  } else if (supplierQuality.score < 40) {
    reasons.push('Supplier concerns');
  }
  
  // Strategic Fit
  if (strategicFit.score >= 80) {
    reasons.push('Perfect brand fit');
  } else if (strategicFit.bundle_potential) {
    reasons.push('Bundle potential');
  }
  
  return reasons.join(', ') || 'Moderate scores across all pillars';
}

/**
 * Quick score calculation (for display purposes)
 */
export function quickScore(product: ProductData): number {
  const profitability = calculateProfitabilityScore(product);
  const supplierQuality = calculateSupplierQualityScore(product);
  
  // Quick estimate without AI calls
  return Math.round(
    (profitability.score * 0.35) +
    (60 * 0.25) + // Assume moderate demand
    (60 * 0.15) + // Assume moderate competition
    (supplierQuality.score * 0.15) +
    (60 * 0.10) // Assume moderate fit
  );
}

// ==================== EXTENDED FEATURES ====================

/**
 * FEATURE 1: CATALOG OPTIMIZATION
 * Identify and manage low-performing products
 */

export interface CatalogOptimizationResult {
  products_to_remove: string[];
  products_to_deprioritize: string[];
  products_to_promote: string[];
  reasoning: Record<string, string>;
}

export async function optimizeCatalog(
  products: Array<ProductData & { product_id: string; sales_count?: number; view_count?: number; days_listed?: number }>
): Promise<CatalogOptimizationResult> {
  const toRemove: string[] = [];
  const toDeprioritize: string[] = [];
  const toPromote: string[] = [];
  const reasoning: Record<string, string> = {};

  for (const product of products) {
    const score = quickScore(product);
    const daysListed = product.days_listed || 0;
    const salesCount = product.sales_count || 0;
    const viewCount = product.view_count || 0;
    const conversionRate = viewCount > 0 ? salesCount / viewCount : 0;

    // Remove: Listed >30 days, <5 sales, score <60
    if (daysListed > 30 && salesCount < 5 && score < 60) {
      toRemove.push(product.product_id);
      reasoning[product.product_id] = `Low performer: ${salesCount} sales in ${daysListed} days, score ${score}/100`;
    }
    // Deprioritize: Score <70, conversion <2%
    else if (score < 70 && conversionRate < 0.02) {
      toDeprioritize.push(product.product_id);
      reasoning[product.product_id] = `Underperforming: ${(conversionRate * 100).toFixed(1)}% conversion, score ${score}/100`;
    }
    // Promote: Score ≥80, conversion >5%
    else if (score >= 80 && conversionRate > 0.05) {
      toPromote.push(product.product_id);
      reasoning[product.product_id] = `Star product: ${(conversionRate * 100).toFixed(1)}% conversion, score ${score}/100`;
    }
  }

  return {
    products_to_remove: toRemove,
    products_to_deprioritize: toDeprioritize,
    products_to_promote: toPromote,
    reasoning,
  };
}

/**
 * FEATURE 2: DEMAND FORECASTING
 * Predict future demand trends
 */

export interface DemandForecast {
  product_id: string;
  forecast_next_30_days: number;
  confidence: 'high' | 'medium' | 'low';
  trend: 'rising' | 'stable' | 'declining';
  seasonal_factors: string[];
  recommended_stock: number;
}

export async function forecastDemand(
  product: ProductData & { product_id: string; historical_sales?: number[] }
): Promise<DemandForecast> {
  try {
    const historicalSales = product.historical_sales || [];
    const avgSales = historicalSales.length > 0
      ? historicalSales.reduce((a, b) => a + b, 0) / historicalSales.length
      : 0;

    const prompt = `Forecast demand for this product:

Product: ${product.title}
Category: ${product.category || 'Unknown'}
Historical Sales (last ${historicalSales.length} periods): ${historicalSales.join(', ')}
Average Sales: ${avgSales.toFixed(1)}

Consider:
1. Historical trend (rising/stable/declining)
2. Seasonal patterns
3. Market conditions
4. Category trends

Return JSON:
{
  "forecast_next_30_days": <number>,
  "confidence": "high" | "medium" | "low",
  "trend": "rising" | "stable" | "declining",
  "seasonal_factors": ["factor1", "factor2"],
  "recommended_stock": <number>
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 300,
    });

    const content = response.choices[0].message.content || '{}';
    const forecast = JSON.parse(content.replace(/```json\n?|\n?```/g, ''));

    return {
      product_id: product.product_id || '',
      forecast_next_30_days: forecast.forecast_next_30_days || avgSales * 30,
      confidence: forecast.confidence || 'medium',
      trend: forecast.trend || 'stable',
      seasonal_factors: forecast.seasonal_factors || [],
      recommended_stock: forecast.recommended_stock || Math.ceil(avgSales * 45), // 45-day buffer
    };
  } catch (error) {
    console.error('Demand forecast error:', error);
    const historicalSales = product.historical_sales || [];
    const avgSales = historicalSales.length > 0
      ? historicalSales.reduce((a, b) => a + b, 0) / historicalSales.length
      : 0;
    return {
      product_id: product.product_id || '',
      forecast_next_30_days: avgSales * 30,
      confidence: 'low',
      trend: 'stable',
      seasonal_factors: [],
      recommended_stock: Math.ceil(avgSales * 30),
    };
  }
}

/**
 * FEATURE 3: DYNAMIC PRICING STRATEGIES
 * Optimize pricing based on competition, demand, and margin targets
 */

export interface DynamicPricingRecommendation {
  current_price: number;
  recommended_price: number;
  strategy: 'premium' | 'competitive' | 'value' | 'clearance';
  expected_margin: number;
  reasoning: string;
  price_elasticity: 'high' | 'medium' | 'low';
}

export async function calculateDynamicPrice(
  product: ProductData & {
    current_price?: number;
    competitor_prices?: number[];
    recent_sales_velocity?: number;
  }
): Promise<DynamicPricingRecommendation> {
  const profitability = calculateProfitabilityScore(product);
  const currentPrice = product.current_price || profitability.suggested_price;
  const competitorPrices = product.competitor_prices || [];
  const avgCompetitorPrice = competitorPrices.length > 0
    ? competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length
    : currentPrice;

  let recommendedPrice = currentPrice;
  let strategy: DynamicPricingRecommendation['strategy'] = 'competitive';
  let reasoning = '';

  // Strategy 1: Premium (high quality, low competition, unique)
  if (profitability.margin > 0.40 && competitorPrices.length < 3) {
    recommendedPrice = Math.max(currentPrice, avgCompetitorPrice * 1.15);
    strategy = 'premium';
    reasoning = 'High margin product with low competition - premium pricing justified';
  }
  // Strategy 2: Competitive (match market)
  else if (competitorPrices.length >= 3) {
    const competitorMedian = competitorPrices.sort((a, b) => a - b)[Math.floor(competitorPrices.length / 2)];
    recommendedPrice = competitorMedian * 0.98; // Slightly undercut
    strategy = 'competitive';
    reasoning = 'Multiple competitors - competitive pricing to capture market share';
  }
  // Strategy 3: Value (maximize margin while staying attractive)
  else if (profitability.margin >= 0.30 && profitability.margin < 0.40) {
    recommendedPrice = currentPrice * 1.05; // 5% increase test
    strategy = 'value';
    reasoning = 'Good margin with room for optimization - test 5% increase';
  }
  // Strategy 4: Clearance (low sales velocity)
  else if ((product.recent_sales_velocity || 0) < 0.5) {
    recommendedPrice = currentPrice * 0.85; // 15% discount
    strategy = 'clearance';
    reasoning = 'Low sales velocity - discount to move inventory';
  }

  const expectedMargin = (recommendedPrice - product.supplier_cost - (product.shipping_cost || 0)) / recommendedPrice;

  return {
    current_price: currentPrice,
    recommended_price: Math.round(recommendedPrice * 100) / 100,
    strategy,
    expected_margin: Math.round(expectedMargin * 100) / 100,
    reasoning,
    price_elasticity: competitorPrices.length > 5 ? 'high' : competitorPrices.length > 2 ? 'medium' : 'low',
  };
}

/**
 * FEATURE 4: SUPPLIER RISK DETECTION
 * Identify and flag risky suppliers
 */

export interface SupplierRiskAssessment {
  supplier_id: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_score: number; // 0-100 (higher = more risk)
  risk_factors: string[];
  recommendations: string[];
  should_pause_imports: boolean;
}

export function assessSupplierRisk(supplier: {
  supplier_id: string;
  avg_delivery_days?: number;
  return_rate?: number;
  dispute_rate?: number;
  stockout_rate?: number;
  response_time_hours?: number;
  quality_score?: number;
  days_active?: number;
}): SupplierRiskAssessment {
  let riskScore = 0;
  const riskFactors: string[] = [];
  const recommendations: string[] = [];

  // Delivery delays
  if ((supplier.avg_delivery_days || 0) > 10) {
    riskScore += 25;
    riskFactors.push(`Slow delivery: ${supplier.avg_delivery_days} days average`);
    recommendations.push('Request faster shipping options or find alternative supplier');
  }

  // High return rate
  if ((supplier.return_rate || 0) > 0.10) {
    riskScore += 30;
    riskFactors.push(`High return rate: ${((supplier.return_rate || 0) * 100).toFixed(1)}%`);
    recommendations.push('Review product quality and descriptions for accuracy');
  }

  // Disputes
  if ((supplier.dispute_rate || 0) > 0.05) {
    riskScore += 20;
    riskFactors.push(`Frequent disputes: ${((supplier.dispute_rate || 0) * 100).toFixed(1)}%`);
    recommendations.push('Investigate dispute patterns and consider probation');
  }

  // Stock issues
  if ((supplier.stockout_rate || 0) > 0.15) {
    riskScore += 15;
    riskFactors.push(`Stockouts: ${((supplier.stockout_rate || 0) * 100).toFixed(1)}% of orders`);
    recommendations.push('Implement stock verification before listing');
  }

  // Poor communication
  if ((supplier.response_time_hours || 0) > 48) {
    riskScore += 10;
    riskFactors.push(`Slow response: ${supplier.response_time_hours}+ hours`);
    recommendations.push('Set response time SLAs');
  }

  // New/untested supplier
  if ((supplier.days_active || 0) < 30) {
    riskScore += 15;
    riskFactors.push('New supplier (<30 days)');
    recommendations.push('Start with limited product imports and monitor closely');
  }

  let riskLevel: SupplierRiskAssessment['risk_level'];
  if (riskScore >= 75) riskLevel = 'critical';
  else if (riskScore >= 50) riskLevel = 'high';
  else if (riskScore >= 25) riskLevel = 'medium';
  else riskLevel = 'low';

  return {
    supplier_id: supplier.supplier_id,
    risk_level: riskLevel,
    risk_score: riskScore,
    risk_factors: riskFactors,
    recommendations: recommendations,
    should_pause_imports: riskScore >= 75,
  };
}

/**
 * FEATURE 5: SUPPLIER NEGOTIATION STRATEGIES
 * Generate negotiation recommendations
 */

export interface NegotiationStrategy {
  supplier_id: string;
  leverage_points: string[];
  discount_potential: number; // Percentage
  alternative_terms: string[];
  priority: 'high' | 'medium' | 'low';
  script: string;
}

export function generateNegotiationStrategy(supplier: {
  supplier_id: string;
  total_revenue_generated?: number;
  product_count?: number;
  avg_margin?: number;
  competitor_count?: number;
}): NegotiationStrategy {
  const leveragePoints: string[] = [];
  const alternativeTerms: string[] = [];
  let discountPotential = 0;
  let priority: NegotiationStrategy['priority'] = 'low';

  // High volume leverage
  if ((supplier.total_revenue_generated || 0) > 50000) {
    leveragePoints.push(`High revenue partner: $${supplier.total_revenue_generated?.toLocaleString()}`);
    discountPotential += 8;
    priority = 'high';
  } else if ((supplier.total_revenue_generated || 0) > 10000) {
    leveragePoints.push(`Growing partnership: $${supplier.total_revenue_generated?.toLocaleString()}`);
    discountPotential += 5;
    priority = 'medium';
  }

  // Multiple products
  if ((supplier.product_count || 0) > 20) {
    leveragePoints.push(`${supplier.product_count} active products`);
    discountPotential += 3;
  }

  // Low margin products
  if ((supplier.avg_margin || 0) < 0.25) {
    leveragePoints.push('Margin pressure - need better rates to continue');
    discountPotential += 5;
    alternativeTerms.push('Volume discounts at 50/100/200 units');
    alternativeTerms.push('Exclusive partnership in exchange for 10% discount');
  }

  // Competition exists
  if ((supplier.competitor_count || 0) > 3) {
    leveragePoints.push(`${supplier.competitor_count} alternative suppliers available`);
    discountPotential += 4;
    alternativeTerms.push('Price match guarantee with competitors');
  }

  // Build negotiation script
  const script = `
Hi [Supplier],

I wanted to reach out regarding our partnership. ${leveragePoints.join('. ')}.

We're looking to strengthen our relationship and would like to discuss:
${alternativeTerms.map((term, i) => `${i + 1}. ${term}`).join('\n')}

Based on our volume and partnership potential, we believe a ${discountPotential}% cost reduction is reasonable. This would allow us to:
- Increase order volumes
- Feature your products more prominently
- Provide faster payments
- Offer marketing support

Can we schedule a call to discuss terms?

Best regards,
AI City Marketplace Team
  `.trim();

  return {
    supplier_id: supplier.supplier_id,
    leverage_points: leveragePoints,
    discount_potential: Math.min(discountPotential, 15), // Cap at 15%
    alternative_terms: alternativeTerms,
    priority,
    script,
  };
}

/**
 * FEATURE 6: BUNDLE & RITUAL KIT GENERATION
 * Automatically create product bundles
 */

export interface BundleRecommendation {
  bundle_name: string;
  products: Array<{
    product_id: string;
    product_title: string;
    role: 'anchor' | 'complement' | 'addon';
  }>;
  bundle_price: number;
  individual_price_sum: number;
  discount_percentage: number;
  expected_margin: number;
  bundle_score: number; // 0-100
  theme: string;
  description: string;
  seasonal: boolean;
}

export async function generateBundles(
  products: Array<ProductData & { product_id: string; category?: string }>
): Promise<BundleRecommendation[]> {
  const bundles: BundleRecommendation[] = [];

  // Group products by category
  const categories = new Map<string, typeof products>();
  products.forEach(p => {
    const cat = p.category || 'uncategorized';
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat)!.push(p);
  });

  for (const [category, categoryProducts] of categories) {
    if (categoryProducts.length < 2) continue;

    try {
      // Use AI to suggest bundles
      const prompt = `Create bundles from these ${category} products:

${categoryProducts.slice(0, 10).map((p, i) => `${i + 1}. ${p.title} - $${p.suggested_price || p.supplier_cost * 2.5}`).join('\n')}

Create 1-2 compelling bundles. Return JSON array:
[
  {
    "bundle_name": "...",
    "product_indices": [0, 1, 2],
    "theme": "...",
    "description": "...",
    "discount_percentage": <10-25>,
    "seasonal": true/false
  }
]`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
      });

      const content = response.choices[0].message.content || '[]';
      const suggestions = JSON.parse(content.replace(/```json\n?|\n?```/g, ''));

      for (const suggestion of suggestions) {
        const bundleProducts = suggestion.product_indices.map((idx: number) => categoryProducts[idx]).filter(Boolean);
        if (bundleProducts.length < 2) continue;

        const individualSum = bundleProducts.reduce((sum, p) => sum + (p.suggested_price || p.supplier_cost * 2.5), 0);
        const bundlePrice = individualSum * (1 - suggestion.discount_percentage / 100);
        const totalCost = bundleProducts.reduce((sum, p) => sum + p.supplier_cost + (p.shipping_cost || 0), 0);
        const bundleProfit = bundlePrice - totalCost - (bundlePrice * 0.05) - (bundlePrice * 0.029 + 0.30);
        const expectedMargin = bundleProfit / bundlePrice;

        bundles.push({
          bundle_name: suggestion.bundle_name,
          products: bundleProducts.map((p, idx) => ({
            product_id: p.product_id || '',
            product_title: p.title,
            role: idx === 0 ? 'anchor' : idx === bundleProducts.length - 1 ? 'addon' : 'complement',
          })),
          bundle_price: Math.round(bundlePrice * 100) / 100,
          individual_price_sum: Math.round(individualSum * 100) / 100,
          discount_percentage: suggestion.discount_percentage,
          expected_margin: Math.round(expectedMargin * 100) / 100,
          bundle_score: Math.min(100, Math.round(expectedMargin * 200 + (bundleProducts.length * 10))),
          theme: suggestion.theme,
          description: suggestion.description,
          seasonal: suggestion.seasonal,
        });
      }
    } catch (error) {
      console.error(`Bundle generation error for ${category}:`, error);
    }
  }

  return bundles.sort((a, b) => b.bundle_score - a.bundle_score);
}

/**
 * FEATURE 7: PERSONALIZATION ENGINE
 * Generate personalized product recommendations
 */

export interface PersonalizationProfile {
  user_id: string;
  preferences: {
    categories: string[];
    price_range: { min: number; max: number };
    styles: string[];
    values: string[]; // e.g., 'eco-friendly', 'artisan', 'tech-forward'
  };
  behavior: {
    avg_order_value: number;
    purchase_frequency: number;
    browsing_patterns: string[];
  };
  goals?: string[]; // e.g., 'wellness', 'productivity', 'creativity'
}

export function personalizeProductScore(
  product: ProductData,
  baseScore: number,
  profile: PersonalizationProfile
): { adjusted_score: number; personalization_boost: number; reasons: string[] } {
  let boost = 0;
  const reasons: string[] = [];

  // Category match
  if (profile.preferences.categories.includes(product.category || '')) {
    boost += 15;
    reasons.push('Matches preferred category');
  }

  // Price range match
  const productPrice = product.suggested_price || product.supplier_cost * 2.5;
  if (productPrice >= profile.preferences.price_range.min && productPrice <= profile.preferences.price_range.max) {
    boost += 10;
    reasons.push('Within preferred price range');
  }

  // High-value customer uplift
  if (profile.behavior.avg_order_value > 100) {
    boost += 5;
    reasons.push('Premium customer');
  }

  const adjustedScore = Math.min(100, baseScore + boost);

  return {
    adjusted_score: adjustedScore,
    personalization_boost: boost,
    reasons,
  };
}

/**
 * FEATURE 8: SELF-EVOLVING WEIGHTS
 * Adjust scoring weights based on performance data
 */

export interface ScoringWeights {
  profitability: number;
  demand: number;
  competition: number;
  supplier_quality: number;
  strategic_fit: number;
}

export interface PerformanceData {
  product_id: string;
  profitability_score: number;
  demand_score: number;
  competition_score: number;
  supplier_quality_score: number;
  strategic_fit_score: number;
  actual_sales: number;
  actual_margin: number;
  days_listed: number;
}

export function evolveWeights(
  currentWeights: ScoringWeights,
  performanceData: PerformanceData[]
): { new_weights: ScoringWeights; improvements: string[]; confidence: number } {
  const improvements: string[] = [];
  const newWeights = { ...currentWeights };

  // Analyze which pillar scores correlate best with actual sales
  const correlations = {
    profitability: calculateCorrelation(performanceData.map(p => p.profitability_score), performanceData.map(p => p.actual_sales)),
    demand: calculateCorrelation(performanceData.map(p => p.demand_score), performanceData.map(p => p.actual_sales)),
    competition: calculateCorrelation(performanceData.map(p => p.competition_score), performanceData.map(p => p.actual_sales)),
    supplier_quality: calculateCorrelation(performanceData.map(p => p.supplier_quality_score), performanceData.map(p => p.actual_sales)),
    strategic_fit: calculateCorrelation(performanceData.map(p => p.strategic_fit_score), performanceData.map(p => p.actual_sales)),
  };

  // Adjust weights based on correlations (higher correlation = higher weight)
  const totalCorr = Object.values(correlations).reduce((a, b) => a + Math.abs(b), 0);
  if (totalCorr > 0) {
    newWeights.profitability = Math.abs(correlations.profitability) / totalCorr;
    newWeights.demand = Math.abs(correlations.demand) / totalCorr;
    newWeights.competition = Math.abs(correlations.competition) / totalCorr;
    newWeights.supplier_quality = Math.abs(correlations.supplier_quality) / totalCorr;
    newWeights.strategic_fit = Math.abs(correlations.strategic_fit) / totalCorr;

    // Normalize to sum to 1.0
    const sum = newWeights.profitability + newWeights.demand + newWeights.competition + newWeights.supplier_quality + newWeights.strategic_fit;
    newWeights.profitability /= sum;
    newWeights.demand /= sum;
    newWeights.competition /= sum;
    newWeights.supplier_quality /= sum;
    newWeights.strategic_fit /= sum;

    // Generate insights
    const maxCorr = Math.max(...Object.values(correlations).map(Math.abs));
    const strongestPillar = Object.entries(correlations).find(([_, v]) => Math.abs(v) === maxCorr)?.[0];
    improvements.push(`${strongestPillar} shows strongest correlation with sales (${maxCorr.toFixed(2)})`);

    if (Math.abs(newWeights.profitability - currentWeights.profitability) > 0.05) {
      improvements.push(`Profitability weight ${newWeights.profitability > currentWeights.profitability ? 'increased' : 'decreased'} to ${(newWeights.profitability * 100).toFixed(1)}%`);
    }
  }

  const confidence = performanceData.length >= 50 ? 0.9 : performanceData.length >= 20 ? 0.7 : 0.5;

  return {
    new_weights: newWeights,
    improvements,
    confidence,
  };
}

function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0 || x.length !== y.length) return 0;

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  return denX === 0 || denY === 0 ? 0 : num / Math.sqrt(denX * denY);
}

/**
 * FEATURE 9: DIGITAL PRODUCT GENERATION
 * Create zero-cost digital products
 */

export interface DigitalProductIdea {
  title: string;
  type: 'guide' | 'template' | 'ritual' | 'course' | 'checklist';
  related_physical_products: string[];
  price: number;
  expected_margin: number; // Nearly 100% for digital
  content_outline: string[];
  target_audience: string;
  bundle_opportunity: boolean;
}

export async function generateDigitalProducts(
  physicalProducts: Array<ProductData & { product_id: string }>
): Promise<DigitalProductIdea[]> {
  const ideas: DigitalProductIdea[] = [];

  // Group by category for themed digital products
  const categories = new Map<string, typeof physicalProducts>();
  physicalProducts.forEach(p => {
    const cat = p.category || 'uncategorized';
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat)!.push(p);
  });

  for (const [category, products] of categories) {
    if (products.length === 0) continue;

    try {
      const prompt = `Create digital product ideas for ${category} category with these physical products:

${products.slice(0, 5).map(p => `- ${p.title}`).join('\n')}

Generate 2-3 digital products (guides, templates, rituals, courses, checklists) that complement these physical products.

Return JSON array:
[
  {
    "title": "...",
    "type": "guide" | "template" | "ritual" | "course" | "checklist",
    "price": <9.99-49.99>,
    "content_outline": ["chapter1", "chapter2", ...],
    "target_audience": "...",
    "bundle_opportunity": true/false
  }
]`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 600,
      });

      const content = response.choices[0].message.content || '[]';
      const digitalIdeas = JSON.parse(content.replace(/```json\n?|\n?```/g, ''));

      for (const idea of digitalIdeas) {
        ideas.push({
          title: idea.title,
          type: idea.type,
          related_physical_products: products.slice(0, 3).map(p => p.product_id || ''),
          price: idea.price,
          expected_margin: 0.95, // 95% margin (minimal platform fees only)
          content_outline: idea.content_outline || [],
          target_audience: idea.target_audience,
          bundle_opportunity: idea.bundle_opportunity,
        });
      }
    } catch (error) {
      console.error(`Digital product generation error for ${category}:`, error);
    }
  }

  return ideas;
}

/**
 * FEATURE 10: QUALITY ASSURANCE SYSTEM
 * Automated quality checks before listing
 */

export interface QualityCheckResult {
  product_id: string;
  passed: boolean;
  score: number; // 0-100
  issues: Array<{
    severity: 'critical' | 'warning' | 'info';
    category: string;
    message: string;
  }>;
  recommendations: string[];
}

export function performQualityCheck(product: ProductData & { product_id: string }): QualityCheckResult {
  const issues: QualityCheckResult['issues'] = [];
  const recommendations: string[] = [];
  let score = 100;

  // Critical: Missing essential data
  if (!product.title || product.title.length < 10) {
    issues.push({ severity: 'critical', category: 'Title', message: 'Title missing or too short (<10 chars)' });
    score -= 30;
  }

  if (!product.supplier_cost || product.supplier_cost <= 0) {
    issues.push({ severity: 'critical', category: 'Pricing', message: 'Invalid supplier cost' });
    score -= 25;
  }

  if (!product.images || product.images.length === 0) {
    issues.push({ severity: 'critical', category: 'Images', message: 'No product images' });
    score -= 20;
  }

  // Warnings: Quality concerns
  if (!product.description || product.description.length < 50) {
    issues.push({ severity: 'warning', category: 'Description', message: 'Description missing or too short' });
    score -= 10;
    recommendations.push('Add detailed product description (minimum 50 characters)');
  }

  if (product.images && product.images.length < 3) {
    issues.push({ severity: 'warning', category: 'Images', message: `Only ${product.images.length} images (recommended: 3+)` });
    score -= 5;
    recommendations.push('Add more product images for better conversions');
  }

  if (!product.category) {
    issues.push({ severity: 'warning', category: 'Categorization', message: 'No category assigned' });
    score -= 10;
    recommendations.push('Assign product to appropriate category');
  }

  // Info: Optimization opportunities
  if (!product.reviews || product.reviews.count === 0) {
    issues.push({ severity: 'info', category: 'Reviews', message: 'No reviews yet' });
    recommendations.push('Request reviews from test customers');
  }

  if (!product.stock_quantity || product.stock_quantity < 10) {
    issues.push({ severity: 'info', category: 'Stock', message: 'Low stock quantity' });
    recommendations.push('Ensure adequate stock levels (20+ units recommended)');
  }

  const passed = issues.filter(i => i.severity === 'critical').length === 0;

  return {
    product_id: product.product_id,
    passed,
    score: Math.max(0, score),
    issues,
    recommendations,
  };
}

/**
 * FEATURE 11: AI IMAGE-DESCRIPTION VERIFICATION
 * Uses OpenAI Vision API to verify images match product descriptions
 */

export interface ImageVerificationResult {
  product_id: string;
  image_url: string;
  matches_description: boolean;
  confidence: number; // 0-1
  detected_objects: string[];
  detected_text: string[];
  issues: string[];
  ai_analysis: string;
}

export async function verifyProductImage(
  product: ProductData & { product_id: string },
  imageUrl: string
): Promise<ImageVerificationResult> {
  try {
    const prompt = `Analyze this product image and determine if it matches the product description.

Product Title: ${product.title}
Product Description: ${product.description || 'No description provided'}
Category: ${product.category || 'Unknown'}

Examine the image and answer:
1. Does the image show the described product?
2. What objects are visible in the image?
3. Is there any text visible in the image?
4. Are there any issues (low quality, wrong product, misleading, etc.)?
5. Confidence level that this image matches the product (0-100%)

Return JSON:
{
  "matches_description": true/false,
  "confidence": <0-100>,
  "detected_objects": ["object1", "object2"],
  "detected_text": ["text1", "text2"],
  "issues": ["issue1", "issue2"],
  "ai_analysis": "brief explanation"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      max_tokens: 500,
    });

    const content = response.choices[0].message.content || '{}';
    const analysis = JSON.parse(content.replace(/```json\n?|\n?```/g, ''));

    return {
      product_id: product.product_id,
      image_url: imageUrl,
      matches_description: analysis.matches_description !== false,
      confidence: (analysis.confidence || 50) / 100,
      detected_objects: analysis.detected_objects || [],
      detected_text: analysis.detected_text || [],
      issues: analysis.issues || [],
      ai_analysis: analysis.ai_analysis || 'Analysis unavailable',
    };
  } catch (error) {
    console.error('Image verification error:', error);
    return {
      product_id: product.product_id,
      image_url: imageUrl,
      matches_description: true, // Default to true on error to avoid false negatives
      confidence: 0.5,
      detected_objects: [],
      detected_text: [],
      issues: ['AI verification unavailable'],
      ai_analysis: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}

/**
 * FEATURE 12: BATCH IMAGE VERIFICATION
 * Verify all product images at once
 */

export async function verifyAllProductImages(
  product: ProductData & { product_id: string }
): Promise<{
  product_id: string;
  all_valid: boolean;
  verifications: ImageVerificationResult[];
  overall_confidence: number;
  flagged_images: string[];
}> {
  const images = product.images || [];
  if (images.length === 0) {
    return {
      product_id: product.product_id,
      all_valid: false,
      verifications: [],
      overall_confidence: 0,
      flagged_images: [],
    };
  }

  const verifications: ImageVerificationResult[] = [];
  const flaggedImages: string[] = [];

  for (const imageUrl of images) {
    const result = await verifyProductImage(product, imageUrl);
    verifications.push(result);

    // Flag images with low confidence or that don't match
    if (!result.matches_description || result.confidence < 0.6) {
      flaggedImages.push(imageUrl);
    }

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const avgConfidence = verifications.reduce((sum, v) => sum + v.confidence, 0) / verifications.length;
  const allValid = flaggedImages.length === 0 && verifications.every(v => v.matches_description);

  return {
    product_id: product.product_id,
    all_valid: allValid,
    verifications,
    overall_confidence: avgConfidence,
    flagged_images: flaggedImages,
  };
}
