import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';
import { productScraper } from '@/lib/autonomous/product-scraper';
import { websiteAnalyzer } from '@/lib/autonomous/website-analyzer';

/**
 * POST /api/admin/products/import
 * Trigger manual product import from supplier website
 */
export async function POST(request: Request) {
  try {
    const { supplierId } = await request.json();

    if (!supplierId) {
      return NextResponse.json(
        { error: 'Supplier ID required' },
        { status: 400 }
      );
    }

    // Get supplier data
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id, business_name, website, website_analysis')
      .eq('id', supplierId)
      .single();

    if (!supplier || !supplier.website) {
      return NextResponse.json(
        { error: 'Supplier not found or has no website' },
        { status: 404 }
      );
    }

    // Scrape products
    const result = await productScraper.scrapeProducts(
      supplier.website,
      supplierId,
      supplier.website_analysis
    );

    // Import products
    let imported = 0;
    const errors: string[] = [];

    for (const product of result.products) {
      try {
        // Generate description
        const description = await productScraper.generateDescription(
          product,
          supplier.website_analysis
        );

        // Assign district
        const { districtSlug } = await productScraper.assignDistrict(
          product,
          supplier.website_analysis
        );

        // Get district ID
        const { data: district } = await supabase
          .from('microstores')
          .select('id')
          .eq('slug', districtSlug)
          .single();

        // Create product
        const { error } = await supabase.from('products').insert({
          name: product.name,
          description: description,
          price: productScraper.normalizePrice(product.price, product.currency),
          category: product.category,
          microstore_id: district?.id,
          supplier_id: supplierId,
          image_url: product.images[0] || null,
          stock_quantity: product.inStock ? 100 : 0,
          active: true,
          metadata: {
            original_url: product.url,
            auto_imported: true,
            imported_at: new Date().toISOString()
          }
        });

        if (!error) imported++;
        else errors.push(`${product.name}: ${error.message}`);
      } catch (err) {
        errors.push(`${product.name}: ${err}`);
      }
    }

    return NextResponse.json({
      success: true,
      productsFound: result.productsFound,
      productsImported: imported,
      errors: errors
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Import failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/products/import?supplierId=xxx
 * Get import status and history
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId');

    if (!supplierId) {
      return NextResponse.json(
        { error: 'Supplier ID required' },
        { status: 400 }
      );
    }

    // Get auto-imported products count
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', supplierId)
      .eq('metadata->>auto_imported', 'true');

    // Get latest import job status
    const { data: jobs } = await supabase
      .from('autonomous_jobs')
      .select('*')
      .eq('entity_id', supplierId)
      .eq('job_type', 'product_import')
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      autoImportedCount: count || 0,
      recentJobs: jobs || []
    });
  } catch (error) {
    console.error('Get import status error:', error);
    return NextResponse.json(
      { error: 'Failed to get import status' },
      { status: 500 }
    );
  }
}
