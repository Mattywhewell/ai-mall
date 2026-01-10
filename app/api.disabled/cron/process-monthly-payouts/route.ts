import { NextRequest, NextResponse } from 'next/server';

/**
 * Cron: Process Monthly Payouts
 * Runs on the 1st of every month at 2:00 AM
 * Schedule: "0 2 1 * *"
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron] Processing monthly payouts...');

    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/suppliers/payouts/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${process.env.CRON_SECRET}`,
      },
      body: JSON.stringify({ type: 'monthly' }),
    });

    const result = await response.json();

    console.log('[Cron] Monthly payouts completed:', result.summary);

    return NextResponse.json({
      success: true,
      type: 'monthly',
      ...result,
    });
  } catch (error) {
    console.error('[Cron] Monthly payout error:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
