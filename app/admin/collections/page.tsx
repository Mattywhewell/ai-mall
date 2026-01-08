'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Plus, RefreshCw, TrendingUp, Eye, ShoppingBag, DollarSign, Archive, Edit } from 'lucide-react';

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  theme: string;
  status: string;
  product_ids: string[];
  view_count: number;
  click_count: number;
  conversion_count: number;
  revenue_generated: number;
  avg_engagement_score: number;
  created_at: string;
  last_ai_refresh: string;
}

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [curating, setCurating] = useState(false);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  useEffect(() => {
    fetchCollections();
  }, []);

  async function fetchCollections() {
    try {
      setLoading(true);
      // Fetch all collections including archived ones
      const { data } = await (await fetch('/api/collections?limit=50')).json();
      setCollections(data?.collections || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAutoCurate() {
    try {
      setCurating(true);
      const response = await fetch('/api/collections/curate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: 'auto' })
      });

      const data = await response.json();

      if (data.success) {
        alert(`✨ Created ${data.count} new collections!`);
        fetchCollections();
      } else {
        alert('Failed to curate collections');
      }
    } catch (error) {
      console.error('Error curating:', error);
      alert('Error creating collections');
    } finally {
      setCurating(false);
    }
  }

  async function handleRefresh(collectionId: string) {
    try {
      setRefreshing(collectionId);
      const response = await fetch('/api/collections/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionId })
      });

      const data = await response.json();

      if (data.success) {
        alert('Collection refreshed!');
        fetchCollections();
      } else {
        alert(data.message || 'Refresh not needed');
      }
    } catch (error) {
      console.error('Error refreshing:', error);
      alert('Error refreshing collection');
    } finally {
      setRefreshing(null);
    }
  }

  async function handleArchive(slug: string) {
    if (!confirm('Archive this collection?')) return;

    try {
      const response = await fetch(`/api/collections/${slug}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        alert('Collection archived');
        fetchCollections();
      }
    } catch (error) {
      console.error('Error archiving:', error);
      alert('Error archiving collection');
    }
  }

  const stats = {
    total: collections.length,
    active: collections.filter(c => c.status === 'active').length,
    totalViews: collections.reduce((sum, c) => sum + (c.view_count || 0), 0),
    totalRevenue: collections.reduce((sum, c) => sum + (c.revenue_generated || 0), 0),
    avgEngagement: collections.length > 0
      ? collections.reduce((sum, c) => sum + (c.avg_engagement_score || 0), 0) / collections.length
      : 0
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-purple-600" />
                AI Collections Manager
              </h1>
              <p className="text-gray-600 mt-1">Manage AI-curated product collections</p>
            </div>
            <button
              onClick={handleAutoCurate}
              disabled={curating}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {curating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Curating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Auto-Curate New Collections
                </>
              )}
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg p-4 shadow">
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                <Sparkles className="w-4 h-4" />
                Total Collections
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-green-600 mt-1">{stats.active} active</div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow">
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                <Eye className="w-4 h-4" />
                Total Views
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalViews.toLocaleString()}</div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow">
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                <ShoppingBag className="w-4 h-4" />
                Conversions
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {collections.reduce((sum, c) => sum + (c.conversion_count || 0), 0)}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow">
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                <DollarSign className="w-4 h-4" />
                Revenue
              </div>
              <div className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toFixed(0)}</div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow">
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                <TrendingUp className="w-4 h-4" />
                Avg Engagement
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.avgEngagement.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* Collections Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Collection
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Theme
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {collections.map(collection => (
                  <tr key={collection.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{collection.name}</div>
                        <div className="text-sm text-gray-500 line-clamp-1">{collection.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                        {collection.theme}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {collection.product_ids?.length || 0}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-gray-900">{collection.view_count || 0} views</div>
                        <div className="text-gray-500">{collection.conversion_count || 0} purchases</div>
                        <div className="text-green-600">${(collection.revenue_generated || 0).toFixed(0)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        collection.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {collection.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => window.open(`/collections/${collection.slug}`, '_blank')}
                          className="p-1 text-purple-600 hover:text-purple-800"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRefresh(collection.id)}
                          disabled={refreshing === collection.id}
                          className="p-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                          title="Refresh products"
                        >
                          <RefreshCw className={`w-4 h-4 ${refreshing === collection.id ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleArchive(collection.slug)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Archive"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
