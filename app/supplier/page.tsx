/**
 * Supplier Dashboard - Main Portal
 * Centralized hub for suppliers to manage their business
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, ShoppingCart, TrendingUp, DollarSign, Eye, AlertCircle, CreditCard } from 'lucide-react';

interface SupplierStats {
  totalProducts: number;
  activeOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalViews: number;
  conversionRate: number;
  lowStockItems: number;
  website?: string; // ✨ Supplier website
  websiteAnalysis?: any; // Website analysis data
  integrationStatus?: string; // Integration status
  stripeConnected?: boolean; // Stripe connection status
  stripeAccountId?: string; // Stripe account ID
}

export default function SupplierDashboard() {
  const [stats, setStats] = useState<SupplierStats>({
    totalProducts: 0,
    activeOrders: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalViews: 0,
    conversionRate: 0,
    lowStockItems: 0,
  });
  const [loading, setLoading] = useState(true);
  const [connectingStripe, setConnectingStripe] = useState(false);

  useEffect(() => {
    fetchSupplierStats();
    checkStripeConnection();
    
    // Check for success/error messages in URL
    let urlParams: URLSearchParams | undefined = undefined;
    if (typeof window !== 'undefined') {
      urlParams = new URLSearchParams(window.location.search);
    }
    if (urlParams.get('success') === 'stripe_connected') {
      alert('✅ Stripe account connected successfully! You can now receive automatic payouts.');
      window.history.replaceState({}, '', '/supplier');
      fetchSupplierStats();
    } else if (urlParams.get('error')) {
      alert('❌ Failed to connect Stripe account. Please try again.');
      window.history.replaceState({}, '', '/supplier');
    }
  }, []);

  const fetchSupplierStats = async () => {
    try {
      const res = await fetch('/api/supplier/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkStripeConnection = async () => {
    try {
      // Mock supplier ID - in production, get from auth session
      const supplierId = 'supplier_123';
      const res = await fetch(`/api/stripe/connect/onboard?supplierId=${supplierId}`);
      if (res.ok) {
        const data = await res.json();
        setStats(prev => ({
          ...prev,
          stripeConnected: data.connected,
          stripeAccountId: data.accountId
        }));
      }
    } catch (error) {
      console.error('Failed to check Stripe connection:', error);
    }
  };

  const connectStripe = async () => {
    setConnectingStripe(true);
    try {
      // Mock supplier ID - in production, get from auth session
      const supplierId = 'supplier_123';
      
      const res = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId })
      });

      if (res.ok) {
        const data = await res.json();
        // Redirect to Stripe OAuth
        window.location.href = data.url;
      } else {
        const error = await res.json();
        alert(`Failed to connect Stripe: ${error.error}`);
      }
    } catch (error) {
      console.error('Connect Stripe error:', error);
      alert('Failed to connect Stripe. Please try again.');
    } finally {
      setConnectingStripe(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-white mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      link: '/supplier/products',
    },
    {
      title: 'Active Orders',
      value: stats.activeOrders,
      icon: ShoppingCart,
      color: 'from-green-500 to-green-600',
      link: '/supplier/orders',
    },
    {
      title: 'Monthly Revenue',
      value: `$${stats.monthlyRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'from-purple-500 to-purple-600',
      link: '/supplier/analytics',
    },
    {
      title: 'Product Views',
      value: stats.totalViews.toLocaleString(),
      icon: Eye,
      color: 'from-orange-500 to-orange-600',
      link: '/supplier/analytics',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-white">Supplier Portal</h1>
          <p className="text-gray-300 mt-2">Manage your products and grow your business</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Website Info Banner */}
        {stats.website && (
          <div className="mb-6 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/50 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-purple-100 font-semibold text-lg mb-2">✨ AI-Enhanced Brand Profile</h3>
                <div className="space-y-2">
                  <p className="text-purple-200 text-sm">
                    <span className="font-medium">Website:</span>{' '}
                    <a href={stats.website} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
                      {stats.website}
                    </a>
                  </p>
                  {stats.websiteAnalysis && (
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                      {stats.websiteAnalysis.brandTone && (
                        <div className="bg-white/10 rounded-lg p-2">
                          <p className="text-xs text-purple-300">Brand Tone</p>
                          <p className="text-sm text-white font-medium capitalize">{stats.websiteAnalysis.brandTone}</p>
                        </div>
                      )}
                      {stats.websiteAnalysis.visualTheme?.mood && (
                        <div className="bg-white/10 rounded-lg p-2">
                          <p className="text-xs text-purple-300">Mood</p>
                          <p className="text-sm text-white font-medium capitalize">{stats.websiteAnalysis.visualTheme.mood}</p>
                        </div>
                      )}
                      {stats.websiteAnalysis.atmosphereInfluence?.hall && (
                        <div className="bg-white/10 rounded-lg p-2">
                          <p className="text-xs text-purple-300">AI City Hall</p>
                          <p className="text-sm text-white font-medium">{stats.websiteAnalysis.atmosphereInfluence.hall}</p>
                        </div>
                      )}
                      {stats.websiteAnalysis.atmosphereInfluence?.street && (
                        <div className="bg-white/10 rounded-lg p-2">
                          <p className="text-xs text-purple-300">Featured Street</p>
                          <p className="text-sm text-white font-medium">{stats.websiteAnalysis.atmosphereInfluence.street}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {stats.integrationStatus === 'complete' && (
                    <p className="text-green-300 text-sm mt-2">
                      ✓ AI Spirits have learned your brand and are promoting your products!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stripe Connect Banner */}
        <div className="mb-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <CreditCard className="w-6 h-6 text-green-300" />
            </div>
            <div className="flex-1">
              <h3 className="text-green-100 font-semibold text-lg mb-2">💳 Payment Account</h3>
              {stats.stripeConnected ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <p className="text-green-200 font-medium">✓ Stripe Connected</p>
                  </div>
                  <p className="text-green-300 text-sm">
                    Account ID: <span className="font-mono text-xs">{stats.stripeAccountId}</span>
                  </p>
                  <p className="text-green-200 text-sm mt-2">
                    🎉 You're all set! Automatic payouts will be processed within 2-3 business days after each sale.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-green-200 text-sm">
                    Connect your Stripe account to receive automatic payouts for your sales. Fast, secure, and fully automated.
                  </p>
                  <div className="flex items-start gap-2 bg-white/5 rounded-lg p-3">
                    <div className="text-yellow-300 text-lg">⚡</div>
                    <div className="flex-1 text-sm text-green-300">
                      <p className="font-medium mb-1">Why connect Stripe?</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Instant setup with OAuth (2 minutes)</li>
                        <li>• Automatic payouts after each order</li>
                        <li>• Full transaction history and analytics</li>
                        <li>• Bank-grade security and compliance</li>
                      </ul>
                    </div>
                  </div>
                  <button
                    onClick={connectStripe}
                    disabled={connectingStripe}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {connectingStripe ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Connecting...
                      </span>
                    ) : (
                      '🔗 Connect Your Stripe Account'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Alert for low stock */}
        {stats.lowStockItems > 0 && (
          <div className="mb-6 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-yellow-400 flex-shrink-0 mt-1" size={20} />
            <div>
              <h3 className="text-yellow-100 font-semibold">Low Stock Alert</h3>
              <p className="text-yellow-200 text-sm mt-1">
                You have {stats.lowStockItems} product{stats.lowStockItems !== 1 ? 's' : ''} with low stock.{' '}
                <Link href="/supplier/products" className="underline">
                  View now
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Link
                key={index}
                href={card.link}
                className="group relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 hover:bg-white/10 transition-all duration-300"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <Icon className="text-white/60" size={24} />
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${card.color}`}>
                      <Icon className="text-white" size={20} />
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-1">{card.title}</p>
                  <p className="text-3xl font-bold text-white">{card.value}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Activity */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <ShoppingCart className="text-green-400" size={20} />
                <div className="flex-1">
                  <p className="text-white text-sm">New order received</p>
                  <p className="text-gray-400 text-xs">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <Package className="text-blue-400" size={20} />
                <div className="flex-1">
                  <p className="text-white text-sm">Product viewed 15 times</p>
                  <p className="text-gray-400 text-xs">1 hour ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <TrendingUp className="text-purple-400" size={20} />
                <div className="flex-1">
                  <p className="text-white text-sm">Sales increased by 12%</p>
                  <p className="text-gray-400 text-xs">Today</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/supplier/products/new"
                className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white text-center hover:shadow-lg hover:scale-105 transition-all"
              >
                <Package className="mx-auto mb-2" size={24} />
                <p className="text-sm font-medium">Add Product</p>
              </Link>
              <Link
                href="/supplier/orders"
                className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-lg text-white text-center hover:shadow-lg hover:scale-105 transition-all"
              >
                <ShoppingCart className="mx-auto mb-2" size={24} />
                <p className="text-sm font-medium">View Orders</p>
              </Link>
              <Link
                href="/supplier/analytics"
                className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg text-white text-center hover:shadow-lg hover:scale-105 transition-all"
              >
                <TrendingUp className="mx-auto mb-2" size={24} />
                <p className="text-sm font-medium">Analytics</p>
              </Link>
              <Link
                href="/supplier/settings"
                className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg text-white text-center hover:shadow-lg hover:scale-105 transition-all"
              >
                <DollarSign className="mx-auto mb-2" size={24} />
                <p className="text-sm font-medium">Payouts</p>
              </Link>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Performance Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-gray-400 text-sm mb-2">Total Revenue</p>
              <p className="text-2xl font-bold text-white">${stats.totalRevenue.toLocaleString()}</p>
              <p className="text-green-400 text-sm mt-1">↑ 15% from last month</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-2">Conversion Rate</p>
              <p className="text-2xl font-bold text-white">{stats.conversionRate.toFixed(1)}%</p>
              <p className="text-green-400 text-sm mt-1">↑ 2.3% from last month</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-2">Avg. Order Value</p>
              <p className="text-2xl font-bold text-white">$127.50</p>
              <p className="text-green-400 text-sm mt-1">↑ 8% from last month</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
