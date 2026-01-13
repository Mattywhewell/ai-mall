
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  getAnalyticsSummary,
  getTopProductsByEvent,
  getDistrictPopularity,
} from '@/lib/analytics/tracking';
import { getTrendingProducts } from '@/lib/recommendations/engine';
import {
  getMarketplaceKeywordTrends,
  getMarketplaceCategoryLeaders,
  getAIForecastedSales,
  getAITrendDetection,
  getGlobalSalesByCountry,
  getGlobalSalesByRegion,
  getGlobalTopProducts,
  getGlobalRevenueTrend
} from '@/lib/analytics/dashboard-analytics';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import Link from 'next/link';
import { Eye, ShoppingCart, TrendingUp, DollarSign, Package, Store, Heart } from 'lucide-react';
import { DropshippingOrdersTable } from './DropshippingOrdersTable';
import { CostOptimizationDashboard } from '@/components/ai-cost-optimization-dashboard';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function AdminDashboard() {
  const router = useRouter();

  // Redirect in test_user mode when role is not admin
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('test_user') === 'true' && params.get('role') !== 'admin') {
        // Redirect to home and surface an access-denied flag
        router.replace('/?access_denied=true');
      }
    }
  }, [router]);

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalViews: 0,
    totalClicks: 0,
    totalAddToCarts: 0,
    totalPurchases: 0,
  });
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [districtStats, setDistrictStats] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);


  // Analytics and intelligence state (declare only once)
  const [marketplaceKeywordTrends, setMarketplaceKeywordTrends] = useState<any[]>([]);
  const [marketplaceCategoryLeaders, setMarketplaceCategoryLeaders] = useState<any[]>([]);
  const [aiForecastedSales, setAIForecastedSales] = useState<any>(null);
  const [aiTrendDetection, setAITrendDetection] = useState<any[]>([]);
  const [globalSalesByCountry, setGlobalSalesByCountry] = useState<any[]>([]);
  const [globalSalesByRegion, setGlobalSalesByRegion] = useState<any[]>([]);
  const [globalTopProducts, setGlobalTopProducts] = useState<any[]>([]);
  const [globalRevenueTrend, setGlobalRevenueTrend] = useState<any[]>([]);
  const demoKeyword = 'ai';
  const demoCategory = 'electronics';
  const demoProductId = globalTopProducts[0]?.id;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
            // Fetch marketplace analytics & AI forecasting
            const [keywordTrends, categoryLeaders, forecastedSales, trendDetection] = await Promise.all([
              getMarketplaceKeywordTrends(demoKeyword),
              getMarketplaceCategoryLeaders(demoCategory),
              demoProductId ? getAIForecastedSales(demoProductId) : Promise.resolve(null),
              getAITrendDetection(),
            ]);
            setMarketplaceKeywordTrends(keywordTrends);
            setMarketplaceCategoryLeaders(categoryLeaders);
            setAIForecastedSales(forecastedSales);
            setAITrendDetection(trendDetection);
        // Fetch global market intelligence
        const [countryData, regionData, topProductsData, revenueTrendData] = await Promise.all([
          getGlobalSalesByCountry(),
          getGlobalSalesByRegion(),
          getGlobalTopProducts(5),
          getGlobalRevenueTrend(),
        ]);
        setGlobalSalesByCountry(countryData);
        setGlobalSalesByRegion(regionData);
        setGlobalTopProducts(topProductsData);
        setGlobalRevenueTrend(revenueTrendData);
    setLoading(true);
    try {
      // Fetch summary stats
      const summaryData = await getAnalyticsSummary();
      setSummary(summaryData);

      // Fetch top products by views
      const topViewedProducts = await getTopProductsByEvent('view', 5);
      setTopProducts(topViewedProducts);

      // Fetch district popularity
      const districts = await getDistrictPopularity(5);
      setDistrictStats(districts);

      // Fetch trending products
      const trendingProducts = await getTrendingProducts(5);
      setTrending(trendingProducts);

      // Calculate total revenue
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'completed');

      const revenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      setTotalRevenue(revenue);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading dashboard...</div>
        </div>
      </div>
    );
  
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Aiverse Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
              <button
                onClick={fetchDashboardData}
                className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Link
              href="/admin/products/pending"
              className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Package className="h-8 w-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-blue-900">Review Products</span>
            </Link>
            <Link
              href="/admin/vendors"
              className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Store className="h-8 w-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-green-900">Manage Vendors</span>
            </Link>
            <Link
              href="/admin/payouts"
              className="flex flex-col items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <DollarSign className="h-8 w-8 text-yellow-600 mb-2" />
              <span className="text-sm font-medium text-yellow-900">Process Payouts</span>
            </Link>
            <Link
              href="/admin/revenue"
              className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <TrendingUp className="h-8 w-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-purple-900">View Analytics</span>
            </Link>
            <Link
              href="/admin/collections"
              className="flex flex-col items-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <Heart className="h-8 w-8 text-indigo-600 mb-2" />
              <span className="text-sm font-medium text-indigo-900">Manage Collections</span>
            </Link>
            <Link
              href="/admin/assets"
              className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <Package className="h-8 w-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-orange-900">Manage Assets</span>
            </Link>
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Alerts & Notifications</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                <span className="text-sm text-yellow-800">5 products pending approval</span>
              </div>
              <Link
                href="/admin/products/pending"
                className="text-sm text-yellow-600 hover:text-yellow-800 font-medium"
              >
                Review →
              </Link>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                <span className="text-sm text-blue-800">3 payouts ready for processing</span>
              </div>
              <Link
                href="/admin/payouts"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Process →
              </Link>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                <span className="text-sm text-green-800">System health: All services operational</span>
              </div>
              <Link
                href="/admin/system-health"
                className="text-sm text-green-600 hover:text-green-800 font-medium"
              >
                View Details →
              </Link>
            </div>
          </div>
        </div>

        {/* AI Cost Optimization Dashboard */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <CostOptimizationDashboard />
        </div>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex gap-4">
            <Link
              href="/admin/vendors"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Manage Vendors
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {summary.totalViews.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Add to Carts</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {summary.totalAddToCarts.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <ShoppingCart className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Purchases</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {summary.totalPurchases.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${totalRevenue.toFixed(0)}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <DollarSign className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Products Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Top Products by Views
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="product_name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="event_count" fill="#4F46E5" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* District Popularity Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              District Popularity
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={districtStats}
                  dataKey="total_events"
                  nameKey="microstore_name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {districtStats.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trending Products Table */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Trending Products (Last 7 Days)
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tags
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trending.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${product.price.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.view_count || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {product.tags?.slice(0, 3).map((tag: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Insights Section */}
        <div className="mt-8 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg shadow-md p-6 border border-purple-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            ✨ AI Insights
          </h2>
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              <strong>Conversion Rate:</strong>{' '}
              {summary.totalViews > 0
                ? ((summary.totalPurchases / summary.totalViews) * 100).toFixed(2)
                : 0}
              % (Purchases / Views)
            </p>
            <p>
              <strong>Cart Abandonment:</strong>{' '}
              {summary.totalAddToCarts > 0
                ? (
                    ((summary.totalAddToCarts - summary.totalPurchases) /
                      summary.totalAddToCarts) *
                    100
                  ).toFixed(2)
                : 0}
              %
            </p>
            <p>
              <strong>Recommendation:</strong> {summary.totalViews > summary.totalPurchases * 10
                ? 'Focus on improving product descriptions and social proof to increase conversions.'
                : 'Great conversion rate! Consider expanding your product catalog.'}
            </p>
          </div>
        </div>

        {/* Dropshipping Orders Section */}
        <div className="mt-8 bg-gradient-to-r from-blue-100 to-green-100 rounded-lg shadow-md p-6 border border-blue-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            🚚 Dropshipping Orders (CJdropshipping)
          </h2>
          <DropshippingOrdersTable />
        </div>
      </div>
    </div>
  );
}
