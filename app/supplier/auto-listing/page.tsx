/**
 * Auto-Listing Interface for Suppliers
 * Allows suppliers to automatically create product listings from URLs
 */

'use client';

import { useState } from 'react';
import { Sparkles, Link as LinkIcon, AlertCircle, CheckCircle, Loader, Image as ImageIcon, FileText, Tag } from 'lucide-react';

interface ExtractionResult {
  success: boolean;
  data?: any;
  product_id?: string;
  pending_product_id?: string;
  message?: string;
  warnings?: string[];
  error?: string;
}

export default function AutoListingPage() {
  const [productUrl, setProductUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);

  const handleExtract = async () => {
    if (!productUrl.trim()) {
      alert('Please enter a product URL');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Get supplier ID from session/context (mock for now)
      const supplierId = 'mock-supplier-id'; // In production, get from auth context

      const response = await fetch('/api/auto-listing/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_url: productUrl,
          supplier_id: supplierId
        })
      });

      const data = await response.json();
      setResult(data);

    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'Failed to extract product data'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Sparkles className="w-10 h-10 text-purple-600" />
            <h1 className="text-5xl font-black text-gray-900">Auto-Listing Engine</h1>
          </div>
          <p className="text-xl text-gray-600">
            Instantly create product listings from any URL
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Powered by AI • Extracts all product details automatically
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Product URL
            </label>
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <LinkIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  placeholder="https://example.com/product/awesome-item"
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  disabled={loading}
                />
              </div>
              <button
                onClick={handleExtract}
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Extract</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">How it works:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Paste any product URL from your supplier or source</li>
                  <li>AI extracts title, description, images, price, and specifications</li>
                  <li>Content is enhanced for clarity and SEO</li>
                  <li>Images are validated for quality and relevance</li>
                  <li>Auto-approved products go live immediately</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {result.success ? (
              <div>
                {/* Success Header */}
                <div className="flex items-center space-x-3 mb-6">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {result.data?.status === 'approved' ? 'Product Created!' : 'Pending Review'}
                    </h2>
                    <p className="text-gray-600">{result.message}</p>
                  </div>
                </div>

                {/* Warnings */}
                {result.warnings && result.warnings.length > 0 && (
                  <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-yellow-900 mb-1">Warnings:</p>
                        <ul className="text-sm text-yellow-800 space-y-1">
                          {result.warnings.map((warning, idx) => (
                            <li key={idx}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Product Preview */}
                {result.data && (
                  <div className="space-y-6">
                    {/* Title */}
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText className="w-5 h-5 text-gray-600" />
                        <h3 className="font-semibold text-gray-700">Title</h3>
                      </div>
                      <p className="text-xl font-bold text-gray-900">{result.data.title}</p>
                    </div>

                    {/* Description */}
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText className="w-5 h-5 text-gray-600" />
                        <h3 className="font-semibold text-gray-700">Description</h3>
                      </div>
                      <p className="text-gray-700 whitespace-pre-line">{result.data.description}</p>
                    </div>

                    {/* Price & Category */}
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Price</h3>
                        <p className="text-2xl font-bold text-purple-600">
                          {result.data.price ? `$${result.data.price}` : 'Not available'}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-2">Category</h3>
                        <p className="text-lg text-gray-900">{result.data.category || 'Uncategorized'}</p>
                      </div>
                    </div>

                    {/* Images */}
                    {result.data.images && result.data.images.length > 0 && (
                      <div>
                        <div className="flex items-center space-x-2 mb-3">
                          <ImageIcon className="w-5 h-5 text-gray-600" />
                          <h3 className="font-semibold text-gray-700">
                            Images ({result.data.images.length})
                          </h3>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                          {result.data.images.slice(0, 4).map((img: string, idx: number) => (
                            <div key={idx} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                              <img
                                src={img}
                                alt={result.data.alt_text?.[idx] || `Product image ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {result.data.tags && result.data.tags.length > 0 && (
                      <div>
                        <div className="flex items-center space-x-2 mb-3">
                          <Tag className="w-5 h-5 text-gray-600" />
                          <h3 className="font-semibold text-gray-700">Tags</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {result.data.tags.map((tag: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Similarity Scores */}
                    {result.data.similarity_scores && (
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-3">Quality Scores</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-1">
                              {(result.data.similarity_scores.title_image * 100).toFixed(0)}%
                            </div>
                            <div className="text-sm text-gray-600">Title-Image Match</div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold text-green-600 mb-1">
                              {(result.data.similarity_scores.description_image * 100).toFixed(0)}%
                            </div>
                            <div className="text-sm text-gray-600">Description-Image Match</div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold text-purple-600 mb-1">
                              {(result.data.similarity_scores.category_image * 100).toFixed(0)}%
                            </div>
                            <div className="text-sm text-gray-600">Category-Image Match</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Specifications */}
                    {result.data.specifications && Object.keys(result.data.specifications).length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-3">Specifications</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                            {Object.entries(result.data.specifications).map(([key, value]: [string, any]) => (
                              <div key={key}>
                                <dt className="text-sm font-medium text-gray-500 capitalize">
                                  {key.replace(/_/g, ' ')}
                                </dt>
                                <dd className="text-sm text-gray-900">{String(value)}</dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-8 flex space-x-4">
                  {result.product_id && (
                    <a
                      href={`/supplier/products/${result.product_id}`}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                    >
                      View Product
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setProductUrl('');
                      setResult(null);
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Create Another
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Error */}
                <div className="flex items-center space-x-3 mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Extraction Failed</h2>
                    <p className="text-gray-600">We couldn't extract product data from this URL</p>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{result.error}</p>
                </div>
                <button
                  onClick={() => setResult(null)}
                  className="mt-6 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}

        {/* Feature Highlights */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">AI-Powered Extraction</h3>
            <p className="text-gray-600 text-sm">
              Advanced algorithms extract all product details with high accuracy
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Quality Validation</h3>
            <p className="text-gray-600 text-sm">
              Images and content are verified for quality and relevance
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">SEO Enhancement</h3>
            <p className="text-gray-600 text-sm">
              Descriptions are optimized for search engines and readability
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
