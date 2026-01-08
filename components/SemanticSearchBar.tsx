'use client';

import { useState } from 'react';
import { semanticSearch } from '@/lib/ai/semanticSearch';
import { trackSearch } from '@/lib/analytics/tracking';
import { Search } from 'lucide-react';
import { Product } from '@/lib/types';
import ProductCard from './ProductCard';

export default function SemanticSearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setShowResults(true);

    try {
      const searchResults = await semanticSearch(query, 12);
      setResults(searchResults);
      await trackSearch(query, searchResults.length);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products with AI (e.g., 'comfortable running shoes')"
          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={loading}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>
      </form>

      {showResults && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {loading ? 'Searching...' : `Search Results (${results.length})`}
            </h2>
            {results.length > 0 && (
              <button
                onClick={() => {
                  setShowResults(false);
                  setResults([]);
                  setQuery('');
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Clear
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-200 rounded-lg h-96 animate-pulse"
                />
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No products found. Try a different search query.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
