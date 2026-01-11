import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';
import {
  optimizeCatalog,
  forecastDemand,
  calculateDynamicPrice,
  assessSupplierRisk,
  generateNegotiationStrategy,
  generateBundles,
  generateDigitalProducts,
  evolveWeights,
  performQualityCheck,
} from '@/lib/autonomous/product-scoring-engine';

/**
 * GET /api/admin/commerce-engine/advanced?action=<action>&params=<params>
 * 
 * Advanced Commerce Engine features
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    switch (action) {
      case 'catalog-optimization': {
        // Fetch products with performance data
        const supabase = getSupabaseClient();
        const { data: products, error } = await supabase
          .from('products')
          .select(`
            id,
            title,
            supplier_cost,
            sale_price,
            supplier_id,
            category,
            created_at,
            is_active
          `)
          .eq('is_active', true)
          .limit(100);

        if (error) throw error;

        // Add performance metrics (mock for now - replace with actual analytics)
        const productsWithMetrics = products.map(p => ({
          title: p.title,
          supplier_cost: p.supplier_cost,
          supplier_id: p.supplier_id || '',
          supplier_name: '', // Fetch from suppliers table if needed
          category: p.category,
          product_id: p.id,
          sales_count: Math.floor(Math.random() * 50), // Replace with actual sales data
          view_count: Math.floor(Math.random() * 500), // Replace with actual view data
          days_listed: Math.floor((Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        }));

        const optimization = await optimizeCatalog(productsWithMetrics);

        return NextResponse.json({
          success: true,
          optimization,
          summary: {
            to_remove: optimization.products_to_remove.length,
            to_deprioritize: optimization.products_to_deprioritize.length,
            to_promote: optimization.products_to_promote.length,
          },
        });
      }

      case 'supplier-risk': {
        // Fetch all suppliers with metrics
        const { data: suppliers, error } = await supabase
          .from('suppliers')
          .select('*')
          .limit(50);

        if (error) throw error;

        const riskAssessments = suppliers.map(supplier => {
          // Calculate metrics (mock - replace with actual data)
          const metrics = {
            supplier_id: supplier.id,
            avg_delivery_days: 7 + Math.random() * 10,
            return_rate: Math.random() * 0.15,
            dispute_rate: Math.random() * 0.08,
            stockout_rate: Math.random() * 0.20,
            response_time_hours: Math.random() * 72,
            quality_score: 60 + Math.random() * 40,
            days_active: Math.floor((Date.now() - new Date(supplier.created_at).getTime()) / (1000 * 60 * 60 * 24)),
          };

          return {
            supplier_name: supplier.business_name,
            ...assessSupplierRisk(metrics),
          };
        });

        // Group by risk level
        const byRiskLevel = {
          critical: riskAssessments.filter(r => r.risk_level === 'critical'),
          high: riskAssessments.filter(r => r.risk_level === 'high'),
          medium: riskAssessments.filter(r => r.risk_level === 'medium'),
          low: riskAssessments.filter(r => r.risk_level === 'low'),
        };

        return NextResponse.json({
          success: true,
          risk_assessments: riskAssessments,
          by_risk_level: byRiskLevel,
          summary: {
            critical: byRiskLevel.critical.length,
            high: byRiskLevel.high.length,
            medium: byRiskLevel.medium.length,
            low: byRiskLevel.low.length,
          },
        });
      }

      case 'negotiation-strategies': {
        const supplierId = searchParams.get('supplierId');
        
        if (!supplierId) {
          return NextResponse.json(
            { error: 'supplierId required' },
            { status: 400 }
          );
        }

        // Fetch supplier data
        const { data: supplier, error } = await supabase
          .from('suppliers')
          .select('*')
          .eq('id', supplierId)
          .single();

        if (error) throw error;

        // Calculate metrics (mock - replace with actual data)
        const metrics = {
          supplier_id: supplierId,
          total_revenue_generated: 25000 + Math.random() * 100000,
          product_count: Math.floor(10 + Math.random() * 50),
          avg_margin: 0.20 + Math.random() * 0.20,
          competitor_count: Math.floor(Math.random() * 8),
        };

        const strategy = generateNegotiationStrategy(metrics);

        return NextResponse.json({
          success: true,
          supplier_name: supplier.business_name,
          strategy,
        });
      }

      case 'bundle-recommendations': {
        // Fetch products
        const { data: products, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .limit(50);

        if (error) throw error;

        const productsWithIds = products.map(p => ({
          ...p,
          product_id: p.id,
        }));

        const bundles = await generateBundles(productsWithIds);

        return NextResponse.json({
          success: true,
          bundles: bundles.slice(0, 10), // Top 10 bundles
          summary: {
            total_bundles: bundles.length,
            avg_discount: bundles.reduce((sum, b) => sum + b.discount_percentage, 0) / bundles.length,
            avg_margin: bundles.reduce((sum, b) => sum + b.expected_margin, 0) / bundles.length,
          },
        });
      }

      case 'digital-products': {
        // Fetch physical products
        const { data: products, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .limit(30);

        if (error) throw error;

        const productsWithIds = products.map(p => ({
          ...p,
          product_id: p.id,
        }));

        const digitalProducts = await generateDigitalProducts(productsWithIds);

        return NextResponse.json({
          success: true,
          digital_products: digitalProducts,
          summary: {
            total_ideas: digitalProducts.length,
            total_revenue_potential: digitalProducts.reduce((sum, d) => sum + d.price, 0),
            avg_margin: 0.95, // 95% margin for digital products
          },
        });
      }

      case 'weight-evolution': {
        // Fetch performance data
        const { data: products, error } = await supabase
          .from('products')
          .select(`
            id,
            commerce_score,
            profitability_score,
            demand_score,
            competition_score,
            supplier_quality_score,
            strategic_fit_score,
            created_at
          `)
          .not('commerce_score', 'is', null)
          .limit(100);

        if (error) throw error;

        // Add actual sales data (mock - replace with real analytics)
        const performanceData = products.map(p => ({
          product_id: p.id,
          profitability_score: p.profitability_score || 0,
          demand_score: p.demand_score || 0,
          competition_score: p.competition_score || 0,
          supplier_quality_score: p.supplier_quality_score || 0,
          strategic_fit_score: p.strategic_fit_score || 0,
          actual_sales: Math.floor(Math.random() * 100),
          actual_margin: 0.25 + Math.random() * 0.25,
          days_listed: Math.floor((Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        }));

        const currentWeights = {
          profitability: 0.35,
          demand: 0.25,
          competition: 0.15,
          supplier_quality: 0.15,
          strategic_fit: 0.10,
        };

        const evolution = evolveWeights(currentWeights, performanceData);

        return NextResponse.json({
          success: true,
          current_weights: currentWeights,
          evolved_weights: evolution.new_weights,
          improvements: evolution.improvements,
          confidence: evolution.confidence,
          recommendation: evolution.confidence > 0.7
            ? 'High confidence - apply new weights'
            : 'Low confidence - collect more data',
        });
      }

      case 'quality-report': {
        // Fetch recent products
        const { data: products, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        const qualityChecks = products.map(p => {
          const qcResult = performQualityCheck({
            title: p.title,
            description: p.description,
            supplier_cost: p.supplier_cost,
            supplier_id: p.supplier_id || '',
            supplier_name: '',
            category: p.category,
            images: p.images,
            reviews: p.reviews,
            stock_quantity: p.stock_quantity,
            shipping_cost: p.shipping_cost,
            sku: p.sku,
            product_id: p.id,
          });

          return {
            product_title: p.title,
            ...qcResult,
          };
        });

        const passed = qualityChecks.filter(q => q.passed);
        const failed = qualityChecks.filter(q => !q.passed);
        const avgScore = qualityChecks.reduce((sum, q) => sum + q.score, 0) / qualityChecks.length;

        return NextResponse.json({
          success: true,
          quality_checks: qualityChecks,
          summary: {
            total: qualityChecks.length,
            passed: passed.length,
            failed: failed.length,
            pass_rate: (passed.length / qualityChecks.length * 100).toFixed(1) + '%',
            avg_score: avgScore.toFixed(1),
          },
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Available: catalog-optimization, supplier-risk, negotiation-strategies, bundle-recommendations, digital-products, weight-evolution, quality-report' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Advanced commerce engine error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/commerce-engine/advanced
 * 
 * Execute advanced actions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params } = body;

    switch (action) {
      case 'apply-catalog-optimization': {
        const { products_to_remove, products_to_deprioritize } = params;

        // Archive products to remove
        if (products_to_remove?.length > 0) {
          const { error: removeError } = await supabase
            .from('products')
            .update({ is_active: false, archived_at: new Date().toISOString() })
            .in('id', products_to_remove);

          if (removeError) throw removeError;
        }

        // Deprioritize products (lower search ranking)
        if (products_to_deprioritize?.length > 0) {
          const { error: deprioritizeError } = await supabase
            .from('products')
            .update({ priority: 'low' })
            .in('id', products_to_deprioritize);

          if (deprioritizeError) throw deprioritizeError;
        }

        return NextResponse.json({
          success: true,
          removed: products_to_remove?.length || 0,
          deprioritized: products_to_deprioritize?.length || 0,
        });
      }

      case 'apply-dynamic-pricing': {
        const { product_id, new_price } = params;

        const { error } = await supabase
          .from('products')
          .update({ 
            sale_price: new_price,
            price_updated_at: new Date().toISOString(),
          })
          .eq('id', product_id);

        if (error) throw error;

        return NextResponse.json({
          success: true,
          product_id,
          new_price,
        });
      }

      case 'create-bundles': {
        const { bundles } = params;

        // Create bundle records
        for (const bundle of bundles) {
          const { error } = await supabase
            .from('bundles')
            .insert({
              name: bundle.bundle_name,
              description: bundle.description,
              price: bundle.bundle_price,
              discount_percentage: bundle.discount_percentage,
              product_ids: bundle.products.map((p: any) => p.product_id),
              theme: bundle.theme,
              seasonal: bundle.seasonal,
              is_active: true,
            });

          if (error) throw error;
        }

        return NextResponse.json({
          success: true,
          bundles_created: bundles.length,
        });
      }

      case 'save-evolved-weights': {
        const { weights } = params;

        // Save to configuration table
        const { error } = await supabase
          .from('system_config')
          .upsert({
            key: 'scoring_weights',
            value: weights,
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;

        return NextResponse.json({
          success: true,
          weights,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Advanced commerce engine POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
