import { NextRequest, NextResponse } from 'next/server';

/**
 * Cron: Process Instant Payouts
 * Runs daily at 6 AM
 * Schedule: 0 6 * * *
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron] Processing instant payouts...');

    // Call the payout processor API
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/suppliers/payouts/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${process.env.CRON_SECRET}`,
      },
      body: JSON.stringify({ type: 'instant' }),
    });

    const result = await response.json();

    console.log('[Cron] Instant payouts completed:', result.summary);

    return NextResponse.json({
      success: true,
      type: 'instant',
      ...result,
    });
  } catch (error) {
    console.error('[Cron] Instant payout error:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
