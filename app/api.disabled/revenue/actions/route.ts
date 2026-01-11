import { NextRequest, NextResponse } from 'next/server';
import { merchandisingEngine } from '@/lib/revenue/merchandising-engine';
import { contentGenerator } from '@/lib/revenue/content-generator';
import { bundlingEngine } from '@/lib/revenue/bundling-engine';
import { semanticSearch } from '@/lib/revenue/semantic-search';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    console.log(`[Revenue Actions] Running: ${action}`);

    switch (action) {
      case 'optimize-merchandising':
        await merchandisingEngine.runMerchandisingOptimization();
        return NextResponse.json({ 
          success: true, 
          message: 'Merchandising optimization complete' 
        });

      case 'generate-bundles':
        await bundlingEngine.runBundleGeneration();
        return NextResponse.json({ 
          success: true, 
          message: 'Product bundles generated' 
        });

      case 'optimize-content':
        await contentGenerator.runWeeklyContentOptimization();
        return NextResponse.json({ 
          success: true, 
          message: 'Content optimization complete' 
        });

      case 'generate-embeddings':
        await semanticSearch.generateAllEmbeddings();
        return NextResponse.json({ 
          success: true, 
          message: 'Embeddings generated for all products' 
        });

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Revenue Actions] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    availableActions: [
      { name: 'optimize-merchandising', description: 'Reorder products based on performance' },
      { name: 'generate-bundles', description: 'Create revenue-optimizing product bundles' },
      { name: 'optimize-content', description: 'Rewrite descriptions and SEO metadata' },
      { name: 'generate-embeddings', description: 'Generate semantic search embeddings' }
    ],
    usage: 'POST with { "action": "action-name" }'
  });
}
