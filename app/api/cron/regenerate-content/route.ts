import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { generateProductDescription } from '@/lib/ai/generateDescription';
import { generateSEOMetadata } from '@/lib/ai/generateSEO';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'ai-city-evolution-2026';

    if (!authHeader || !authHeader.includes(cronSecret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting content regeneration cycle...');

    // Get products that need content refresh (older than 30 days or low performance)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*, microstores(name)')
      .lt('updated_at', thirtyDaysAgo.toISOString())
      .limit(50); // Process in batches

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    const regenerationResults = [];

    for (const product of products || []) {
      try {
        console.log(`📝 Regenerating content for: ${product.name}`);

        // Regenerate product description
        const descriptionResult = await generateProductDescription(
          product.name,
          product.microstores?.name || 'General',
          product.microstores?.name || 'General'
        );

        // Regenerate SEO metadata
        const seoResult = await generateSEOMetadata(
          product.name,
          descriptionResult.longDescription || product.description || '',
          product.microstores?.name || 'General'
        );

        // Update product with new content
        await supabase
          .from('products')
          .update({
            description: descriptionResult.longDescription,
            tags: descriptionResult.tags || product.tags,
            seo_title: seoResult.title,
            seo_description: seoResult.description,
            seo_keywords: seoResult.keywords,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id);

        regenerationResults.push({
          product_id: product.id,
          product_name: product.name,
          regenerated: true
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (productError) {
        console.error(`Error regenerating content for product ${product.id}:`, productError);
        regenerationResults.push({
          product_id: product.id,
          product_name: product.name,
          regenerated: false,
          error: productError instanceof Error ? productError.message : 'Unknown error'
        });
      }
    }

    const successCount = regenerationResults.filter(r => r.regenerated).length;

    console.log(`✅ Content regeneration completed. Updated ${successCount}/${regenerationResults.length} products.`);

    return NextResponse.json({
      success: true,
      message: 'Content regeneration completed',
      total_processed: regenerationResults.length,
      successful_updates: successCount,
      results: regenerationResults
    });

  } catch (error) {
    console.error('❌ Content regeneration failed:', error);
    return NextResponse.json(
      { error: 'Content regeneration failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Content Regeneration Cron Endpoint',
    schedule: 'Every 6 hours',
    description: 'Regenerates product descriptions and SEO metadata for older/low-performing content'
  });
}