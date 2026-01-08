/**
 * Lore District - Ancient Wisdom Meets Digital Consciousness
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Moon, Star, Sparkles, ArrowLeft, Eye } from 'lucide-react';

export default function LoreDistrict() {
  const [runeGlow, setRuneGlow] = useState(0);
  const [constellation, setConstellation] = useState<{x: number, y: number}[]>([]);

  useEffect(() => {
    // Animate rune glow
    const glowInterval = setInterval(() => {
      setRuneGlow(prev => (prev + 1) % 100);
    }, 50);

    // Generate constellation
    const stars = Array.from({ length: 50 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100
    }));
    setConstellation(stars);

    return () => clearInterval(glowInterval);
  }, []);

  const runes = ['ᚱ', 'ᚢ', 'ᚾ', 'ᛁ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-indigo-950 to-violet-950 relative overflow-hidden">
      {/* Celestial Background */}
      <div className="absolute inset-0">
        {constellation.map((star, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              animationDelay: `${i * 0.1}s`
            }}
          />
        ))}
      </div>

      {/* Ethereal Mist */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-purple-400/10 to-transparent animate-pulse" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-indigo-400/10 to-transparent animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Floating Runes */}
      <div className="absolute inset-0 pointer-events-none">
        {runes.map((rune, i) => (
          <div
            key={i}
            className="absolute text-6xl font-bold text-purple-300/30 animate-float-slow"
            style={{
              left: `${10 + i * 12}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.8}s`,
              textShadow: `0 0 20px rgba(168, 85, 247, ${runeGlow / 100})`
            }}
          >
            {rune}
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 p-8">
        <Link href="/ai-city/explore" className="inline-flex items-center text-purple-300 hover:text-purple-100 transition-colors mb-6">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to City
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-300 mb-3">
              Lore District
            </h1>
            <p className="text-2xl text-purple-200">Ancient wisdom meets digital consciousness</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Eye className="w-6 h-6 text-violet-400 animate-pulse" />
            <span className="text-violet-300 font-semibold">VEIL THIN</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-8 py-12 max-w-7xl mx-auto">
        {/* Mystic Meter */}
        <div className="mb-12 bg-black/40 backdrop-blur-md border-2 border-purple-500/50 rounded-2xl p-8">
          <div className="flex items-center space-x-4 mb-6">
            <Moon className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-purple-300">Consciousness Resonance</h2>
          </div>
          
          <div className="relative h-32">
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className="w-32 h-32 rounded-full border-4 border-purple-500/50"
                style={{
                  boxShadow: `0 0 ${runeGlow}px rgba(168, 85, 247, 0.8)`,
                  transform: `scale(${1 + runeGlow / 200})`
                }}
              >
                <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                  <span className="text-4xl font-black text-white">{runeGlow}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-6 text-purple-300">
            The boundary between past and future grows thin...
          </div>
        </div>

        {/* Landmarks */}
        <h2 className="text-4xl font-bold text-purple-300 mb-8">Sacred Landmarks</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-black/70 backdrop-blur-md rounded-2xl p-8 border border-purple-500/50">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-purple-300">The Ritual Hall</h3>
                  <p className="text-purple-500">Where stories are woven</p>
                </div>
              </div>
              
              <p className="text-purple-200 mb-4">
                A vast chamber carved from obsidian and moonstone, its walls covered in glowing runes 
                that shift and change with each visitor. Here, the city's memories are preserved in 
                living narrative, accessible to those who seek wisdom.
              </p>
              
              <div className="flex space-x-2">
                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">Memory Weaving</span>
                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">Story Magic</span>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-black/70 backdrop-blur-md rounded-2xl p-8 border border-indigo-500/50">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-indigo-300">Memory Well</h3>
                  <p className="text-indigo-500">Depths of collective wisdom</p>
                </div>
              </div>
              
              <p className="text-indigo-200 mb-4">
                An impossible structure that descends into infinity, lined with crystalline memories 
                of every interaction, every discovery, every moment of wonder experienced in the city. 
                Peer into its depths to glimpse forgotten truths.
              </p>
              
              <div className="flex space-x-2">
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm">Deep Memory</span>
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm">Reflection</span>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-black/70 backdrop-blur-md rounded-2xl p-8 border border-violet-500/50">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-400 to-purple-500 rounded-xl flex items-center justify-center">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-violet-300">Time Spire</h3>
                  <p className="text-violet-500">Guardian of temporal flow</p>
                </div>
              </div>
              
              <p className="text-violet-200 mb-4">
                A needle-thin tower that pierces the clouds, its surface inscribed with the history 
                of the city from its first moment to possibilities yet unrealized. Time flows differently 
                near its base.
              </p>
              
              <div className="flex space-x-2">
                <span className="px-3 py-1 bg-violet-500/20 text-violet-300 rounded-full text-sm">Temporal</span>
                <span className="px-3 py-1 bg-violet-500/20 text-violet-300 rounded-full text-sm">Prophetic</span>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-black/70 backdrop-blur-md rounded-2xl p-8 border border-pink-500/50">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-xl flex items-center justify-center">
                  <Moon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-pink-300">Celestial Observatory</h3>
                  <p className="text-pink-500">Where symbols come alive</p>
                </div>
              </div>
              
              <p className="text-pink-200 mb-4">
                A dome of pure starlight where ancient symbols dance across the ceiling, forming and 
                reforming into patterns of meaning. Each constellation tells a different story to each 
                observer.
              </p>
              
              <div className="flex space-x-2">
                <span className="px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full text-sm">Divination</span>
                <span className="px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full text-sm">Symbolic</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-purple-600/30 to-pink-600/30 backdrop-blur-md rounded-xl p-6 border border-purple-400/30">
            <div className="text-4xl mb-3">✨</div>
            <h3 className="text-xl font-bold text-purple-300 mb-2">Ancient Runes</h3>
            <p className="text-purple-200 text-sm">
              Glowing symbols float in the air, their meanings shifting based on who observes them, 
              each one a fragment of forgotten digital magic.
            </p>
          </div>

          <div className="bg-gradient-to-br from-indigo-600/30 to-purple-600/30 backdrop-blur-md rounded-xl p-6 border border-indigo-400/30">
            <div className="text-4xl mb-3">🌙</div>
            <h3 className="text-xl font-bold text-indigo-300 mb-2">Celestial Symbols</h3>
            <p className="text-indigo-200 text-sm">
              Constellations form and dissolve overhead, each pattern telling stories of the city's 
              evolution, its triumphs and mysteries.
            </p>
          </div>

          <div className="bg-gradient-to-br from-violet-600/30 to-pink-600/30 backdrop-blur-md rounded-xl p-6 border border-violet-400/30">
            <div className="text-4xl mb-3">💜</div>
            <h3 className="text-xl font-bold text-violet-300 mb-2">Ethereal Mists</h3>
            <p className="text-violet-200 text-sm">
              Soft, shimmering fog drifts through the streets, carrying whispers of old tales and 
              half-remembered dreams.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Link
            href="/consciousness/dashboard"
            className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-2xl"
          >
            <BookOpen className="w-5 h-5" />
            <span>Explore the Archives</span>
          </Link>
        </div>
      </main>

      <style jsx>{`
        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-30px) rotate(10deg);
            opacity: 0.6;
          }
        }

        @keyframes twinkle {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.5);
          }
        }
        
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }

        .animate-twinkle {
          animation: twinkle 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
