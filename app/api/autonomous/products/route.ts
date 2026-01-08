/**
 * API Route: Product Intelligence
 * GET /api/autonomous/products - Get product intelligence insights
 * POST /api/autonomous/products - Optimize specific product
 */

import { NextResponse } from 'next/server';
import { ProductIntelligence } from '@/lib/autonomous/product-intelligence';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (productId) {
      // Get specific product optimization
      const result = await ProductIntelligence.optimizeProduct(productId);
      return NextResponse.json(result);
    } else {
      // Analyze all products
      const results = await ProductIntelligence.analyzeProducts();
      return NextResponse.json({ analyzed: results.length, results });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { productIds } = await request.json();

    if (!productIds || !Array.isArray(productIds)) {
      return NextResponse.json(
        { error: 'productIds array required' },
        { status: 400 }
      );
    }

    // batchOptimize takes a limit number, not an array
    const limit = productIds.length || 10;
    const optimizedCount = await ProductIntelligence.batchOptimize(limit);
    return NextResponse.json({ 
      optimized: optimizedCount,
      requested: productIds.length
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
