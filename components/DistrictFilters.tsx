'use client';

import { useState } from 'react';
import { SlidersHorizontal, X, Check } from 'lucide-react';
import { Product } from '@/lib/types';

type FilterOptions = {
  priceRange: [number, number];
  categories: string[];
  rating: number;
  sortBy: 'popular' | 'price_low' | 'price_high' | 'newest' | 'rating';
  inStock: boolean;
};

type Props = {
  products: Product[];
  onFilteredProducts: (products: Product[]) => void;
};

export function DistrictFilters({ products, onFilteredProducts }: Props) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    priceRange: [0, 1000],
    categories: [],
    rating: 0,
    sortBy: 'popular',
    inStock: false,
  });

  // Extract unique categories from products
  const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter((c): c is string => Boolean(c))));

  const applyFilters = () => {
    let filtered = [...products];

    // Price filter
    filtered = filtered.filter(
      p => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    );

    // Category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(p => 
        filters.categories.includes(p.category || '')
      );
    }

    // Rating filter
    if (filters.rating > 0) {
      filtered = filtered.filter(p => (p.rating || 0) >= filters.rating);
    }

    // Stock filter
    if (filters.inStock) {
      filtered = filtered.filter(p => p.stock_quantity && p.stock_quantity > 0);
    }

    // Sort
    switch (filters.sortBy) {
      case 'price_low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        filtered.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'popular':
      default:
        // Already sorted or use view count
        break;
    }

    onFilteredProducts(filtered);
    setShowFilters(false);
  };

  const resetFilters = () => {
    setFilters({
      priceRange: [0, 1000],
      categories: [],
      rating: 0,
      sortBy: 'popular',
      inStock: false,
    });
    onFilteredProducts(products);
  };

  const toggleCategory = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const activeFiltersCount = 
    (filters.categories.length > 0 ? 1 : 0) +
    (filters.rating > 0 ? 1 : 0) +
    (filters.inStock ? 1 : 0) +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000 ? 1 : 0);

  return (
    <>
      {/* Filter Button */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-500 transition-colors"
        >
          <SlidersHorizontal className="w-5 h-5 text-gray-600" />
          <span className="font-medium">Filters</span>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Quick Sort */}
        <select
          value={filters.sortBy}
          onChange={(e) => {
            setFilters({ ...filters, sortBy: e.target.value as any });
            applyFilters();
          }}
          className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
        >
          <option value="popular">Most Popular</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
          <option value="newest">Newest First</option>
          <option value="rating">Highest Rated</option>
        </select>

        {activeFiltersCount > 0 && (
          <button
            onClick={resetFilters}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Clear all
          </button>
        )}

        <div className="ml-auto text-sm text-gray-600">
          {products.length} {products.length === 1 ? 'product' : 'products'}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Filter Products</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Price Range */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Price Range</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">Min</label>
                    <input
                      type="number"
                      value={filters.priceRange[0]}
                      onChange={(e) => setFilters({ 
                        ...filters, 
                        priceRange: [Number(e.target.value), filters.priceRange[1]] 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">Max</label>
                    <input
                      type="number"
                      value={filters.priceRange[1]}
                      onChange={(e) => setFilters({ 
                        ...filters, 
                        priceRange: [filters.priceRange[0], Number(e.target.value)] 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Categories */}
              {uniqueCategories.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Categories</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {uniqueCategories.map((category) => category && (
                      <button
                        key={category}
                        onClick={() => toggleCategory(category)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          filters.categories.includes(category)
                            ? 'border-purple-600 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{category}</span>
                          {filters.categories.includes(category) && (
                            <Check className="w-4 h-4" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Rating */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Minimum Rating</h3>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setFilters({ ...filters, rating: rating === filters.rating ? 0 : rating })}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        filters.rating === rating
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="text-yellow-500">★</span>
                        <span className="ml-1 text-sm font-medium">{rating}+</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock Status */}
              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.inStock}
                    onChange={(e) => setFilters({ ...filters, inStock: e.target.checked })}
                    className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium">In Stock Only</span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex space-x-4">
              <button
                onClick={resetFilters}
                className="flex-1 px-6 py-3 border-2 border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Reset All
              </button>
              <button
                onClick={applyFilters}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:shadow-lg transition-all"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
