import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const { pending_id, notes } = await request.json();

    if (!pending_id || !notes) {
      return NextResponse.json(
        { error: 'pending_id and notes are required' },
        { status: 400 }
      );
    }

    // Call the reject_pending_product function
    const { error } = await supabase.rpc('reject_pending_product', {
      pending_id,
      notes
    });

    if (error) {
      console.error('Error rejecting product:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product rejected successfully'
    });

  } catch (error: any) {
    console.error('Error in reject-product API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
