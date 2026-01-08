/**
 * Admin Dashboard for Auto-Listing Review
 * Allows admins to review, approve, reject, and flag products
 */

'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Flag, Eye, TrendingUp, AlertCircle, Clock, Image as ImageIcon } from 'lucide-react';

interface PendingProduct {
  id: string;
  source_url: string;
  supplier_name: string;
  supplier_email: string;
  product_title: string;
  product_price: string;
  similarity_scores: {
    title_image: number;
    description_image: number;
    category_image: number;
  };
  created_at: string;
  extracted_data: any;
}

interface FlaggedProduct {
  id: string;
  title: string;
  flag_reason: string;
  flagged_at: string;
  supplier_name: string;
  supplier_email: string;
  flagged_by_email: string;
}

interface AutoListingStats {
  total_pending: number;
  total_flagged: number;
  today_approved: number;
  today_rejected: number;
  avg_similarity_score: number;
}

export default function AdminAutoListingPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'flagged' | 'stats'>('pending');
  const [pendingProducts, setPendingProducts] = useState<PendingProduct[]>([]);
  const [flaggedProducts, setFlaggedProducts] = useState<FlaggedProduct[]>([]);
  const [stats, setStats] = useState<AutoListingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<PendingProduct | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // In production, these would be actual API calls with admin auth
      // For now, simulating with mock data
      if (activeTab === 'pending') {
        await fetchPendingProducts();
      } else if (activeTab === 'flagged') {
        await fetchFlaggedProducts();
      } else {
        await fetchStats();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingProducts = async () => {
    // Mock data - replace with actual Supabase query
    setPendingProducts([]);
  };

  const fetchFlaggedProducts = async () => {
    // Mock data - replace with actual Supabase query
    setFlaggedProducts([]);
  };

  const fetchStats = async () => {
    // Mock data - replace with actual Supabase query
    setStats({
      total_pending: 12,
      total_flagged: 3,
      today_approved: 8,
      today_rejected: 2,
      avg_similarity_score: 0.82
    });
  };

  const handleApprove = async (productId: string) => {
    try {
      const response = await fetch('/api/admin/approve-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pending_id: productId, notes: reviewNotes })
      });

      if (response.ok) {
        alert('Product approved and published!');
        setSelectedProduct(null);
        setReviewNotes('');
        fetchData();
      }
    } catch (error) {
      console.error('Error approving product:', error);
      alert('Failed to approve product');
    }
  };

  const handleReject = async (productId: string) => {
    if (!reviewNotes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      const response = await fetch('/api/admin/reject-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pending_id: productId, notes: reviewNotes })
      });

      if (response.ok) {
        alert('Product rejected');
        setSelectedProduct(null);
        setReviewNotes('');
        fetchData();
      }
    } catch (error) {
      console.error('Error rejecting product:', error);
      alert('Failed to reject product');
    }
  };

  const handleFlag = async (productId: string, reason: string) => {
    try {
      const response = await fetch('/api/admin/flag-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, reason })
      });

      if (response.ok) {
        alert('Product flagged for review');
        fetchData();
      }
    } catch (error) {
      console.error('Error flagging product:', error);
      alert('Failed to flag product');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Auto-Listing Management</h1>
          <p className="text-gray-600">Review, approve, and manage auto-generated product listings</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.total_pending}</div>
              <div className="text-sm text-gray-600">Pending Review</div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <Flag className="w-8 h-8 text-red-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.total_flagged}</div>
              <div className="text-sm text-gray-600">Flagged Items</div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.today_approved}</div>
              <div className="text-sm text-gray-600">Approved Today</div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.today_rejected}</div>
              <div className="text-sm text-gray-600">Rejected Today</div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {(stats.avg_similarity_score * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">Avg Quality Score</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-4 px-2 border-b-2 font-semibold transition-colors ${
                  activeTab === 'pending'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Pending Approval
              </button>
              <button
                onClick={() => setActiveTab('flagged')}
                className={`py-4 px-2 border-b-2 font-semibold transition-colors ${
                  activeTab === 'flagged'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Flagged Products
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`py-4 px-2 border-b-2 font-semibold transition-colors ${
                  activeTab === 'stats'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Statistics
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading...</p>
              </div>
            ) : (
              <>
                {/* Pending Products Tab */}
                {activeTab === 'pending' && (
                  <div>
                    {pendingProducts.length === 0 ? (
                      <div className="text-center py-12">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h3>
                        <p className="text-gray-600">No products pending review</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pendingProducts.map((product) => (
                          <div key={product.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900 mb-1">{product.product_title}</h3>
                                <p className="text-gray-600 mb-2">by {product.supplier_name}</p>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <span>Price: ${product.product_price}</span>
                                  <span>•</span>
                                  <span>{new Date(product.created_at).toLocaleString()}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-purple-600 mb-1">
                                  {((product.similarity_scores.title_image + 
                                     product.similarity_scores.description_image + 
                                     product.similarity_scores.category_image) / 3 * 100).toFixed(0)}%
                                </div>
                                <div className="text-xs text-gray-500">Quality Score</div>
                              </div>
                            </div>

                            {/* Quality Breakdown */}
                            <div className="grid grid-cols-3 gap-4 mb-4">
                              <div className="bg-blue-50 rounded-lg p-3 text-center">
                                <div className="text-lg font-bold text-blue-600">
                                  {(product.similarity_scores.title_image * 100).toFixed(0)}%
                                </div>
                                <div className="text-xs text-gray-600">Title-Image</div>
                              </div>
                              <div className="bg-green-50 rounded-lg p-3 text-center">
                                <div className="text-lg font-bold text-green-600">
                                  {(product.similarity_scores.description_image * 100).toFixed(0)}%
                                </div>
                                <div className="text-xs text-gray-600">Description-Image</div>
                              </div>
                              <div className="bg-purple-50 rounded-lg p-3 text-center">
                                <div className="text-lg font-bold text-purple-600">
                                  {(product.similarity_scores.category_image * 100).toFixed(0)}%
                                </div>
                                <div className="text-xs text-gray-600">Category-Image</div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-3">
                              <button
                                onClick={() => setSelectedProduct(product)}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                              >
                                <Eye className="w-4 h-4" />
                                <span>Review Details</span>
                              </button>
                              <button
                                onClick={() => handleApprove(product.id)}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center space-x-2"
                              >
                                <CheckCircle className="w-4 h-4" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedProduct(product);
                                  // Scroll to notes section
                                }}
                                className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center space-x-2"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>Reject</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Flagged Products Tab */}
                {activeTab === 'flagged' && (
                  <div>
                    {flaggedProducts.length === 0 ? (
                      <div className="text-center py-12">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No flagged products</h3>
                        <p className="text-gray-600">All products are in good standing</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {flaggedProducts.map((product) => (
                          <div key={product.id} className="border border-red-200 bg-red-50 rounded-lg p-6">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900 mb-1">{product.title}</h3>
                                <p className="text-gray-600 mb-2">by {product.supplier_name}</p>
                              </div>
                              <Flag className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="bg-white rounded-lg p-4 mb-4">
                              <div className="text-sm font-semibold text-gray-700 mb-1">Flag Reason:</div>
                              <p className="text-gray-900">{product.flag_reason}</p>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <span>Flagged by: {product.flagged_by_email}</span>
                              <span>{new Date(product.flagged_at).toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Statistics Tab */}
                {activeTab === 'stats' && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Auto-Listing Performance</h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Approval Rate</div>
                          <div className="text-3xl font-bold text-green-600">
                            {stats ? ((stats.today_approved / (stats.today_approved + stats.today_rejected)) * 100).toFixed(0) : 0}%
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Average Processing Time</div>
                          <div className="text-3xl font-bold text-blue-600">2.3 min</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Scoring Thresholds</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Auto-Approval Threshold</span>
                            <span className="text-sm font-bold text-purple-600">75%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-purple-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">
                          Products with similarity scores above 75% are automatically approved and published.
                          Lower scores require manual review.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Review Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedProduct.product_title}</h2>
                  <p className="text-gray-600">by {selectedProduct.supplier_name}</p>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Full extracted data preview would go here */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Review Notes</h3>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about your decision..."
                  className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  rows={4}
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => handleApprove(selectedProduct.id)}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Approve & Publish</span>
                </button>
                <button
                  onClick={() => handleReject(selectedProduct.id)}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <XCircle className="w-5 h-5" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
