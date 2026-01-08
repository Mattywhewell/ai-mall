'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, TrendingUp, Calendar, Heart } from 'lucide-react';

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  theme: 'wellness' | 'tech' | 'seasonal' | 'trending' | 'personalized';
  curator_personality: string;
  product_ids: string[];
  products: {
    id: string;
    name: string;
    price: number;
    image_url: string;
  }[];
  color_scheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  view_count: number;
  conversion_count: number;
  created_at: string;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useEffect(() => {
    fetchCollections();
  }, [activeFilter]);

  async function fetchCollections() {
    try {
      setLoading(true);
      const theme = activeFilter === 'all' ? '' : activeFilter;
      const response = await fetch(`/api/collections?limit=20&theme=${theme}`);
      const data = await response.json();
      setCollections(data.collections || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  }

  const filters = [
    { id: 'all', label: 'All Collections', icon: Sparkles },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'seasonal', label: 'Seasonal', icon: Calendar },
    { id: 'wellness', label: 'Wellness', icon: Heart },
    { id: 'tech', label: 'Tech', icon: Sparkles }
  ];

  const themeIcons: Record<string, string> = {
    wellness: '🧘',
    tech: '💻',
    seasonal: '🍂',
    trending: '🔥',
    personalized: '✨'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-purple-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Curating collections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="w-12 h-12" />
              <h1 className="text-5xl font-bold">AI-Curated Collections</h1>
            </div>
            <p className="text-xl text-purple-100 max-w-2xl mx-auto">
              Thoughtfully assembled by AI spirits. Each collection tells a story.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-3 justify-center">
          {filters.map(filter => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                  activeFilter === filter.id
                    ? 'bg-purple-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 hover:bg-purple-50 hover:scale-105'
                }`}
              >
                <Icon className="w-4 h-4" />
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Collections Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {collections.length === 0 ? (
          <div className="text-center py-16">
            <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No collections found for this theme.</p>
            <p className="text-gray-400 mt-2">Try selecting a different filter or check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {collections.map(collection => (
              <Link
                key={collection.id}
                href={`/collections/${collection.slug}`}
                className="group"
              >
                <div
                  className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-105"
                  style={{
                    borderTop: `4px solid ${collection.color_scheme?.primary || '#8b5cf6'}`
                  }}
                >
                  {/* Collection Header */}
                  <div
                    className="p-6"
                    style={{
                      background: `linear-gradient(135deg, ${collection.color_scheme?.primary}15 0%, ${collection.color_scheme?.secondary}10 100%)`
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-4xl">{themeIcons[collection.theme] || '✨'}</div>
                      <span className="px-3 py-1 bg-white/80 backdrop-blur rounded-full text-xs font-medium text-gray-700">
                        {collection.products?.length || 0} items
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                      {collection.name}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {collection.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Sparkles className="w-3 h-3" />
                      <span className="italic">Curated by {collection.curator_personality}</span>
                    </div>
                  </div>

                  {/* Product Preview */}
                  {collection.products && collection.products.length > 0 && (
                    <div className="p-4 bg-gray-50">
                      <div className="grid grid-cols-4 gap-2">
                        {collection.products.slice(0, 4).map((product, idx) => (
                          <div
                            key={product.id}
                            className="aspect-square bg-white rounded-lg overflow-hidden shadow-sm"
                          >
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                <span className="text-2xl">
                                  {themeIcons[collection.theme] || '✨'}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Collection Stats */}
                  <div className="px-6 py-4 bg-white border-t flex items-center justify-between text-xs text-gray-500">
                    <span>{collection.view_count || 0} views</span>
                    <span>{collection.conversion_count || 0} purchases</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-center text-white">
          <Sparkles className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Want a Personal Collection?</h2>
          <p className="text-purple-100 mb-6">
            AI can curate a collection just for you based on your preferences
          </p>
          <button
            onClick={() => alert('Sign in to get personalized collections!')}
            className="px-8 py-3 bg-white text-purple-600 rounded-full font-bold hover:scale-105 transition-transform"
          >
            Get My Collection
          </button>
        </div>
      </div>
    </div>
  );
}
