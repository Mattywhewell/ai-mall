import { NextResponse } from 'next/server';
import { collectionCurator } from '@/lib/ai-city/collection-curator';
import { getSupabaseClient } from '@/lib/supabase-server';

/**
 * POST /api/collections/refresh
 * Refresh collections with low engagement
 */
export async function POST(request: Request) {
  try {    const supabase = getSupabaseClient();    const body = await request.json();
    const { collectionId, all } = body;

    // Refresh single collection
    if (collectionId) {
      const success = await collectionCurator.refreshCollection(collectionId);

      return NextResponse.json({
        success,
        collectionId,
        message: success ? 'Collection refreshed' : 'Refresh failed or not needed'
      });
    }

    // Refresh all underperforming collections
    if (all) {
      // Find collections with low engagement
      const { data: collections } = await supabase
        .from('ai_collections')
        .select('id, name')
        .eq('status', 'active')
        .lt('avg_engagement_score', 40);

      if (!collections || collections.length === 0) {
        return NextResponse.json({
          success: true,
          refreshed: 0,
          message: 'No collections need refreshing'
        });
      }

      const refreshResults = await Promise.all(
        collections.map(async (c) => ({
          id: c.id,
          name: c.name,
          success: await collectionCurator.refreshCollection(c.id)
        }))
      );

      const successCount = refreshResults.filter(r => r.success).length;

      return NextResponse.json({
        success: true,
        refreshed: successCount,
        total: collections.length,
        results: refreshResults,
        message: `Refreshed ${successCount}/${collections.length} collections`
      });
    }

    return NextResponse.json(
      { error: 'Provide either collectionId or all=true' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error refreshing collections:', error);
    return NextResponse.json(
      { error: 'Failed to refresh collections', details: error.message },
      { status: 500 }
    );
  }
}
