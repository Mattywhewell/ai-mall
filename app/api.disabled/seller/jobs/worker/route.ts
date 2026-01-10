import { NextRequest, NextResponse } from 'next/server';
import { processPendingJobs } from '@/lib/jobs/worker';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 10;
    const sellerId = body.seller_id;

    const result = await processPendingJobs({ limit, sellerId });

    return NextResponse.json(result);
  } catch (err) {
    console.error('Worker unexpected error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}