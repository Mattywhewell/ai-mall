/**
 * Admin Dashboard - Rejected Products
 * View products that were rejected during review
 */

'use client';

import { useState, useEffect } from 'react';
import { Search, RotateCcw, Trash2, AlertTriangle } from 'lucide-react';

interface RejectedProduct {
  id: string;
  supplier_id: string;
  source_url: string;
  extracted_data: {
    title: string;
    description: string;
    price: string;
    images: string[];
    category: string;
    tags: string[];
  };
  status: 'rejected';
  reviewed_at: string;
  review_notes: string;
  supplier?: {
    business_name: string;
  };
}

export default function RejectedProductsPage() {
  const [products, setProducts] = useState<RejectedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRejectedProducts();
  }, []);

  const fetchRejectedProducts = async () => {
    try {
      const response = await fetch('/api/admin/products/rejected');
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch rejected products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.extracted_data.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.extracted_data.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRestore = async (productId: string) => {
    try {
      const response = await fetch('/api/admin/products/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingProductId: productId })
      });

      if (response.ok) {
        fetchRejectedProducts();
      }
    } catch (error) {
      console.error('Failed to restore product:', error);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to permanently delete this rejected product?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/products/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingProductId: productId })
      });

      if (response.ok) {
        fetchRejectedProducts();
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rejected Products</h1>
          <p className="text-gray-600">Products that were rejected during review</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            {filteredProducts.length} rejected
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium flex items-center">
            <Search className="w-5 h-5 mr-2" />
            Search Rejected Products
          </h3>
        </div>
        <div className="p-6">
          <input
            type="text"
            placeholder="Search by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">Rejected Products ({filteredProducts.length})</h3>
        </div>
        <div className="p-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rejected</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <img
                        src={product.extracted_data.images?.[0] || '/placeholder-product.png'}
                        alt={product.extracted_data.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div>
                        <div className="font-medium">{product.extracted_data.title}</div>
                        <div className="text-sm text-gray-500">
                          ${product.extracted_data.price}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.supplier?.business_name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(product.reviewed_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="max-w-xs truncate" title={product.review_notes}>
                      {product.review_notes || 'No reason provided'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleRestore(product.id)}
                        title="Restore to pending review"
                        className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        title="Permanently delete"
                        className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No rejected products found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}