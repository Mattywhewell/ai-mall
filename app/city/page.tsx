'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, MapPin, Heart, TrendingUp, Compass } from 'lucide-react';
import type { Hall, Street, Chapel } from '@/lib/types/world';

export default function CityHomePage() {
  const [worldData, setWorldData] = useState<{
    halls: Hall[];
    trendingStreets: Street[];
    featuredChapels: Chapel[];
    welcomeMessage: string | null;
  }>({
    halls: [],
    trendingStreets: [],
    featuredChapels: [],
    welcomeMessage: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWorldData() {
      try {
        const response = await fetch('/api/world/city');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setWorldData(data);
      } catch (error) {
        console.error('Failed to fetch city data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchWorldData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading your city...</div>
      </div>
    );
  }

  const hallThemeColors: Record<string, string> = {
    innovation: 'from-blue-500 to-indigo-600',
    wellness: 'from-green-500 to-teal-600',
    craft: 'from-orange-500 to-amber-600',
    motion: 'from-red-500 to-orange-600',
    light: 'from-yellow-200 to-amber-300'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 text-center px-4">
          <h1 className="text-7xl md:text-9xl font-black text-white mb-6 tracking-tight">
            Welcome to the<br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
              AI City
            </span>
          </h1>
          
          {worldData.welcomeMessage && (
            <p className="text-xl md:text-2xl text-purple-200 max-w-3xl mx-auto mb-12 leading-relaxed">
              {worldData.welcomeMessage}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/ai-city/explore"
              className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-bold text-lg hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
            >
              <Compass className="inline mr-2 group-hover:rotate-12 transition-transform" size={24} />
              Wander
              <span className="block text-sm opacity-80">Free exploration</span>
            </Link>
            <Link 
              href="/commons"
              className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full font-bold text-lg hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
            >
              <Heart className="inline mr-2 group-hover:animate-pulse" size={24} />
              Seek
              <span className="block text-sm opacity-80">Guided path</span>
            </Link>
            <Link 
              href="/creator"
              className="group px-8 py-4 bg-white/10 backdrop-blur-md text-white rounded-full font-bold text-lg hover:bg-white/20 transition-all border border-white/20 shadow-lg"
            >
              <Sparkles className="inline mr-2 group-hover:animate-spin" size={24} />
              Create
              <span className="block text-sm opacity-80">Build & innovate</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Halls Section */}
      <section id="halls" className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-4">
            Grand Halls
          </h2>
          <p className="text-xl text-purple-200">
            Thematic spaces where worlds converge
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {worldData.halls.map((hall) => (
            <Link
              key={hall.id}
              href={`/halls/${hall.slug}`}
              className="group relative overflow-hidden rounded-3xl bg-gradient-to-br backdrop-blur-md p-8 hover:scale-105 transition-transform duration-300"
              style={{
                background: `linear-gradient(135deg, ${hall.atmosphere.color_palette?.[0] || '#3B82F6'}20, ${hall.atmosphere.color_palette?.[1] || '#8B5CF6'}40)`
              }}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-semibold text-white">
                    {hall.theme}
                  </span>
                  <Sparkles className="text-yellow-300" size={24} />
                </div>

                <h3 className="text-3xl font-bold text-white mb-3">
                  {hall.name}
                </h3>

                <p className="text-purple-100 mb-6 leading-relaxed">
                  {hall.atmosphere.ambient_text}
                </p>

                <div className="flex gap-2">
                  {hall.atmosphere.color_palette?.slice(0, 3).map((color, idx) => (
                    <div
                      key={idx}
                      className="w-8 h-8 rounded-full border-2 border-white/50"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                {hall.connected_streets && hall.connected_streets.length > 0 && (
                  <div className="mt-4 text-sm text-purple-200">
                    {hall.connected_streets.length} streets connected
                  </div>
                )}
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Streets Section */}
      <section id="streets" className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-4">
            Trending Streets
          </h2>
          <p className="text-xl text-purple-200">
            Navigate the most vibrant pathways
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {worldData.trendingStreets.slice(0, 6).map((street, idx) => (
            <Link
              key={street.id}
              href={`/streets/${street.slug}`}
              className="group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {street.trending && (
                      <span className="px-3 py-1 bg-gradient-to-r from-pink-500 to-orange-500 text-white text-xs font-bold rounded-full">
                        <TrendingUp className="inline mr-1" size={12} />
                        TRENDING
                      </span>
                    )}
                    <span className="px-3 py-1 bg-white/10 text-white text-xs font-semibold rounded-full">
                      {street.personality}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">
                    {street.name}
                  </h3>
                </div>

                <div className="text-right">
                  <div className="text-3xl font-black text-white">
                    {street.popularity_score}
                  </div>
                  <div className="text-xs text-purple-300">popularity</div>
                </div>
              </div>

              {street.atmosphere_tags && street.atmosphere_tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {street.atmosphere_tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-purple-500/20 text-purple-200 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-purple-500/10 to-transparent rounded-tl-full" />
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Chapels Section */}
      <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-4">
            Sacred Chapels
          </h2>
          <p className="text-xl text-purple-200">
            Intimate spaces for reflection and wonder
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {worldData.featuredChapels.map((chapel) => {
            const emotionColors: Record<string, string> = {
              contemplation: 'from-indigo-600 to-purple-700',
              joy: 'from-yellow-400 to-orange-500',
              mystery: 'from-gray-700 to-black',
              serenity: 'from-teal-500 to-cyan-600',
              wonder: 'from-blue-400 to-indigo-500'
            };

            return (
              <Link
                key={chapel.id}
                href={`/chapels/${chapel.slug}`}
                className="group bg-gradient-to-br backdrop-blur-md rounded-2xl p-6 hover:scale-105 transition-transform"
                style={{
                  background: `linear-gradient(135deg, rgba(0,0,0,0.5), rgba(0,0,0,0.3))`
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="text-pink-400" size={20} />
                  <span className="text-sm text-purple-300 font-semibold uppercase tracking-wide">
                    {chapel.emotion}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-3">
                  {chapel.name}
                </h3>

                <p className="text-sm text-purple-200 leading-relaxed line-clamp-3">
                  {chapel.micro_story}
                </p>

                <div className="mt-4 text-xs text-purple-400">
                  {(chapel as any).visit_count || 0} visitors
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Your city awaits
          </h2>
          <p className="text-lg text-purple-200 mb-8">
            Every space adapts to you. Every path reveals something new.
          </p>
          <Link
            href="/halls/luminous-nexus"
            className="inline-block px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold text-lg hover:scale-105 transition-transform"
          >
            Begin Your Journey
          </Link>
        </div>
      </section>
    </div>
  );
}
