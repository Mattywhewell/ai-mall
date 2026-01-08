'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowLeft, ShoppingCart, Heart, Share2, TrendingUp } from 'lucide-react';
import ProductCard from '@/components/ProductCard';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  tags: string[];
  microstore_id: string;
}

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  theme: string;
  curator_personality: string;
  curation_reasoning: {
    summary: string;
    emotionalJourney?: string;
    userBenefits?: string[];
  };
  products: Product[];
  color_scheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  view_count: number;
  conversion_count: number;
  revenue_generated: number;
  created_at: string;
}

export default function CollectionDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  
  if (!slug) {
    return <div>Collection not found</div>;
  }

  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchCollection();
    }
  }, [slug]);

  async function fetchCollection() {
    try {
      setLoading(true);
      const response = await fetch(`/api/collections/${slug}`);
      const data = await response.json();
      
      if (data.collection) {
        setCollection(data.collection);
      }
    } catch (error) {
      console.error('Error fetching collection:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleShare() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share && collection && url) {
      navigator.share({
        title: collection.name,
        text: collection.description,
        url,
      }).catch(() => {});
    } else if (url && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    } else {
      alert('Share not available in this environment.');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-purple-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Collection Not Found</h1>
          <p className="text-gray-600 mb-6">This collection may have been archived or doesn't exist.</p>
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-full font-bold hover:scale-105 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Collections
          </Link>
        </div>
      </div>
    );
  }

  const totalValue = collection.products.reduce((sum, p) => sum + p.price, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Hero Section */}
      <div
        className="relative py-20 text-white"
        style={{
          background: `linear-gradient(135deg, ${collection.color_scheme.primary} 0%, ${collection.color_scheme.secondary} 100%)`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Collections
          </Link>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-8 h-8" />
                <span className="px-4 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium">
                  {collection.theme.charAt(0).toUpperCase() + collection.theme.slice(1)} Collection
                </span>
              </div>
              <h1 className="text-5xl font-bold mb-4">{collection.name}</h1>
              <p className="text-xl text-white/90 mb-6">{collection.description}</p>
              
              <div className="flex items-center gap-2 text-sm text-white/80 mb-6">
                <Sparkles className="w-4 h-4" />
                <span className="italic">Curated by {collection.curator_personality}</span>
              </div>

              {collection.curation_reasoning?.summary && (
                <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-6">
                  <p className="text-white/90 italic">
                    "{collection.curation_reasoning.summary}"
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setSaved(!saved)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                    saved
                      ? 'bg-white text-purple-600'
                      : 'bg-white/20 backdrop-blur text-white hover:bg-white/30'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
                  {saved ? 'Saved' : 'Save Collection'}
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur rounded-full font-medium text-white hover:bg-white/30 transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </div>

            {/* Collection Stats */}
            <div className="bg-white/10 backdrop-blur rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-6">Collection Highlights</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Products</span>
                  <span className="text-2xl font-bold">{collection.products.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Total Value</span>
                  <span className="text-2xl font-bold">${totalValue.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Views</span>
                  <span className="text-xl font-medium">{collection.view_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Purchases</span>
                  <span className="text-xl font-medium flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {collection.conversion_count}
                  </span>
                </div>
              </div>

              {collection.curation_reasoning?.userBenefits && (
                <div className="mt-6 pt-6 border-t border-white/20">
                  <h4 className="font-semibold mb-3">What You'll Get:</h4>
                  <ul className="space-y-2">
                    {collection.curation_reasoning.userBenefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-white/90">
                        <Sparkles className="w-3 h-3 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Emotional Journey (if available) */}
      {collection.curation_reasoning?.emotionalJourney && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              The Experience
            </h3>
            <p className="text-gray-700 text-lg leading-relaxed">
              {collection.curation_reasoning.emotionalJourney}
            </p>
          </div>
        </div>
      )}

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Collection Items</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {collection.products.map((product: any) => (
            <ProductCard 
              key={product.id} 
              product={{
                ...product,
                created_at: product.created_at || new Date().toISOString()
              }} 
            />
          ))}
        </div>
      </div>

      {/* Add All to Cart CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div
          className="rounded-2xl p-8 text-center text-white"
          style={{
            background: `linear-gradient(135deg, ${collection.color_scheme.primary} 0%, ${collection.color_scheme.accent} 100%)`
          }}
        >
          <ShoppingCart className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Love This Collection?</h3>
          <p className="text-white/90 mb-6">Get everything from this curated set</p>
          <button
            className="px-8 py-4 bg-white text-purple-600 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-lg"
            onClick={() => {
              // Add all products to cart
              alert('Adding all items to cart...');
            }}
          >
            Add All to Cart (${totalValue.toFixed(2)})
          </button>
        </div>
      </div>
    </div>
  );
}
