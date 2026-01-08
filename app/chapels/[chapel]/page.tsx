/**
 * Chapel Page Component
 * Intimate micro-environments with emotional resonance
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Heart, Sparkles, BookOpen } from 'lucide-react';
import { Chapel, AISpirit } from '@/lib/types/world';
import Link from 'next/link';

export default function ChapelPage() {
  const params = useParams();
  const chapelSlug = params?.chapel as string;

  const [chapel, setChapel] = useState<Chapel | null>(null);
  const [spirit, setSpirit] = useState<any>(null);
  const [ambientMessage, setAmbientMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChapelData = useCallback(async () => {
    if (!chapelSlug) return;
    
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/world/chapels/${chapelSlug}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      
      setChapel(data.chapel);
      setSpirit(data.spirit);
      setAmbientMessage(data.spirit_message || data.ambient_message || '');
    } catch (error) {
      console.error('Failed to fetch chapel:', error);
      setError(error instanceof Error ? error.message : 'Failed to load chapel');
    } finally {
      setLoading(false);
    }
  }, [chapelSlug]);

  useEffect(() => {
    fetchChapelData();
  }, [fetchChapelData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <div className="animate-pulse mb-4">✧</div>
          <p className="text-sm opacity-70">Entering sacred space...</p>
        </div>
      </div>
    );
  }

  if (error || !chapel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="text-2xl mb-4">{error || 'Chapel not found'}</h1>
          <Link href="/" className="text-indigo-400 hover:text-indigo-300">
            Return to City
          </Link>
        </div>
      </div>
    );
  }

  const getEmotionColor = () => {
    const colors: Record<string, string> = {
      contemplation: 'from-indigo-950 to-purple-950',
      joy: 'from-yellow-900 to-orange-950',
      mystery: 'from-gray-950 to-black',
      serenity: 'from-blue-950 to-cyan-950',
      wonder: 'from-pink-950 to-purple-950',
    };
    return colors[chapel.emotion] || 'from-gray-950 to-black';
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b ${getEmotionColor()} text-white relative overflow-hidden`}>
      {/* Subtle ambient effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 w-96 h-96 bg-white/3 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-16 min-h-screen flex flex-col justify-center">
        {/* Navigation */}
        <div className="absolute top-6 left-6">
          <Link href="/" className="text-sm opacity-50 hover:opacity-100 transition">
            ← Return
          </Link>
        </div>

        {/* Chapel Content */}
        <div className="space-y-12 text-center">
          {/* Emotion Badge */}
          <div className="inline-block px-4 py-2 bg-white/5 backdrop-blur-lg rounded-full border border-white/10">
            <span className="text-xs uppercase tracking-widest opacity-70">{chapel.emotion}</span>
          </div>

          {/* Name */}
          <h1 className="text-5xl md:text-7xl font-light tracking-wide">
            {chapel.name}
          </h1>

          {/* Micro Story */}
          <div className="max-w-2xl mx-auto">
            <p className="text-lg md:text-xl leading-relaxed opacity-80 italic">
              "{chapel.micro_story}"
            </p>
          </div>

          {/* Symbolism */}
          <div className="flex justify-center gap-6 text-sm opacity-60">
            {chapel.symbolism.map((symbol, i) => (
              <span key={i} className="tracking-wide">✧ {symbol}</span>
            ))}
          </div>

          {/* AI Spirit Message */}
          {spirit && (
            <div className="mt-16 bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
              <div className="flex items-center justify-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 opacity-70" />
                <span className="text-sm opacity-70">{spirit.name}</span>
              </div>

              <p className="text-base md:text-lg leading-relaxed mb-8">
                {ambientMessage || spirit.greeting}
              </p>

              {/* Insights */}
              {spirit.insights && spirit.insights.length > 0 && (
                <div className="space-y-4">
                  {spirit.insights.map((insight: string, i: number) => (
                    <div key={i} className="text-sm opacity-70 leading-relaxed">
                      <Heart className="w-4 h-4 inline-block mr-2 opacity-50" />
                      {insight}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ritual */}
          {chapel.ritual && (
            <div className="mt-12 bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 opacity-70" />
                <span className="text-sm uppercase tracking-wider opacity-70">Ritual</span>
              </div>
              <p className="text-sm leading-relaxed opacity-80">
                {chapel.ritual}
              </p>
            </div>
          )}

          {/* AI Insight */}
          <div className="mt-12 text-center">
            <p className="text-sm opacity-60 leading-relaxed max-w-xl mx-auto">
              {chapel.ai_insight}
            </p>
          </div>
        </div>

        {/* Atmospheric Footer */}
        <div className="mt-16 text-center text-xs opacity-40">
          <p>This space adapts to your presence</p>
        </div>
      </div>
    </div>
  );
}
