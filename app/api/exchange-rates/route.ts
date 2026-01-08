/**
 * Exchange Rate Update API
 * Endpoint to manually trigger rate updates or get current rates
 */

import { NextResponse } from 'next/server';
import { fetchExchangeRates, getExchangeRates } from '@/lib/exchangeRates';

export async function GET() {
  try {
    const rates = await getExchangeRates();
    
    return NextResponse.json({
      success: true,
      rates,
      timestamp: new Date().toISOString(),
      source: 'cache or api',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rates' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const freshRates = await fetchExchangeRates();
    
    if (!freshRates) {
      return NextResponse.json(
        { success: false, error: 'API unavailable' },
        { status: 503 }
      );
    }
    
    return NextResponse.json({
      success: true,
      rates: freshRates,
      timestamp: new Date().toISOString(),
      source: 'fresh api fetch',
      message: 'Rates updated successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update rates' },
      { status: 500 }
    );
  }
}
