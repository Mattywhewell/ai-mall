'use client';

import { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface GrowthData {
  overview: {
    total_revenue: number;
    avg_daily_revenue: number;
    current_mrr: number;
    projected_arr: number;
    revenue_growth_rate: number;
    user_growth_rate: number;
  };
  daily_metrics: any[];
  customer_segments: {
    whale: number;
    regular: number;
    at_risk: number;
    churned: number;
  };
  total_customers: number;
}

export default function GrowthDashboard() {
  const [data, setData] = useState<GrowthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState(30);
  const [referralCode, setReferralCode] = useState('');
  const [referralStats, setReferralStats] = useState<any>(null);

  useEffect(() => {
    fetchGrowthData();
    fetchReferralData();
  }, [timeframe]);

  async function fetchGrowthData() {
    try {
      const res = await fetch(`/api/growth/metrics?days=${timeframe}`);
      const result = await res.json();
      if (res.ok && !result.error) {
        setData(result);
      } else {
        setData(null);
        setApiError(result.error || 'Failed to load growth data.');
      }
    } catch (error) {
      setData(null);
      setApiError('Failed to fetch growth data.');
      console.error('Failed to fetch growth data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchReferralData() {
    try {
      const userId = 'demo-user'; // Replace with actual user ID
      const res = await fetch(`/api/growth/referrals?user_id=${userId}`);
      const result = await res.json();
      setReferralStats(result);
      if (result.code) setReferralCode(result.code);
    } catch (error) {
      console.error('Failed to fetch referral data:', error);
    }
  }

  async function generateReferralCode() {
    try {
      const res = await fetch('/api/growth/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'demo-user',
          user_email: 'demo@example.com',
        }),
      });
      const result = await res.json();
      setReferralCode(result.code);
      fetchReferralData();
    } catch (error) {
      console.error('Failed to generate referral code:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  const safeDailyMetrics = Array.isArray(data?.daily_metrics) ? data.daily_metrics : [];
  const revenueChartData = {
    labels: safeDailyMetrics.length > 0 ? safeDailyMetrics.slice().reverse().map(m => m?.date ? new Date(m.date).toLocaleDateString() : '') : [],
    datasets: [
      {
        label: 'Daily Revenue',
        data: safeDailyMetrics.length > 0 ? safeDailyMetrics.slice().reverse().map(m => m?.daily_revenue ?? 0) : [],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const safeSegments = data?.customer_segments || { whale: 0, regular: 0, at_risk: 0, churned: 0 };
  const segmentChartData = {
    labels: ['Whales', 'Regular', 'At Risk', 'Churned'],
    datasets: [
      {
        data: [
          safeSegments.whale ?? 0,
          safeSegments.regular ?? 0,
          safeSegments.at_risk ?? 0,
          safeSegments.churned ?? 0,
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
      },
    ],
  };

  // Fallback UI for missing data or API error
  const [apiError, setApiError] = useState<string | null>(null);
  if (!data || typeof data !== 'object' || !('overview' in data)) {
    console.error('GrowthDashboard: Missing or invalid data', data);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2 text-red-600">{apiError || 'Failed to load growth data.'}</div>
          <div className="text-gray-600 mb-4">Please try again later or check your API/database connection.</div>
          {apiError && (
            <pre className="bg-gray-100 text-xs text-left p-4 rounded mt-4 border border-gray-300 max-w-xl mx-auto overflow-x-auto">
              {JSON.stringify(apiError, null, 2)}
            </pre>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Growth Dashboard</h1>
          <p className="text-gray-600">Scale metrics, viral growth, and customer insights</p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex gap-2 mb-8">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setTimeframe(days)}
              className={`px-4 py-2 rounded-lg transition ${
                timeframe === days
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {days} Days
            </button>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow">
            <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
            <div className="text-3xl font-bold text-indigo-600">
              ${data?.overview.total_revenue.toLocaleString()}
            </div>
            <div className={`text-sm mt-2 ${(data?.overview.revenue_growth_rate ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(data?.overview.revenue_growth_rate ?? 0) >= 0 ? '↑' : '↓'} {Math.abs(data?.overview.revenue_growth_rate || 0).toFixed(1)}%
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow">
            <div className="text-sm text-gray-600 mb-1">MRR</div>
            <div className="text-3xl font-bold text-green-600">
              ${data?.overview.current_mrr.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Projected ARR: ${data?.overview.projected_arr.toLocaleString()}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow">
            <div className="text-sm text-gray-600 mb-1">Avg Daily Revenue</div>
            <div className="text-3xl font-bold text-blue-600">
              ${data?.overview.avg_daily_revenue.toLocaleString()}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow">
            <div className="text-sm text-gray-600 mb-1">Total Customers</div>
            <div className="text-3xl font-bold text-purple-600">
              {data?.total_customers.toLocaleString()}
            </div>
            <div className={`text-sm mt-2 ${(data?.overview.user_growth_rate ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(data?.overview.user_growth_rate ?? 0) >= 0 ? '↑' : '↓'} {Math.abs(data?.overview.user_growth_rate || 0).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow">
            <h3 className="text-xl font-bold mb-4">Revenue Trend</h3>
            <Line data={revenueChartData} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>

          <div className="bg-white rounded-xl p-6 shadow">
            <h3 className="text-xl font-bold mb-4">Customer Segments</h3>
            <Doughnut data={segmentChartData} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>
        </div>

        {/* Referral Program */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-8 text-white mb-8">
          <h2 className="text-2xl font-bold mb-4">🚀 Viral Growth - Referral Program</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Your Referral Code</h3>
              {referralCode ? (
                <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                  <div className="text-2xl font-mono font-bold mb-2">{referralCode}</div>
                  <button
                    onClick={() => navigator.clipboard.writeText(referralStats?.share_url)}
                    className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-purple-50 transition"
                  >
                    Copy Share Link
                  </button>
                </div>
              ) : (
                <button
                  onClick={generateReferralCode}
                  className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition"
                >
                  Generate Your Code
                </button>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-4">Your Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                  <div className="text-sm opacity-90">Total Referrals</div>
                  <div className="text-3xl font-bold">{referralStats?.total_uses || 0}</div>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                  <div className="text-sm opacity-90">Conversions</div>
                  <div className="text-3xl font-bold">{referralStats?.conversions || 0}</div>
                </div>
              </div>
              <div className="mt-4 text-sm opacity-90">
                💰 Earn: 500 AI credits per referral<br />
                🎁 Give: $20 off first purchase
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow">
          <h3 className="text-xl font-bold mb-4">Growth Actions</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <button className="bg-indigo-50 text-indigo-700 rounded-lg p-4 text-left hover:bg-indigo-100 transition">
              <div className="font-semibold mb-1">📧 Email Campaign</div>
              <div className="text-sm">Launch targeted email to inactive users</div>
            </button>
            <button className="bg-green-50 text-green-700 rounded-lg p-4 text-left hover:bg-green-100 transition">
              <div className="font-semibold mb-1">🎯 A/B Test</div>
              <div className="text-sm">Test new pricing or features</div>
            </button>
            <button className="bg-purple-50 text-purple-700 rounded-lg p-4 text-left hover:bg-purple-100 transition">
              <div className="font-semibold mb-1">📊 Export Data</div>
              <div className="text-sm">Download growth metrics CSV</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
