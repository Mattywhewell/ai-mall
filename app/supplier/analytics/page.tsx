/**
 * Supplier Analytics Dashboard
 * Revenue, sales, and performance metrics
 */

'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Eye, Users } from 'lucide-react';

interface AnalyticsData {
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  sales: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  views: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    growth: number;
  };
  topProducts: Array<{
    name: string;
    sales: number;
    revenue: number;
    views: number;
  }>;
  recentOrders: Array<{
    date: string;
    amount: number;
  }>;
}

export default function SupplierAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`/api/supplier/analytics?range=${timeRange}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-white mx-auto mb-4"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <p>Failed to load analytics</p>
        </div>
      </div>
    );
  }

  const MetricCard = ({ title, value, growth, icon: Icon, prefix = '', suffix = '' }: any) => (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-400 text-sm">{title}</p>
        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
          <Icon className="text-white" size={20} />
        </div>
      </div>
      <p className="text-3xl font-bold text-white mb-2">
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </p>
      <div className="flex items-center gap-1">
        {growth >= 0 ? (
          <>
            <TrendingUp className="text-green-400" size={16} />
            <span className="text-green-400 text-sm font-medium">+{growth.toFixed(1)}%</span>
          </>
        ) : (
          <>
            <TrendingDown className="text-red-400" size={16} />
            <span className="text-red-400 text-sm font-medium">{growth.toFixed(1)}%</span>
          </>
        )}
        <span className="text-gray-400 text-sm ml-1">vs last period</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Analytics</h1>
              <p className="text-gray-300 mt-2">Track your performance and growth</p>
            </div>
            <div className="flex gap-2">
              {(['week', 'month', 'year'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Total Revenue"
            value={analytics.revenue.thisMonth}
            growth={analytics.revenue.growth}
            icon={DollarSign}
            prefix="$"
          />
          <MetricCard
            title="Total Sales"
            value={analytics.sales.thisMonth}
            growth={analytics.sales.growth}
            icon={ShoppingCart}
          />
          <MetricCard
            title="Product Views"
            value={analytics.views.thisMonth}
            growth={analytics.views.growth}
            icon={Eye}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart Placeholder */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Revenue Trend</h2>
            <div className="h-64 flex items-end gap-2">
              {analytics.recentOrders.slice(0, 7).map((order, index) => {
                const maxAmount = Math.max(...analytics.recentOrders.map(o => o.amount));
                const height = (order.amount / maxAmount) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg transition-all hover:opacity-80"
                      style={{ height: `${height}%` }}
                      title={`$${order.amount}`}
                    ></div>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(order.date).getDate()}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Top Products</h2>
            <div className="space-y-3">
              {analytics.topProducts.map((product, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{product.name}</p>
                    <p className="text-gray-400 text-xs">{product.sales} sales • {product.views} views</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">${product.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-2">Today's Revenue</p>
            <p className="text-2xl font-bold text-white">${analytics.revenue.today.toLocaleString()}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-2">This Week</p>
            <p className="text-2xl font-bold text-white">${analytics.revenue.thisWeek.toLocaleString()}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-2">This Month</p>
            <p className="text-2xl font-bold text-white">${analytics.revenue.thisMonth.toLocaleString()}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-2">Last Month</p>
            <p className="text-2xl font-bold text-white">${analytics.revenue.lastMonth.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
