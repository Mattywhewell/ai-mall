import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/supplier/analytics
 * Get supplier analytics data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'month';

    // Mock analytics data - in production, calculate from database
    const analytics = {
      revenue: {
        today: 1250,
        thisWeek: 5840,
        thisMonth: 15750,
        lastMonth: 13200,
        growth: 19.3,
      },
      sales: {
        today: 12,
        thisWeek: 58,
        thisMonth: 187,
        lastMonth: 165,
        growth: 13.3,
      },
      views: {
        today: 342,
        thisWeek: 1580,
        thisMonth: 3420,
        growth: 24.5,
      },
      topProducts: [
        {
          name: 'Smart Watch Pro',
          sales: 45,
          revenue: 6750,
          views: 892,
        },
        {
          name: 'Wireless Headphones',
          sales: 38,
          revenue: 5700,
          views: 765,
        },
        {
          name: 'Laptop Stand',
          sales: 32,
          revenue: 960,
          views: 654,
        },
        {
          name: 'USB-C Cable',
          sales: 28,
          revenue: 560,
          views: 543,
        },
        {
          name: 'Phone Case',
          sales: 24,
          revenue: 480,
          views: 432,
        },
      ],
      recentOrders: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        amount: Math.floor(Math.random() * 1000) + 200,
      })),
    };

    // Adjust data based on range
    if (range === 'week') {
      analytics.revenue.thisMonth = analytics.revenue.thisWeek;
      analytics.sales.thisMonth = analytics.sales.thisWeek;
    } else if (range === 'year') {
      analytics.revenue.thisMonth *= 12;
      analytics.sales.thisMonth *= 12;
      analytics.views.thisMonth *= 12;
    }

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
