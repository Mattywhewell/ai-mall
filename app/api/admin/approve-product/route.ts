import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const { pending_id, notes } = await request.json();

    if (!pending_id) {
      return NextResponse.json(
        { error: 'pending_id is required' },
        { status: 400 }
      );
    }

    // Call the approve_pending_product function
    const { data, error } = await supabase.rpc('approve_pending_product', {
      pending_id,
      notes: notes || null
    });

    if (error) {
      console.error('Error approving product:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product_id: data,
      message: 'Product approved and published successfully'
    });

  } catch (error: any) {
    console.error('Error in approve-product API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
