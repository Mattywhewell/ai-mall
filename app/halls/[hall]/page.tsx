/**
 * Hall Page Component
 * Grand thematic spaces with AI spirits
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Map, Store } from 'lucide-react';
import { Hall, Street, AISpirit } from '@/lib/types/world';
import Link from 'next/link';

export default function HallPage() {
  const params = useParams();
  const router = useRouter();
  const hallSlug = params?.hall as string;

  const [hall, setHall] = useState<Hall | null>(null);
  const [spirit, setSpirit] = useState<AISpirit | null>(null);
  const [streets, setStreets] = useState<Street[]>([]);
  const [atmosphereText, setAtmosphereText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hallSlug) {
      fetchHallData();
    }
  }, [hallSlug]);

  const fetchHallData = async () => {
    try {
      // Fetch hall data
      const res = await fetch(`/api/world/halls/${hallSlug}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      
      setHall(data.hall);
      setSpirit(data.spirit);
      setStreets(data.streets);
      setAtmosphereText(data.atmospheric_description);
    } catch (error) {
      console.error('Failed to fetch hall:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-900 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Entering the Hall...</p>
        </div>
      </div>
    );
  }

  if (!hall) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Hall Not Found</h1>
          <Link href="/" className="text-indigo-400 hover:text-indigo-300">
            Return to City
          </Link>
        </div>
      </div>
    );
  }

  const getBgGradient = () => {
    const colorMap: Record<string, string> = {
      innovation: 'from-blue-950 via-indigo-900 to-purple-950',
      wellness: 'from-green-950 via-emerald-900 to-teal-950',
      craft: 'from-orange-950 via-amber-900 to-yellow-950',
      motion: 'from-red-950 via-pink-900 to-rose-950',
      light: 'from-yellow-200 via-amber-100 to-white',
    };
    return colorMap[hall.theme] || 'from-gray-950 via-gray-900 to-black';
  };

  const getTextColor = () => {
    return hall.theme === 'light' ? 'text-gray-900' : 'text-white';
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getBgGradient()} ${getTextColor()}`}>
      {/* Atmospheric Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <Link href="/" className="hover:opacity-70 transition">
            <span className="opacity-70">City</span>
          </Link>
          <span className="mx-2 opacity-50">/</span>
          <span className="font-semibold">{hall.name}</span>
        </div>

        {/* Hall Header */}
        <div className="mb-16 text-center">
          <div className="inline-block px-4 py-2 bg-white/10 backdrop-blur-lg rounded-full mb-6">
            <span className="text-sm uppercase tracking-wider opacity-80">{hall.theme} Hall</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold mb-6 tracking-tight">
            {hall.name}
          </h1>

          <p className="text-xl md:text-2xl opacity-80 max-w-3xl mx-auto mb-8 leading-relaxed">
            {atmosphereText || hall.atmosphere.ambient_text}
          </p>

          {/* Color Palette */}
          <div className="flex justify-center gap-2 mb-8">
            {hall.atmosphere.color_palette.map((color, i) => (
              <div
                key={i}
                className="w-12 h-12 rounded-full border-2 border-white/20"
                style={{ backgroundColor: color }}
              ></div>
            ))}
          </div>
        </div>

        {/* AI Spirit Section */}
        {spirit && (
          <div className="mb-16 max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-6 h-6" />
                <h2 className="text-2xl font-bold">{spirit.name}</h2>
                <span className="px-3 py-1 bg-white/10 rounded-full text-sm">
                  {spirit.voice_style}
                </span>
              </div>

              <p className="text-lg opacity-90 mb-6 leading-relaxed">
                "{spirit.greeting}"
              </p>

              {spirit.insights && spirit.insights.length > 0 && (
                <div className="space-y-3">
                  {spirit.insights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-3 opacity-80">
                      <span className="text-xs mt-1">✦</span>
                      <p className="text-sm">{insight}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Connected Streets */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <Map className="w-8 h-8" />
            <h2 className="text-4xl font-bold">Connected Streets</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {streets.map((street) => (
              <Link
                key={street.id}
                href={`/streets/${street.slug}`}
                className="group"
              >
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 h-full">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold group-hover:translate-x-1 transition-transform">
                      {street.name}
                    </h3>
                    <ArrowRight className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-white/10 rounded-lg text-xs">
                      {street.personality}
                    </span>
                    {street.trending && (
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-lg text-xs">
                        Trending
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm opacity-70">
                    <Store className="w-4 h-4" />
                    <span>{street.districts.length} districts</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {street.atmosphere_tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="text-xs opacity-60">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Atmospheric Info */}
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <div className="text-sm opacity-70 space-y-2">
              <p>Mood: <span className="font-semibold">{hall.atmosphere.mood}</span></p>
              <p>Lighting: <span className="font-semibold">{hall.atmosphere.lighting_style}</span></p>
              <p>
                Adapts to time: {hall.atmosphere.time_of_day_adaptation ? '✓' : '✗'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
