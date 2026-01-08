import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';
import { 
  processSupplierFeed, 
  scoreProduct, 
  ProductData 
} from '@/lib/autonomous/product-scoring-engine';

/**
 * POST /api/admin/commerce-engine
 * Run AI Commerce Engine on supplier products
 * 
 * Body: 
 * - supplierId: string (optional - if provided, processes only this supplier)
 * - dryRun: boolean (optional - if true, scores but doesn't import)
 */
export async function POST(req: Request) {
  try {
    const { supplierId, dryRun = false } = await req.json();
    
    console.log('🚀 AI Commerce Engine starting...');
    console.log(`Mode: ${dryRun ? 'DRY RUN (scoring only)' : 'LIVE (will import approved products)'}`);
    
    // Fetch products to evaluate
    let query = supabase
      .from('products')
      .select(`
        *,
        suppliers!vendor_id (
          id,
          business_name,
          website,
          website_analysis
        )
      `);
    
    if (supplierId) {
      query = query.eq('vendor_id', supplierId);
    }
    
    // Only process products that are:
    // 1. Not yet scored by commerce engine
    // 2. Or rejected products (re-evaluate after 30 days)
    query = query.or('commerce_score.is.null,commerce_last_scored.lt.' + new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    
    const { data: productsData, error } = await query.limit(50); // Process in batches of 50
    
    if (error) throw error;
    
    if (!productsData || productsData.length === 0) {
      return NextResponse.json({
        message: 'No products to process',
        total_products: 0,
      });
    }
    
    console.log(`Found ${productsData.length} products to evaluate`);
    
    // Convert to ProductData format
    const products: ProductData[] = productsData.map(p => ({
      title: p.name,
      description: p.description,
      supplier_cost: p.price * 0.6, // Assume 40% markup from cost
      suggested_price: p.price,
      supplier_id: p.vendor_id,
      supplier_name: p.suppliers?.business_name || 'Unknown',
      category: p.category,
      images: p.images || [],
      reviews: p.reviews ? {
        rating: p.reviews.rating || 0,
        count: p.reviews.count || 0,
      } : undefined,
      stock_quantity: p.stock_quantity,
      shipping_cost: 5.00, // Default shipping
      sku: p.sku,
      attributes: p.attributes,
    }));
    
    // Run commerce engine
    const result = await processSupplierFeed(products);
    
    // If not dry run, update database with scores and import approved products
    if (!dryRun) {
      const updates: any[] = [];
      
      for (let i = 0; i < result.products.length; i++) {
        const score = result.products[i];
        const originalProduct = productsData[i];
        
        // Update product with commerce engine scores
        updates.push({
          id: originalProduct.id,
          commerce_score: score.final_score,
          commerce_decision: score.import_decision,
          commerce_reasoning: score.reasoning,
          commerce_last_scored: new Date().toISOString(),
          profitability_score: score.profitability_score,
          demand_score: score.demand_score,
          competition_score: score.competition_score,
          supplier_quality_score: score.supplier_quality_score,
          strategic_fit_score: score.strategic_fit_score,
        });
        
        // If approved, enable product and update price
        if (score.import_decision !== 'reject') {
          updates[updates.length - 1].is_active = true;
          updates[updates.length - 1].price = score.calculated_price;
          updates[updates.length - 1].profit_margin = score.profit_margin;
          
          console.log(`✅ Approved: ${score.product_title} (score: ${score.final_score})`);
        } else {
          updates[updates.length - 1].is_active = false;
          console.log(`❌ Rejected: ${score.product_title} (score: ${score.final_score})`);
        }
      }
      
      // Batch update products
      for (const update of updates) {
        await supabase
          .from('products')
          .update(update)
          .eq('id', update.id);
      }
      
      console.log(`✅ Updated ${updates.length} products in database`);
    }
    
    return NextResponse.json({
      success: true,
      dry_run: dryRun,
      result,
    });
    
  } catch (error) {
    console.error('Commerce Engine error:', error);
    return NextResponse.json(
      { error: 'Commerce Engine failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/commerce-engine
 * Get commerce engine statistics
 */
export async function GET() {
  try {
    // Get products with commerce scores
    const { data: products } = await supabase
      .from('products')
      .select('id, name, commerce_score, commerce_decision, commerce_last_scored, price, profit_margin')
      .not('commerce_score', 'is', null);
    
    if (!products || products.length === 0) {
      return NextResponse.json({
        total_evaluated: 0,
        imported: 0,
        rejected: 0,
        avg_score: 0,
        total_profit_potential: 0,
      });
    }
    
    // Calculate statistics
    const imported = products.filter(p => p.commerce_decision !== 'reject').length;
    const rejected = products.filter(p => p.commerce_decision === 'reject').length;
    const avg_score = Math.round(
      products.reduce((sum, p) => sum + (p.commerce_score || 0), 0) / products.length
    );
    
    const total_profit_potential = products
      .filter(p => p.commerce_decision !== 'reject')
      .reduce((sum, p) => {
        const profit = (p.price || 0) * (p.profit_margin || 0);
        return sum + profit;
      }, 0);
    
    // Get recent evaluations
    const recent_evaluations = products
      .sort((a, b) => new Date(b.commerce_last_scored || 0).getTime() - new Date(a.commerce_last_scored || 0).getTime())
      .slice(0, 20)
      .map(p => ({
        id: p.id,
        name: p.name,
        score: p.commerce_score,
        decision: p.commerce_decision,
        scored_at: p.commerce_last_scored,
      }));
    
    return NextResponse.json({
      total_evaluated: products.length,
      imported,
      rejected,
      avg_score,
      total_profit_potential: Math.round(total_profit_potential * 100) / 100,
      recent_evaluations,
    });
    
  } catch (error) {
    console.error('Commerce Engine stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
