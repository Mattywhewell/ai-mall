'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { Product, Microstore } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Filter, SlidersHorizontal, TrendingUp, Star, ShoppingBag, Store, User } from 'lucide-react';
import { VoiceAndImageSearch } from '@/components/VoiceAndImageSearch';

type SearchResult = {
  products: Product[];
  districts: Microstore[];
  totalResults: number;
};

type FilterState = {
  category: string;
  minPrice: number;
  maxPrice: number;
  rating: number;
  sortBy: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'popular';
};

export default function SearchClient() {
  const searchParams = useSearchParams();
  const query = searchParams?.get('q') || '';
  const router = useRouter();
  
  const [results, setResults] = useState<SearchResult>({ products: [], districts: [], totalResults: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'products' | 'districts'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    category: '',
    minPrice: 0,
    maxPrice: 10000,
    rating: 0,
    sortBy: 'relevance',
  });

  const categories = ['Electronics', 'Fashion', 'Home', 'Beauty', 'Sports', 'Books', 'Food', 'Toys'];
  const trendingSearches = ['Smart Home', 'Wireless Earbuds', 'Yoga Mat', 'Coffee Maker', 'Desk Chair'];

  useEffect(() => {
    async function performSearch() {
      if (!query) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Search products
        let productQuery = supabase
          .from('products')
          .select('*')
          .or(`name.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`);

        // Apply filters
        if (filters.category) {
          productQuery = productQuery.eq('category', filters.category);
        }
        if (filters.minPrice > 0) {
          productQuery = productQuery.gte('price', filters.minPrice);
        }
        if (filters.maxPrice < 10000) {
          productQuery = productQuery.lte('price', filters.maxPrice);
        }

        // Apply sorting
        switch (filters.sortBy) {
          case 'price_asc':
            productQuery = productQuery.order('price', { ascending: true });
            break;
          case 'price_desc':
            productQuery = productQuery.order('price', { ascending: false });
            break;
          case 'newest':
            productQuery = productQuery.order('created_at', { ascending: false });
            break;
          default:
            productQuery = productQuery.order('name', { ascending: true });
        }

        const { data: products, error: productError } = await productQuery.limit(50);

        // Search districts
        const { data: districts, error: districtError } = await supabase
          .from('microstores')
          .select('*')
          .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
          .limit(20);

        if (productError) console.error('Product search error:', productError);
        if (districtError) console.error('District search error:', districtError);

        const totalResults = (products?.length || 0) + (districts?.length || 0);

        setResults({
          products: products || [],
          districts: districts || [],
          totalResults,
        });
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }

    performSearch();
  }, [query, filters]);

  const filteredResults = () => {
    switch (activeTab) {
      case 'products':
        return { ...results, districts: [] };
      case 'districts':
        return { ...results, products: [] };
      default:
        return results;
    }
  };

  const currentResults = filteredResults();

  if (!query) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Search Alverse</h1>
            <p className="text-gray-600">Discover products, districts, and creators</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Trending Searches</h2>
            <div className="flex flex-wrap gap-3">
              {trendingSearches.map((search) => (
                <Link
                  key={search}
                  href={`/search?q=${encodeURIComponent(search)}`}
                  className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors flex items-center space-x-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>{search}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Search results for "{query}"
          </h1>
          <p className="text-gray-600">
            {loading ? 'Searching...' : `${currentResults.totalResults} results found`}
          </p>
        </div>

        {/* Search Controls with Voice & Image */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center space-x-4">
            <VoiceAndImageSearch
              onSearchQueryChange={(newQuery) => {
                // Use router push to update URL and trigger search without full reload
                router.push(`/search?q=${encodeURIComponent(newQuery)}`);
              }}
              onImageSearch={(imageUrl) => {
                // In production: send to AI vision API to analyze and get keywords
                console.log('Image search:', imageUrl);
              }}
            />
            <div className="text-sm text-gray-500">
              Try voice or image search for better results!
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              All ({results.totalResults})
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'products'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Products ({results.products.length})
            </button>
            <button
              onClick={() => setActiveTab('districts')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'districts'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Districts ({results.districts.length})
            </button>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-sm font-medium">Filters</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Filters</h3>

                {/* Category Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat.toLowerCase()}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={filters.minPrice}
                      onChange={(e) => setFilters({ ...filters, minPrice: Number(e.target.value) })}
                      placeholder="Min"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <span>-</span>
                    <input
                      type="number"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
                      placeholder="Max"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                {/* Sort By */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="newest">Newest First</option>
                    <option value="popular">Most Popular</option>
                  </select>
                </div>

                <button
                  onClick={() => setFilters({
                    category: '',
                    minPrice: 0,
                    maxPrice: 10000,
                    rating: 0,
                    sortBy: 'relevance',
                  })}
                  className="w-full px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Searching...</p>
              </div>
            ) : currentResults.totalResults === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600 mb-6">
                  Try different keywords or browse our trending searches
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {trendingSearches.map((search) => (
                    <Link
                      key={search}
                      href={`/search?q=${encodeURIComponent(search)}`}
                      className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors"
                    >
                      {search}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Districts Results */}
                {currentResults.districts.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <Store className="w-5 h-5 mr-2" />
                      Districts
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {currentResults.districts.map((district) => (
                        <Link
                          key={district.id}
                          href={`/districts/${district.slug}`}
                          className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 flex items-start space-x-4"
                        >
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Store className="w-8 h-8 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900">{district.name}</h3>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {district.description}
                            </p>
                            <span className="text-xs text-purple-600 mt-1 inline-block">
                              {district.category}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Products Results */}
                {currentResults.products.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <ShoppingBag className="w-5 h-5 mr-2" />
                      Products
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {currentResults.products.map((product) => (
                        <Link
                          key={product.id}
                          href={`/products/${product.id}`}
                          className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
                        >
                          <div className="relative h-48 bg-gray-100">
                            {product.image_url ? (
                              <Image
                                src={product.image_url}
                                alt={product.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <ShoppingBag className="w-12 h-12 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">
                              {product.name}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                              {product.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-purple-600">
                                ${product.price.toFixed(2)}
                              </span>
                              {product.rating && (
                                <div className="flex items-center space-x-1 text-sm text-gray-600">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  <span>{product.rating}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
