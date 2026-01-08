'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DigitalProduct {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  price: number;
  currency: string;
  thumbnail_url: string;
  downloads: number;
  rating: number;
  tags: string[];
}

const productTypes = [
  { id: 'all', name: 'All Products', icon: '🎁' },
  { id: 'template', name: 'Templates', icon: '📋' },
  { id: 'brand_kit', name: 'Brand Kits', icon: '🎨' },
  { id: 'guide', name: 'Guides', icon: '📖' },
  { id: 'ritual_kit', name: 'Ritual Kits', icon: '🔮' },
  { id: 'bundle', name: 'Bundles', icon: '📦' },
];

export default function DigitalProductsPage() {
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [showGenerator, setShowGenerator] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [selectedType]);

  async function fetchProducts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedType !== 'all') params.set('type', selectedType);
      
      const res = await fetch(`/api/digital-products/generate?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h1 className="text-5xl font-bold mb-4">
            AI-Generated Digital Products
          </h1>
          <p className="text-xl text-indigo-100 mb-8">
            Instantly created, professionally crafted. Templates, guides, and tools powered by advanced AI.
          </p>
          <button
            onClick={() => setShowGenerator(true)}
            className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold hover:bg-indigo-50 transition shadow-lg"
          >
            ✨ Generate Custom Product
          </button>
        </div>
      </div>

      {/* Product Type Filter */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-3 overflow-x-auto pb-4">
          {productTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-full whitespace-nowrap transition
                ${selectedType === type.id
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }
              `}
            >
              <span className="text-xl">{type.icon}</span>
              <span className="font-medium">{type.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow animate-pulse">
                <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                <div className="bg-gray-200 h-6 rounded mb-2"></div>
                <div className="bg-gray-200 h-4 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-2xl font-semibold mb-2">No products yet</h3>
            <p className="text-gray-600 mb-6">
              Be the first to generate an AI product in this category!
            </p>
            <button
              onClick={() => setShowGenerator(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
            >
              Generate First Product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/digital-products/${product.id}`}
                className="group bg-white rounded-xl shadow-md hover:shadow-xl transition overflow-hidden"
              >
                {/* Thumbnail */}
                <div className="relative h-48 bg-gradient-to-br from-indigo-100 to-purple-100 overflow-hidden">
                  {product.thumbnail_url && (
                    <img
                      src={product.thumbnail_url}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  )}
                  <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-sm font-semibold text-indigo-600">
                    ${product.price}
                  </div>
                  <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white">
                    {product.type.replace('_', ' ')}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-indigo-600 transition">
                    {product.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                    {product.description}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      {product.rating > 0 && (
                        <>
                          <span>⭐ {product.rating.toFixed(1)}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>{product.downloads} downloads</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {product.tags?.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Product Generator Modal */}
      {showGenerator && (
        <ProductGeneratorModal onClose={() => setShowGenerator(false)} />
      )}
    </div>
  );
}

function ProductGeneratorModal({ onClose }: { onClose: () => void }) {
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    type: 'template',
    category: '',
    prompt: '',
    customization: {},
  });

  async function handleGenerate() {
    const router = useRouter();

    if (!formData.prompt) {
      alert('Please describe what you want to create');
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('/api/digital-products/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/digital-products/${data.product.id}`);
      } else {
        alert('Generation failed: ' + data.error);
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate product');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">Generate AI Product</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Product Type */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Product Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="template">Template</option>
                <option value="brand_kit">Brand Kit</option>
                <option value="guide">Guide</option>
                <option value="ritual_kit">Ritual Kit</option>
                <option value="bundle">Curated Bundle</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Category (Optional)
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Business, Wellness, Productivity"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Prompt */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Describe What You Want
              </label>
              <textarea
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                placeholder="e.g., Create a content calendar template for social media creators..."
                rows={4}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full bg-indigo-600 text-white py-4 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating with AI...
                </span>
              ) : (
                '✨ Generate Product'
              )}
            </button>

            {/* Info */}
            <p className="text-sm text-gray-500 text-center">
              Products are generated instantly using GPT-4. You can preview and customize before publishing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
