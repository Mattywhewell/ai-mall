/**
 * Street Page Component
 * Navigational pathways connecting Halls to Districts
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Map, TrendingUp, ArrowRight, Store, Sparkles } from 'lucide-react';
import { Street, AISpirit } from '@/lib/types/world';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';

export default function StreetPage() {
  const params = useParams();
  const streetSlug = params?.street as string;

  const [street, setStreet] = useState<Street | null>(null);
  const [spirit, setSpirit] = useState<AISpirit | null>(null);
  const [districts, setDistricts] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (streetSlug) {
      fetchStreetData();
    }
  }, [streetSlug]);

  const fetchStreetData = async () => {
    try {
      const res = await fetch(`/api/world/streets/${streetSlug}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      
      setStreet(data.street);
      setSpirit(data.spirit);
      setDistricts(data.districts);
      setFeaturedProducts(data.featured_products);
    } catch (error) {
      console.error('Failed to fetch street:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center text-white">
          <Map className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p>Navigating street...</p>
        </div>
      </div>
    );
  }

  if (!street) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="text-center">
          <h1 className="text-3xl mb-4">Street Not Found</h1>
          <Link href="/" className="text-indigo-400 hover:text-indigo-300">
            Return to City
          </Link>
        </div>
      </div>
    );
  }

  const getPersonalityStyle = () => {
    const styles: Record<string, { bg: string; accent: string }> = {
      neon: { bg: 'from-purple-950 via-pink-900 to-blue-950', accent: 'text-pink-400' },
      artisan: { bg: 'from-amber-950 via-orange-900 to-yellow-950', accent: 'text-amber-400' },
      wellness: { bg: 'from-green-950 via-emerald-900 to-teal-950', accent: 'text-emerald-400' },
      tech: { bg: 'from-blue-950 via-indigo-900 to-gray-950', accent: 'text-blue-400' },
      vintage: { bg: 'from-gray-900 via-stone-800 to-neutral-950', accent: 'text-stone-400' },
    };
    return styles[street.personality] || styles.tech;
  };

  const style = getPersonalityStyle();

  return (
    <div className={`min-h-screen bg-gradient-to-br ${style.bg} text-white`}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Navigation */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/" className="hover:opacity-70 transition">
              <span className="opacity-70">City</span>
            </Link>
            <span className="mx-2 opacity-50">/</span>
            <span className="font-semibold">{street.name}</span>
          </div>

          {street.trending && (
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-300 rounded-full">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-semibold">Trending</span>
            </div>
          )}
        </div>

        {/* Street Header */}
        <div className="mb-16">
          <div className="inline-block px-4 py-2 bg-white/10 backdrop-blur-lg rounded-full mb-6">
            <span className="text-sm uppercase tracking-wider">{street.personality} Street</span>
          </div>

          <h1 className={`text-6xl md:text-8xl font-bold mb-6 ${style.accent}`}>
            {street.name}
          </h1>

          <div className="flex items-center gap-6 text-lg opacity-70 mb-8">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              <span>{districts.length} Districts</span>
            </div>
            <div className="flex items-center gap-2">
              <Map className="w-5 h-5" />
              <span>Popularity: {street.popularity_score}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {street.atmosphere_tags.map((tag, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-white/10 backdrop-blur-lg rounded-full text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* AI Spirit */}
        {spirit && (
          <div className="mb-16 max-w-3xl">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-6 h-6 opacity-70" />
                <h2 className="text-xl font-bold">{spirit.name}</h2>
              </div>
              <p className="text-lg opacity-90 mb-6">
                "{spirit.greeting}"
              </p>
              <div className="space-y-2">
                {spirit.insights.map((insight, i) => (
                  <p key={i} className="text-sm opacity-70">
                    ✦ {insight}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Featured Along This Street</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* Connected Districts */}
        <div>
          <h2 className="text-4xl font-bold mb-8">Districts on This Street</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {districts.map((district) => (
              <Link
                key={district.id}
                href={`/districts/${district.slug}`}
                className="group"
              >
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-2 group-hover:translate-x-1 transition-transform">
                        {district.name}
                      </h3>
                      <p className="text-sm opacity-70">{district.category}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>

                  <p className="text-sm opacity-80 mb-4 line-clamp-2">
                    {district.description}
                  </p>

                  <div className="text-xs opacity-60">
                    {district.product_count || 0} products
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
