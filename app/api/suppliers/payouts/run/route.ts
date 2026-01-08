import { NextRequest, NextResponse } from 'next/server';
import { PayoutProcessor } from '@/lib/revenue/payout-processor';

/**
 * POST /api/suppliers/payouts/run
 * Trigger payout processing (admin or cron)
 * 
 * Body: {
 *   type: 'instant' | 'weekly' | 'monthly',
 *   supplierId?: string // Optional: process specific supplier
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization (check for CRON_SECRET or admin auth)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      // In production, also check for authenticated admin user
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, supplierId } = body;

    // Validate payout type
    if (!['instant', 'weekly', 'monthly'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid payout type. Must be instant, weekly, or monthly' },
        { status: 400 }
      );
    }

    console.log(`[Payout API] Processing ${type} payouts...`);

    let results;
    
    if (supplierId) {
      // Process single supplier
      const result = await PayoutProcessor.triggerManualPayout(supplierId);
      results = [result];
    } else {
      // Process all eligible suppliers for this type
      results = await PayoutProcessor.processScheduledPayouts(type);
    }

    // Calculate summary
    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      totalAmount: results
        .filter(r => r.success && r.amount)
        .reduce((sum, r) => sum + (r.amount || 0), 0),
    };

    console.log(`[Payout API] Completed: ${summary.successful}/${summary.total} successful`);

    return NextResponse.json({
      success: true,
      type,
      summary,
      results,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Payout API] Error:', error);
    return NextResponse.json(
      { 
        error: 'Payout processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
