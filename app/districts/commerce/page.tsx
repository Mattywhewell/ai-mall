/**
 * Commerce District - Neon Dreams & Trading Streams
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, DollarSign, BarChart3, Zap, ArrowLeft, Activity } from 'lucide-react';

export default function CommerceDistrict() {
  const [priceData, setPriceData] = useState<number[]>([]);

  useEffect(() => {
    // Simulate live price updates
    const interval = setInterval(() => {
      setPriceData(prev => [...prev.slice(-20), Math.random() * 100 + 50]);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-yellow-900 to-orange-900 relative overflow-hidden">
      {/* Neon Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(#FFD700 1px, transparent 1px), linear-gradient(90deg, #FFD700 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Floating Holographic Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${10 + i * 12}%`,
              top: `${20 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.5}s`
            }}
          >
            <div className="bg-gradient-to-r from-yellow-400/20 to-orange-400/20 backdrop-blur-sm border border-yellow-400/50 rounded-lg p-4 shadow-2xl">
              <div className="text-yellow-300 font-mono text-2xl font-bold">
                ${(Math.random() * 1000).toFixed(2)}
              </div>
              <div className="text-yellow-500 text-xs mt-1">
                {Math.random() > 0.5 ? '↗' : '↘'} {(Math.random() * 10).toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 p-8">
        <Link href="/ai-city/explore" className="inline-flex items-center text-yellow-300 hover:text-yellow-100 transition-colors mb-6">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to City
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-400 mb-3 animate-pulse">
              Commerce District
            </h1>
            <p className="text-2xl text-yellow-200">The beating heart of trade and transactions</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Activity className="w-6 h-6 text-green-400 animate-pulse" />
            <span className="text-green-300 font-semibold">MARKET OPEN</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-8 py-12 max-w-7xl mx-auto">
        {/* Price Ticker */}
        <div className="mb-12 bg-black/50 backdrop-blur-md border-2 border-yellow-500/50 rounded-2xl p-6 overflow-hidden">
          <div className="flex items-center space-x-4 mb-4">
            <TrendingUp className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-bold text-yellow-300">Live Market Feed</h2>
          </div>
          
          <div className="h-32 relative">
            <svg className="w-full h-full">
              <defs>
                <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              {priceData.length > 1 && (
                <polyline
                  fill="url(#priceGradient)"
                  stroke="#FCD34D"
                  strokeWidth="3"
                  points={priceData.map((price, i) => 
                    `${(i / priceData.length) * 100}%,${100 - price}%`
                  ).join(' ')}
                />
              )}
            </svg>
          </div>
        </div>

        {/* Landmarks */}
        <h2 className="text-4xl font-bold text-yellow-300 mb-8">District Landmarks</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-black/80 backdrop-blur-md rounded-2xl p-8 border border-yellow-500/50">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-yellow-300">Pricing Observatory</h3>
                  <p className="text-yellow-500">Real-time market intelligence</p>
                </div>
              </div>
              
              <p className="text-yellow-200 mb-4">
                A towering structure of crystalline glass and pulsing circuits, where AI algorithms 
                analyze millions of transactions per second, predicting trends before they emerge.
              </p>
              
              <div className="flex space-x-2">
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm">Real-time Analytics</span>
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm">Price Optimization</span>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-black/80 backdrop-blur-md rounded-2xl p-8 border border-orange-500/50">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-orange-300">Market Exchange Tower</h3>
                  <p className="text-orange-500">The nexus of all trades</p>
                </div>
              </div>
              
              <p className="text-orange-200 mb-4">
                Hundreds of holographic screens float in the air, displaying every transaction, 
                every currency conversion, every deal struck across the multiverse.
              </p>
              
              <div className="flex space-x-2">
                <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm">Multi-Currency</span>
                <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm">Instant Settlement</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-yellow-600/30 to-orange-600/30 backdrop-blur-md rounded-xl p-6 border border-yellow-400/30">
            <div className="text-4xl mb-3">💰</div>
            <h3 className="text-xl font-bold text-yellow-300 mb-2">Holographic Billboards</h3>
            <p className="text-yellow-200 text-sm">
              Floating advertisements shimmer with product offerings, prices morphing in real-time 
              based on demand and market sentiment.
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-600/30 to-red-600/30 backdrop-blur-md rounded-xl p-6 border border-orange-400/30">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-xl font-bold text-orange-300 mb-2">Floating Price Tickers</h3>
            <p className="text-orange-200 text-sm">
              Streams of numbers cascade through the air, each representing a product, a service, 
              a moment in the endless flow of commerce.
            </p>
          </div>

          <div className="bg-gradient-to-br from-red-600/30 to-pink-600/30 backdrop-blur-md rounded-xl p-6 border border-red-400/30">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="text-xl font-bold text-red-300 mb-2">Revenue Streams</h3>
            <p className="text-red-200 text-sm">
              Glowing rivers of energy flow through transparent tubes, visualizing the constant 
              movement of value throughout the district.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Link
            href="/pricing"
            className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-2xl"
          >
            <Zap className="w-5 h-5" />
            <span>Explore Market Analytics</span>
          </Link>
        </div>
      </main>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(3deg);
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
