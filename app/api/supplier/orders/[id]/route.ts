import { NextRequest, NextResponse } from 'next/server';

/**
 * PATCH /api/supplier/orders/[id]
 * Update order status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // In production, update in database
    console.log(`Updating order ${id} to status: ${body.status}`);

    return NextResponse.json({
      success: true,
      order: {
        id,
        status: body.status,
        updated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
