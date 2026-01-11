/**
 * API Route: /api/supplier/3d-tours
 * GET: List all 3D tours for the authenticated supplier
 * POST: Create a new 3D tour
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';
import { getSupplierId } from '@/lib/auth/supplier';

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const supplierId = await getSupplierId();

    if (!supplierId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tours with hotspot counts
    const { data: tours, error } = await supabase
      .from('supplier_3d_tours')
      .select(`
        *,
        hotspots_count:supplier_tour_hotspots(count)
      `)
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tours:', error);
      return NextResponse.json({ error: 'Failed to fetch tours' }, { status: 500 });
    }

    return NextResponse.json(tours);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const supplierId = await getSupplierId();

    if (!supplierId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      matterport_url,
      tour_type = 'matterport',
      capture_method,
      capture_device,
      seo_title,
      seo_description
    } = body;

    // Validate required fields
    if (!title || !matterport_url) {
      return NextResponse.json(
        { error: 'Title and Matterport URL are required' },
        { status: 400 }
      );
    }

    // Create the tour
    const { data: tour, error } = await supabase
      .from('supplier_3d_tours')
      .insert({
        supplier_id: supplierId,
        title,
        description,
        matterport_url,
        tour_type,
        capture_method,
        capture_device,
        seo_title,
        seo_description,
        enabled: false, // Start as draft
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating tour:', error);
      return NextResponse.json({ error: 'Failed to create tour' }, { status: 500 });
    }

    // Auto-sync product hotspots
    try {
      await supabase.rpc('sync_tour_product_hotspots', { tour_uuid: tour.id });
    } catch (syncError) {
      console.warn('Failed to auto-sync hotspots:', syncError);
      // Don't fail the whole request for this
    }

    return NextResponse.json(tour, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}