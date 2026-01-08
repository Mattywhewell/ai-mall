'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface RevenueStats {
  pillar1_digital_products: { revenue: number; sales: number };
  pillar2_subscriptions: { revenue: number; active: number };
  pillar3_marketplace_fees: { revenue: number; transactions: number };
  pillar4_onboarding: { revenue: number; purchases: number };
  pillar5_credits: { revenue: number; purchased: number };
  pillar6_ads: { revenue: number; campaigns: number };
  total_revenue: number;
}

export default function RevenueOverviewPage() {
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');

  useEffect(() => {
    fetchStats();
  }, [timeframe]);

  async function fetchStats() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/revenue-overview?timeframe=${timeframe}`);
      const data = await res.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch revenue stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const pillars = [
    {
      id: 1,
      name: 'AI Digital Products',
      icon: '🎨',
      color: 'from-purple-500 to-pink-500',
      revenue: stats?.pillar1_digital_products?.revenue || 0,
      metric: `${stats?.pillar1_digital_products?.sales || 0} sales`,
      link: '/digital-products',
      status: 'live',
    },
    {
      id: 2,
      name: 'Subscriptions',
      icon: '💳',
      color: 'from-blue-500 to-cyan-500',
      revenue: stats?.pillar2_subscriptions?.revenue || 0,
      metric: `${stats?.pillar2_subscriptions?.active || 0} active`,
      link: '/pricing',
      status: 'live',
    },
    {
      id: 3,
      name: 'Marketplace Fees',
      icon: '💰',
      color: 'from-green-500 to-emerald-500',
      revenue: stats?.pillar3_marketplace_fees?.revenue || 0,
      metric: `${stats?.pillar3_marketplace_fees?.transactions || 0} transactions`,
      link: '/api/marketplace/revenue',
      status: 'live',
    },
    {
      id: 4,
      name: 'Supplier Onboarding',
      icon: '🏢',
      color: 'from-orange-500 to-red-500',
      revenue: stats?.pillar4_onboarding?.revenue || 0,
      metric: `${stats?.pillar4_onboarding?.purchases || 0} upgrades`,
      link: '/vendor-registration',
      status: 'live',
    },
    {
      id: 5,
      name: 'AI Credits',
      icon: '⚡',
      color: 'from-yellow-500 to-orange-500',
      revenue: stats?.pillar5_credits?.revenue || 0,
      metric: `${stats?.pillar5_credits?.purchased || 0} purchased`,
      link: '/credits',
      status: 'live',
    },
    {
      id: 6,
      name: 'Featured Ads',
      icon: '📢',
      color: 'from-pink-500 to-rose-500',
      revenue: stats?.pillar6_ads?.revenue || 0,
      metric: `${stats?.pillar6_ads?.campaigns || 0} campaigns`,
      link: '/supplier/advertising',
      status: 'live',
    },
    {
      id: 7,
      name: 'White-Label',
      icon: '🏷️',
      color: 'from-indigo-500 to-purple-500',
      revenue: 0,
      metric: 'Coming soon',
      link: '#',
      status: 'planned',
    },
    {
      id: 8,
      name: 'Affiliates',
      icon: '🤝',
      color: 'from-teal-500 to-green-500',
      revenue: 0,
      metric: 'Coming soon',
      link: '#',
      status: 'planned',
    },
    {
      id: 9,
      name: 'AI Citizens',
      icon: '🤖',
      color: 'from-violet-500 to-purple-500',
      revenue: 0,
      metric: 'Coming soon',
      link: '#',
      status: 'planned',
    },
    {
      id: 10,
      name: 'Analytics API',
      icon: '📊',
      color: 'from-cyan-500 to-blue-500',
      revenue: 0,
      metric: 'Coming soon',
      link: '#',
      status: 'planned',
    },
  ];

  const totalRevenue = stats?.total_revenue || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Revenue Overview</h1>
          <p className="text-gray-600">All 10 monetization pillars in one view</p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex gap-2 mb-8">
          {['7d', '30d', '90d', 'all'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-2 rounded-lg transition ${
                timeframe === tf
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tf === 'all' ? 'All Time' : tf.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Total Revenue Card */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white mb-8 shadow-2xl">
          <div className="text-sm font-medium mb-2 opacity-90">Total Revenue</div>
          <div className="text-6xl font-bold mb-2">
            ${loading ? '...' : totalRevenue.toLocaleString()}
          </div>
          <div className="text-indigo-100">Across all revenue streams</div>
        </div>

        {/* Revenue Pillars Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map((pillar) => (
            <Link
              key={pillar.id}
              href={pillar.link}
              className={`relative bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition group ${
                pillar.status === 'planned' ? 'opacity-60' : ''
              }`}
            >
              {/* Status Badge */}
              {pillar.status === 'live' && (
                <div className="absolute top-3 right-3 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                  LIVE
                </div>
              )}

              {/* Icon */}
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${pillar.color} flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition`}>
                {pillar.icon}
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold mb-2">{pillar.name}</h3>
              
              {/* Revenue */}
              <div className="text-3xl font-bold text-gray-900 mb-2">
                ${loading ? '...' : pillar.revenue.toLocaleString()}
              </div>

              {/* Metric */}
              <div className="text-sm text-gray-600">{pillar.metric}</div>

              {/* Arrow */}
              {pillar.status === 'live' && (
                <div className="mt-4 text-indigo-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                  View Details
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-12 bg-gray-50 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <button className="bg-white rounded-lg p-4 text-left hover:shadow-md transition">
              <div className="text-sm text-gray-600 mb-1">Generate</div>
              <div className="font-semibold">New Digital Product</div>
            </button>
            <button className="bg-white rounded-lg p-4 text-left hover:shadow-md transition">
              <div className="text-sm text-gray-600 mb-1">Create</div>
              <div className="font-semibold">Ad Campaign</div>
            </button>
            <button className="bg-white rounded-lg p-4 text-left hover:shadow-md transition">
              <div className="text-sm text-gray-600 mb-1">View</div>
              <div className="font-semibold">Payout Schedule</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
