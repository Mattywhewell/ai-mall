import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const { product_id, reason } = await request.json();

    if (!product_id || !reason) {
      return NextResponse.json(
        { error: 'product_id and reason are required' },
        { status: 400 }
      );
    }

    // Call the flag_product function
    const { error } = await supabase.rpc('flag_product', {
      product_id,
      reason
    });

    if (error) {
      console.error('Error flagging product:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product flagged successfully'
    });

  } catch (error: any) {
    console.error('Error in flag-product API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
