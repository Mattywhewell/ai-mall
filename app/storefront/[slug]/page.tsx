'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Storefront {
  id: string;
  vendor_id: string;
  storefront_name: string;
  slug: string;
  brand_identity: {
    colors?: { primary?: string; secondary?: string };
    tagline?: string;
    description?: string;
  };
  storefront_tier: string;
  rating_average: number;
  rating_count: number;
  total_sales_count: number;
  verified: boolean;
  featured: boolean;
  badges: string[];
}

interface Product {
  id: string;
  product_name: string;
  slug: string;
  description: string;
  ai_generated_description: string;
  product_type: string;
  base_price: number;
  currency: string;
  images: string[];
  tags: string[];
  sales_count: number;
  view_count: number;
  favorite_count: number;
  status: string;
}

export default function StorefrontPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [storefront, setStorefront] = useState<Storefront | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStorefront();
  }, [slug]);

  const fetchStorefront = async () => {
    try {
      // Fetch storefront
      const storefrontRes = await fetch(`/api/creator/storefront?slug=${slug}`);
      const storefrontData = await storefrontRes.json();
      
      if (!storefrontRes.ok) {
        throw new Error(storefrontData.error || 'Storefront not found');
      }

      setStorefront(storefrontData.data);

      // Fetch products
      const productsRes = await fetch(`/api/creator/products?storefront_id=${storefrontData.data.id}&status=active`);
      const productsData = await productsRes.json();
      
      if (productsRes.ok) {
        setProducts(productsData.products);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading storefront...</p>
        </div>
      </div>
    );
  }

  if (error || !storefront) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error || 'Storefront not found'}</p>
          <Link href="/" className="text-indigo-600 hover:text-indigo-700">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const primaryColor = storefront.brand_identity.colors?.primary || '#4F46E5';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Storefront Header */}
      <div 
        className="relative py-20 px-4"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}30 100%)`
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-5xl font-bold text-gray-900">{storefront.storefront_name}</h1>
                {storefront.verified && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    ✓ Verified
                  </span>
                )}
                {storefront.featured && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                    ⭐ Featured
                  </span>
                )}
              </div>
              
              {storefront.brand_identity.tagline && (
                <p className="text-xl text-gray-700 mt-2">{storefront.brand_identity.tagline}</p>
              )}
              
              {storefront.brand_identity.description && (
                <p className="text-gray-600 mt-4 max-w-2xl">{storefront.brand_identity.description}</p>
              )}

              {/* Badges */}
              {storefront.badges && storefront.badges.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {storefront.badges.map((badge, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-white border border-gray-200 text-gray-700 text-sm rounded-full"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center space-x-6 mt-6">
                <div>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-gray-900">{storefront.rating_average.toFixed(1)}</span>
                    <span className="text-yellow-500 ml-1">★</span>
                  </div>
                  <p className="text-sm text-gray-600">{storefront.rating_count} reviews</p>
                </div>
                <div className="h-12 w-px bg-gray-300"></div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{storefront.total_sales_count}</div>
                  <p className="text-sm text-gray-600">sales</p>
                </div>
                <div className="h-12 w-px bg-gray-300"></div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{products.length}</div>
                  <p className="text-sm text-gray-600">products</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Products</h2>
          <div className="flex gap-2">
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option>All Products</option>
              <option>Physical</option>
              <option>Digital</option>
              <option>Services</option>
            </select>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option>Sort: Featured</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Most Popular</option>
            </select>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-gray-500 text-lg">No products yet</p>
            <p className="text-gray-400 text-sm mt-2">Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="group bg-white rounded-lg shadow-sm hover:shadow-xl transition-shadow overflow-hidden"
              >
                {/* Product Image */}
                <div className="relative aspect-square bg-gray-200">
                  {product.images && product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.product_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Product Type Badge */}
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium rounded">
                      {product.product_type}
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {product.product_name}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {product.ai_generated_description || product.description}
                  </p>

                  <div className="flex items-center justify-between mt-4">
                    <div>
                      <span className="text-2xl font-bold text-gray-900">
                        ${product.base_price.toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">{product.currency}</span>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      {product.sales_count} sold
                    </div>
                  </div>

                  {/* Tags */}
                  {product.tags && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {product.tags.slice(0, 3).map((tag, index) => (
                        <span 
                          key={index}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Contact/Info Section */}
      <div className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Have questions?</h2>
          <p className="text-gray-600 mb-6">Contact {storefront.storefront_name} directly</p>
          <button 
            className="px-8 py-3 rounded-lg font-bold text-white transition-colors"
            style={{ backgroundColor: primaryColor }}
          >
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
}
