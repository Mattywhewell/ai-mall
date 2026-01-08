import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

/**
 * GET /api/collections
 * Fetch all active collections or personalized collections for a user
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const theme = searchParams.get('theme');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Personalized collections for logged-in user
    if (userId) {
      const { data, error } = await supabase
        .rpc('get_personalized_collections', {
          p_user_id: userId,
          p_limit: limit
        });

      if (error) throw error;

      return NextResponse.json({
        collections: data || [],
        personalized: true
      });
    }

    // Filter by theme
    let query = supabase
      .from('ai_collections')
      .select(`
        id,
        name,
        slug,
        description,
        theme,
        curator_personality,
        product_ids,
        color_scheme,
        cover_image_url,
        view_count,
        conversion_count,
        revenue_generated,
        created_at
      `)
      .eq('status', 'active')
      .eq('visibility', 'public')
      .or('active_until.is.null,active_until.gt.now()')
      .order('conversion_count', { ascending: false })
      .limit(limit);

    if (theme) {
      query = query.eq('theme', theme);
    }

    const { data: collections, error } = await query;

    if (error) throw error;

    // Fetch products for each collection
    const collectionsWithProducts = await Promise.all(
      (collections || []).map(async (collection) => {
        const { data: products } = await supabase
          .from('products')
          .select('id, name, price, image_url, category')
          .in('id', collection.product_ids)
          .limit(8);

        return {
          ...collection,
          products: products || []
        };
      })
    );

    return NextResponse.json({
      collections: collectionsWithProducts,
      personalized: false
    });
  } catch (error: any) {
    console.error('Error fetching collections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collections', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/collections
 * Create a new AI-curated collection (admin only)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      slug,
      description,
      theme,
      curatorPersonality,
      productIds,
      colorScheme,
      activeUntil
    } = body;

    // Validation
    if (!name || !slug || !theme || !productIds || productIds.length < 3) {
      return NextResponse.json(
        { error: 'Missing required fields. Need name, slug, theme, and at least 3 productIds' },
        { status: 400 }
      );
    }

    // Create collection
    const { data: collection, error } = await supabase
      .from('ai_collections')
      .insert({
        name,
        slug,
        description,
        theme,
        curator_personality: curatorPersonality || 'AI Curator',
        product_ids: productIds,
        color_scheme: colorScheme || { primary: '#6b7280', secondary: '#374151', accent: '#f3f4f6' },
        status: 'active',
        visibility: 'public',
        active_from: new Date().toISOString(),
        active_until: activeUntil || null,
        ai_generated: false,
        curation_reasoning: {
          summary: 'Manually created collection',
          method: 'admin_creation'
        }
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create collection', details: error.message },
        { status: 500 }
      );
    }

    // Log creation
    await supabase.from('collection_evolution_log').insert({
      collection_id: collection.id,
      evolution_type: 'created',
      triggered_by: 'admin',
      changes: {
        action: 'manual_creation',
        product_count: productIds.length
      },
      ai_reasoning: 'Collection created manually by admin'
    });

    return NextResponse.json({
      success: true,
      collection
    });
  } catch (error: any) {
    console.error('Error creating collection:', error);
    return NextResponse.json(
      { error: 'Failed to create collection', details: error.message },
      { status: 500 }
    );
  }
}
