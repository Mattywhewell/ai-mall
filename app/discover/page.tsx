'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Storefront {
  id: string;
  vendor_id: string;
  storefront_name: string;
  slug: string;
  brand_identity: any;
  storefront_tier: string;
  rating_average: number;
  rating_count: number;
  total_sales_count: number;
  verified: boolean;
  featured: boolean;
  badges: string[];
  location_hall_id: string;
  category: string;
  created_at: string;
}

export default function DiscoverCreatorsPage() {
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');

  useEffect(() => {
    fetchStorefronts();
  }, [selectedCategory, sortBy]);

  const fetchStorefronts = async () => {
    try {
      const response = await fetch('/api/creator/storefront');
      const result = await response.json();
      
      if (result.success) {
        let filtered = result.data || [];
        
        // Apply filters
        if (selectedCategory !== 'all') {
          filtered = filtered.filter((s: Storefront) => 
            s.brand_identity?.category === selectedCategory
          );
        }

        // Apply sorting
        switch (sortBy) {
          case 'rating':
            filtered.sort((a: Storefront, b: Storefront) => 
              b.rating_average - a.rating_average
            );
            break;
          case 'sales':
            filtered.sort((a: Storefront, b: Storefront) => 
              b.total_sales_count - a.total_sales_count
            );
            break;
          case 'newest':
            filtered.sort((a: Storefront, b: Storefront) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            break;
          default:
            // Featured first
            filtered.sort((a: Storefront, b: Storefront) => 
              (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
            );
        }

        setStorefronts(filtered);
      }
    } catch (error) {
      console.error('Failed to fetch storefronts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStorefronts = storefronts.filter(s =>
    s.storefront_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.brand_identity?.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Discover <span className="text-indigo-600">Creators</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Explore unique storefronts from talented creators around AI City
          </p>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search creators..."
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <svg 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="featured">Featured First</option>
              <option value="rating">Highest Rated</option>
              <option value="sales">Most Sales</option>
              <option value="newest">Newest</option>
            </select>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {['all', 'craft', 'digital', 'wellness', 'tech', 'art', 'ritual'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Found <span className="font-bold text-gray-900">{filteredStorefronts.length}</span> creators
          </p>
        </div>

        {/* Storefronts Grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : filteredStorefronts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">No creators found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStorefronts.map((storefront) => (
              <Link
                key={storefront.id}
                href={`/storefront/${storefront.slug}`}
                className="group bg-white rounded-xl shadow-sm hover:shadow-2xl transition-all overflow-hidden"
              >
                {/* Cover Image */}
                <div 
                  className="h-32 bg-gradient-to-br from-indigo-500 to-purple-600"
                  style={{
                    background: storefront.brand_identity?.colors?.primary 
                      ? `linear-gradient(135deg, ${storefront.brand_identity.colors.primary}80 0%, ${storefront.brand_identity.colors.secondary || storefront.brand_identity.colors.primary}50 100%)`
                      : undefined
                  }}
                />

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {storefront.storefront_name}
                      </h3>
                      {storefront.brand_identity?.tagline && (
                        <p className="text-sm text-gray-600 mt-1">
                          {storefront.brand_identity.tagline}
                        </p>
                      )}
                    </div>
                    
                    {storefront.featured && (
                      <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                        ⭐
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center">
                      <span className="text-yellow-500">★</span>
                      <span className="ml-1 font-bold text-gray-900">
                        {storefront.rating_average?.toFixed(1) || '5.0'}
                      </span>
                      <span className="ml-1 text-sm text-gray-500">
                        ({storefront.rating_count || 0})
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {storefront.total_sales_count || 0} sales
                    </div>
                  </div>

                  {/* Description */}
                  {storefront.brand_identity?.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                      {storefront.brand_identity.description}
                    </p>
                  )}

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    {storefront.verified && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        ✓ Verified
                      </span>
                    )}
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded capitalize">
                      {storefront.storefront_tier}
                    </span>
                    {storefront.badges?.slice(0, 2).map((badge, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Want to become a creator?</h2>
          <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">
            Join thousands of creators selling their products and building their brands in AI City
          </p>
          <Link
            href="/creator/apply"
            className="inline-block px-8 py-3 bg-white text-indigo-600 font-bold rounded-lg hover:bg-indigo-50 transition-colors"
          >
            Apply Now →
          </Link>
        </div>
      </div>
    </div>
  );
}
