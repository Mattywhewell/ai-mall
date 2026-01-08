import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

interface RouteParams {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * GET /api/collections/[slug]
 * Fetch a specific collection by slug with full details
 */
export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Fetch collection
    const { data: collection, error } = await supabase
      .from('ai_collections')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'active')
      .single();

    if (error || !collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    // Fetch full product details
    const { data: products } = await supabase
      .from('products')
      .select('id, name, description, price, image_url, category, tags, microstore_id, created_at')
      .in('id', collection.product_ids);

    // Fetch user affinity if userId provided
    let userAffinity = null;
    if (userId) {
      const { data } = await supabase
        .from('user_collection_affinity')
        .select('*')
        .eq('user_id', userId)
        .eq('collection_id', collection.id)
        .single();

      userAffinity = data;

      // Track view
      await supabase.rpc('track_collection_view', {
        p_user_id: userId,
        p_collection_id: collection.id,
        p_time_spent_seconds: 0
      });
    }

    // Fetch analytics
    const { data: analytics } = await supabase
      .from('collection_analytics')
      .select('*')
      .eq('collection_id', collection.id)
      .order('recorded_date', { ascending: false })
      .limit(30);

    return NextResponse.json({
      collection: {
        ...collection,
        products: products || []
      },
      userAffinity,
      analytics: analytics || []
    });
  } catch (error: any) {
    console.error('Error fetching collection:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collection', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/collections/[slug]
 * Update a collection (admin only)
 */
export async function PATCH(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const {
      name,
      description,
      productIds,
      status,
      activeUntil
    } = body;

    const updates: any = {};
    if (name) updates.name = name;
    if (description) updates.description = description;
    if (productIds) updates.product_ids = productIds;
    if (status) updates.status = status;
    if (activeUntil !== undefined) updates.active_until = activeUntil;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    updates.updated_at = new Date().toISOString();

    const { data: collection, error } = await supabase
      .from('ai_collections')
      .update(updates)
      .eq('slug', slug)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update collection', details: error.message },
        { status: 500 }
      );
    }

    // Log update
    await supabase.from('collection_evolution_log').insert({
      collection_id: collection.id,
      evolution_type: 'products_updated',
      triggered_by: 'admin',
      changes: {
        action: 'manual_update',
        updated_fields: Object.keys(updates)
      }
    });

    return NextResponse.json({
      success: true,
      collection
    });
  } catch (error: any) {
    console.error('Error updating collection:', error);
    return NextResponse.json(
      { error: 'Failed to update collection', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/collections/[slug]
 * Archive a collection (admin only)
 */
export async function DELETE(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { slug } = await params;

    const { data: collection, error } = await supabase
      .from('ai_collections')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString()
      })
      .eq('slug', slug)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to archive collection', details: error.message },
        { status: 500 }
      );
    }

    // Log archival
    await supabase.from('collection_evolution_log').insert({
      collection_id: collection.id,
      evolution_type: 'archived',
      triggered_by: 'admin',
      changes: {
        action: 'archived',
        reason: 'Manual archival by admin'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Collection archived'
    });
  } catch (error: any) {
    console.error('Error archiving collection:', error);
    return NextResponse.json(
      { error: 'Failed to archive collection', details: error.message },
      { status: 500 }
    );
  }
}
