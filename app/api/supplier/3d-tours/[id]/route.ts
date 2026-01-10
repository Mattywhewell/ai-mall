/**
 * API Route: /api/supplier/3d-tours/[id]
 * GET: Get a specific 3D tour with hotspots
 * PATCH: Update a 3D tour
 * DELETE: Delete a 3D tour
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';
import { getSupplierId } from '@/lib/auth/supplier';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;
    const supplierId = await getSupplierId();

    if (!supplierId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tourId = id;

    // Get tour with hotspots using the custom function
    const { data: tourData, error } = await supabase
      .rpc('get_tour_with_hotspots', { tour_uuid: tourId });

    if (error) {
      console.error('Error fetching tour:', error);
      return NextResponse.json({ error: 'Failed to fetch tour' }, { status: 500 });
    }

    if (!tourData || tourData.length === 0) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    const tour = tourData[0];

    // Verify ownership
    const { data: ownershipCheck } = await supabase
      .from('supplier_3d_tours')
      .select('supplier_id')
      .eq('id', tourId)
      .single();

    if (ownershipCheck?.supplier_id !== supplierId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({
      ...tour.tour_data,
      hotspots: tour.hotspots || []
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseClient();
    const supplierId = await getSupplierId();

    if (!supplierId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tourId = id;
    const body = await request.json();

    // Verify ownership
    const { data: ownershipCheck } = await supabase
      .from('supplier_3d_tours')
      .select('supplier_id')
      .eq('id', tourId)
      .single();

    if (ownershipCheck?.supplier_id !== supplierId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update the tour
    const { data: tour, error } = await supabase
      .from('supplier_3d_tours')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', tourId)
      .select()
      .single();

    if (error) {
      console.error('Error updating tour:', error);
      return NextResponse.json({ error: 'Failed to update tour' }, { status: 500 });
    }

    return NextResponse.json(tour);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseClient();
    const supplierId = await getSupplierId();

    if (!supplierId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tourId = id;

    // Verify ownership
    const { data: ownershipCheck } = await supabase
      .from('supplier_3d_tours')
      .select('supplier_id')
      .eq('id', tourId)
      .single();

    if (ownershipCheck?.supplier_id !== supplierId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete the tour (hotspots will be deleted via CASCADE)
    const { error } = await supabase
      .from('supplier_3d_tours')
      .delete()
      .eq('id', tourId);

    if (error) {
      console.error('Error deleting tour:', error);
      return NextResponse.json({ error: 'Failed to delete tour' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}