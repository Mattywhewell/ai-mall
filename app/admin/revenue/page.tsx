'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Users, Sparkles, Target, Package, Zap } from 'lucide-react';
import Link from 'next/link';

interface RevenueMetrics {
  totalRevenue: number;
  revenueGrowth: number;
  averageOrderValue: number;
  aovGrowth: number;
  conversionRate: number;
  conversionGrowth: number;
  activeProducts: number;
  bundleRevenue: number;
}

interface AIInsight {
  type: 'opportunity' | 'warning' | 'success';
  title: string;
  description: string;
  action?: string;
  impact: 'high' | 'medium' | 'low';
}

export default function RevenueAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const response = await fetch('/api/revenue/analytics');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setMetrics(data.metrics);
      setInsights(data.insights);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading revenue analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Revenue Analytics</h1>
              <p className="text-gray-600 mt-1">AI-driven insights to maximize profit</p>
            </div>
            <Link
              href="/admin/dashboard"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Revenue"
            value={`$${metrics?.totalRevenue.toLocaleString() || 0}`}
            change={metrics?.revenueGrowth || 0}
            icon={<DollarSign className="text-green-600" size={24} />}
          />
          <MetricCard
            title="Average Order Value"
            value={`$${metrics?.averageOrderValue.toFixed(2) || 0}`}
            change={metrics?.aovGrowth || 0}
            icon={<ShoppingCart className="text-blue-600" size={24} />}
          />
          <MetricCard
            title="Conversion Rate"
            value={`${metrics?.conversionRate.toFixed(2) || 0}%`}
            change={metrics?.conversionGrowth || 0}
            icon={<Target className="text-purple-600" size={24} />}
          />
          <MetricCard
            title="Bundle Revenue"
            value={`$${metrics?.bundleRevenue.toLocaleString() || 0}`}
            change={15}
            icon={<Package className="text-orange-600" size={24} />}
          />
        </div>

        {/* AI Insights */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="text-yellow-500" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">AI-Generated Insights</h2>
          </div>

          <div className="space-y-4">
            {insights.map((insight, idx) => (
              <InsightCard key={idx} insight={insight} />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ActionCard
            title="Optimize Merchandising"
            description="Run AI-powered product reordering"
            icon={<Zap className="text-yellow-600" size={24} />}
            action="optimize-merchandising"
          />
          <ActionCard
            title="Generate Bundles"
            description="Create revenue-optimizing bundles"
            icon={<Package className="text-purple-600" size={24} />}
            action="generate-bundles"
          />
          <ActionCard
            title="Content Optimization"
            description="Rewrite descriptions for conversion"
            icon={<TrendingUp className="text-green-600" size={24} />}
            action="optimize-content"
          />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, change, icon }: any) {
  const isPositive = change >= 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-600">{title}</span>
        {icon}
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-2">{value}</div>
      <div className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        <TrendingUp size={16} className="mr-1" />
        <span>{isPositive ? '+' : ''}{change.toFixed(1)}% vs last period</span>
      </div>
    </div>
  );
}

function InsightCard({ insight }: { insight: AIInsight }) {
  const colors = {
    opportunity: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    success: 'bg-blue-50 border-blue-200'
  };

  const iconColors = {
    opportunity: 'text-green-600',
    warning: 'text-yellow-600',
    success: 'text-blue-600'
  };

  const impactBadges = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-orange-100 text-orange-800',
    low: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className={`p-4 rounded-lg border ${colors[insight.type]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className={iconColors[insight.type]} size={20} />
            <h3 className="font-semibold text-gray-900">{insight.title}</h3>
            <span className={`px-2 py-1 text-xs font-medium rounded ${impactBadges[insight.impact]}`}>
              {insight.impact.toUpperCase()} IMPACT
            </span>
          </div>
          <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
          {insight.action && (
            <button className="text-sm text-indigo-600 font-medium hover:text-indigo-800">
              {insight.action} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionCard({ title, description, icon, action }: any) {
  const [running, setRunning] = useState(false);

  async function runAction() {
    setRunning(true);
    try {
      const response = await fetch('/api/revenue/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      alert(`${title} completed successfully!`);
    } catch (error) {
      alert('Action failed. Please try again.');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-gray-600 mb-4">{description}</p>
      <button
        onClick={runAction}
        disabled={running}
        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        {running ? 'Running...' : 'Run Now'}
      </button>
    </div>
  );
}
