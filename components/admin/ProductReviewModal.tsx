/**
 * Product Review Modal
 * Detailed review interface for pending products
 */

'use client';

import { useState } from 'react';
import { Check, X, Edit, Wand2, ExternalLink, Star, AlertTriangle, Save } from 'lucide-react';

interface PendingProduct {
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
    similarity_scores?: {
      title_image: number;
      description_image: number;
      category_image: number;
    };
  };
  similarity_scores: {
    title_image: number;
    description_image: number;
    category_image: number;
  };
  status: 'pending_review' | 'approved' | 'rejected';
  created_at: string;
  supplier?: {
    business_name: string;
  };
}

interface ProductReviewModalProps {
  product: PendingProduct;
  isOpen: boolean;
  onClose: () => void;
  onAction: () => void;
}

export function ProductReviewModal({ product, isOpen, onClose, onAction }: ProductReviewModalProps) {
  const [editedData, setEditedData] = useState(product.extracted_data);
  const [isEditing, setIsEditing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiImproving, setAiImproving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const getConfidenceScore = (scores: any) => {
    if (!scores) return 0;
    const avg = (scores.title_image + scores.description_image + scores.category_image) / 3;
    return Math.round(avg * 100);
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/products/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pendingProductId: product.id,
          productData: isEditing ? editedData : product.extracted_data
        })
      });

      if (response.ok) {
        console.log('Product approved and published!');
        onAction();
        onClose();
      } else {
        console.error('Failed to approve product');
      }
    } catch (error) {
      console.error('Error approving product');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/products/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pendingProductId: product.id,
          reason: 'Manual review - rejected'
        })
      });

      if (response.ok) {
        console.log('Product rejected');
        onAction();
        onClose();
      } else {
        console.error('Failed to reject product');
      }
    } catch (error) {
      console.error('Error rejecting product');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveEdits = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/products/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pendingProductId: product.id,
          productData: editedData
        })
      });

      if (response.ok) {
        console.log('Changes saved!');
        setIsEditing(false);
        // Update the product data
        product.extracted_data = editedData;
      } else {
        console.error('Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving changes');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAIImprove = async () => {
    setAiImproving(true);
    try {
      const response = await fetch('/api/admin/products/ai-improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productData: editedData
        })
      });

      if (response.ok) {
        const result = await response.json();
        setEditedData(result.improvedData);
        console.log('AI improvements applied!');
      } else {
        console.error('Failed to improve with AI');
      }
    } catch (error) {
      console.error('Error improving with AI');
    } finally {
      setAiImproving(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Review Product</h2>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConfidenceColor(getConfidenceScore(product.similarity_scores)) === 'text-green-600' ? 'bg-green-100 text-green-800' : getConfidenceColor(getConfidenceScore(product.similarity_scores)) === 'text-yellow-600' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                  <Star className="w-3 h-3 mr-1" />
                  {getConfidenceScore(product.similarity_scores)}% confidence
                </span>
                <button
                  onClick={() => window.open(product.source_url, '_blank')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Product Details
              </button>
              <button
                onClick={() => setActiveTab('images')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'images'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Images
              </button>
              <button
                onClick={() => setActiveTab('metadata')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'metadata'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Metadata
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedData.title}
                            onChange={(e) => setEditedData({...editedData, title: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900">{product.extracted_data.title}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editedData.price}
                            onChange={(e) => setEditedData({...editedData, price: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900">${product.extracted_data.price}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        {isEditing ? (
                          <select
                            value={editedData.category}
                            onChange={(e) => setEditedData({...editedData, category: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="electronics">Electronics</option>
                            <option value="clothing">Clothing</option>
                            <option value="home">Home & Garden</option>
                            <option value="sports">Sports</option>
                            <option value="books">Books</option>
                            <option value="other">Other</option>
                          </select>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {product.extracted_data.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
                    {isEditing ? (
                      <textarea
                        value={editedData.description}
                        onChange={(e) => setEditedData({...editedData, description: e.target.value})}
                        rows={8}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Product description..."
                      />
                    ) : (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{product.extracted_data.description}</p>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(isEditing ? editedData.tags : product.extracted_data.tags)?.map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                  {isEditing && (
                    <input
                      type="text"
                      placeholder="Add tags (comma separated)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const newTags = e.currentTarget.value.split(',').map(t => t.trim()).filter(t => t);
                          setEditedData({...editedData, tags: [...(editedData.tags || []), ...newTags]});
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  )}
                </div>
              </div>
            )}

            {activeTab === 'images' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {(isEditing ? editedData.images : product.extracted_data.images)?.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Product image ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                      <div className="absolute top-2 right-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${index === 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                          {index === 0 ? "Main" : `${index + 1}`}
                        </span>
                      </div>
                      {isEditing && (
                        <button
                          onClick={() => {
                            const newImages = editedData.images.filter((_, i) => i !== index);
                            setEditedData({...editedData, images: newImages});
                          }}
                          className="absolute top-2 left-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {isEditing && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Add Image URL</label>
                    <input
                      type="text"
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const url = e.currentTarget.value.trim();
                          if (url) {
                            setEditedData({...editedData, images: [...(editedData.images || []), url]});
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'metadata' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Source Information</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Supplier</label>
                        <p className="text-sm text-gray-900">{product.supplier?.business_name || 'Unknown'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Source URL</label>
                        <a
                          href={product.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {product.source_url}
                        </a>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Created</label>
                        <p className="text-sm text-gray-900">{new Date(product.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">AI Confidence Scores</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Title ↔ Image:</span>
                        <span className={`font-medium ${getConfidenceColor(product.similarity_scores.title_image * 100)}`}>
                          {Math.round(product.similarity_scores.title_image * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Description ↔ Image:</span>
                        <span className={`font-medium ${getConfidenceColor(product.similarity_scores.description_image * 100)}`}>
                          {Math.round(product.similarity_scores.description_image * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Category ↔ Image:</span>
                        <span className={`font-medium ${getConfidenceColor(product.similarity_scores.category_image * 100)}`}>
                          {Math.round(product.similarity_scores.category_image * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSaveEdits}
                    disabled={isProcessing}
                    className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setEditedData(product.extracted_data);
                      setIsEditing(false);
                    }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                </>
              )}

              <button
                onClick={handleAIImprove}
                disabled={aiImproving || !isEditing}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                {aiImproving ? 'Improving...' : 'AI Improve'}
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                <X className="w-4 h-4 mr-2" />
                Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                <Check className="w-4 h-4 mr-2" />
                Approve & Publish
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}