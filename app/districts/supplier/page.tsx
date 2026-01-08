/**
 * Supplier Harbor - Gateway of Goods and Connections
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Anchor, Ship, Container, ArrowLeft, Waves } from 'lucide-react';

export default function SupplierHarbor() {
  const [shipments, setShipments] = useState<number>(0);
  const [wavePhase, setWavePhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setShipments(prev => prev + Math.floor(Math.random() * 3));
      setWavePhase(prev => (prev + 1) % 360);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-950 via-green-950 to-emerald-950 relative overflow-hidden">
      {/* Water Effect Background */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%" className="absolute bottom-0">
          <defs>
            <linearGradient id="water" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#14B8A6" stopOpacity="0" />
              <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.5" />
            </linearGradient>
          </defs>
          <path
            d={`M0,100 Q250,${80 + Math.sin(wavePhase * 0.1) * 20} 500,100 T1000,100 T1500,100 T2000,100 V200 H0 Z`}
            fill="url(#water)"
            className="transition-all duration-1000"
          />
        </svg>
      </div>

      {/* Floating Containers */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float-container"
            style={{
              left: `${5 + i * 15}%`,
              top: `${30 + (i % 2) * 20}%`,
              animationDelay: `${i * 0.5}s`
            }}
          >
            <div className="bg-gradient-to-br from-green-600/30 to-teal-600/30 backdrop-blur-sm border-2 border-green-400/50 rounded-lg p-3 shadow-2xl">
              <Container className="w-8 h-8 text-green-300" />
              <div className="text-xs text-green-200 mt-1 font-mono">
                #{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trade Routes - Glowing Lines */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="absolute h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-50"
            style={{
              left: '10%',
              right: '10%',
              top: `${25 + i * 20}%`,
              animation: `flow ${3 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 p-8">
        <Link href="/ai-city/explore" className="inline-flex items-center text-teal-300 hover:text-teal-100 transition-colors mb-6">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to City
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-green-300 to-emerald-400 mb-3">
              Supplier Harbor
            </h1>
            <p className="text-2xl text-teal-200">Gateway of goods and connections</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Waves className="w-6 h-6 text-blue-400 animate-pulse" />
            <span className="text-blue-300 font-semibold">TIDES: FAVORABLE</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-8 py-12 max-w-7xl mx-auto">
        {/* Shipment Tracker */}
        <div className="mb-12 bg-black/40 backdrop-blur-md border-2 border-teal-500/50 rounded-2xl p-8">
          <div className="flex items-center space-x-4 mb-6">
            <Ship className="w-6 h-6 text-teal-400" />
            <h2 className="text-2xl font-bold text-teal-300">Live Shipment Tracker</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-5xl font-black text-teal-400 mb-2">{shipments}</div>
              <div className="text-teal-300 text-sm">Today's Arrivals</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-green-400 mb-2">847</div>
              <div className="text-green-300 text-sm">Active Suppliers</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-emerald-400 mb-2">24/7</div>
              <div className="text-emerald-300 text-sm">Operations</div>
            </div>
          </div>

          {/* Dock Indicators */}
          <div className="mt-6 grid grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="text-center">
                <div className={`w-full h-12 rounded-lg ${i < 3 ? 'bg-green-500/50' : 'bg-gray-500/30'} flex items-center justify-center`}>
                  <span className="text-white font-bold">Dock {i + 1}</span>
                </div>
                <div className="text-xs text-teal-300 mt-1">
                  {i < 3 ? 'Occupied' : 'Available'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Landmarks */}
        <h2 className="text-4xl font-bold text-teal-300 mb-8">Harbor Landmarks</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-green-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-black/70 backdrop-blur-md rounded-2xl p-8 border border-teal-500/50">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-green-500 rounded-xl flex items-center justify-center">
                  <Anchor className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-teal-300">Supplier Embassy</h3>
                  <p className="text-teal-500">Where partnerships are forged</p>
                </div>
              </div>
              
              <p className="text-teal-200 mb-4">
                A magnificent structure of glass and steel, its halls filled with holographic displays 
                showing every product catalog, every supplier rating, every successful partnership. 
                Here, merchants and makers meet to build the future of commerce.
              </p>
              
              <div className="flex space-x-2">
                <span className="px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-sm">Networking</span>
                <span className="px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-sm">Partnership</span>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-black/70 backdrop-blur-md rounded-2xl p-8 border border-green-500/50">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-green-300">Trade Route Hub</h3>
                  <p className="text-green-500">Nexus of global logistics</p>
                </div>
              </div>
              
              <p className="text-green-200 mb-4">
                A massive circular plaza where glowing trade routes converge, each line representing 
                a connection to suppliers worldwide. Watch as goods flow in real-time, tracked by 
                invisible AI guardians ensuring every shipment reaches its destination.
              </p>
              
              <div className="flex space-x-2">
                <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">Global Network</span>
                <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">Real-time</span>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-black/70 backdrop-blur-md rounded-2xl p-8 border border-emerald-500/50">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
                  <Container className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-emerald-300">Cargo Sanctum</h3>
                  <p className="text-emerald-500">Intelligent storage infinity</p>
                </div>
              </div>
              
              <p className="text-emerald-200 mb-4">
                Impossibly tall towers of containers, each one tracked by AI, sorted by quantum 
                algorithms, and accessible within seconds. The sanctum never sleeps, its automated 
                systems ensuring perfect inventory across millions of items.
              </p>
              
              <div className="flex space-x-2">
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm">Automated</span>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm">Intelligent</span>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-black/70 backdrop-blur-md rounded-2xl p-8 border border-cyan-500/50">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-xl flex items-center justify-center">
                  <Ship className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-cyan-300">Docking Spires</h3>
                  <p className="text-cyan-500">Where ships find harbor</p>
                </div>
              </div>
              
              <p className="text-cyan-200 mb-4">
                Elegant towers reaching toward the sky, each one a gateway for autonomous delivery 
                vessels. Watch as drones and smart transports arrive and depart in perfect 
                choreography, guided by the harbor's omniscient coordination AI.
              </p>
              
              <div className="flex space-x-2">
                <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm">Autonomous</span>
                <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm">Efficient</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-teal-600/30 to-green-600/30 backdrop-blur-md rounded-xl p-6 border border-teal-400/30">
            <div className="text-4xl mb-3">🏗️</div>
            <h3 className="text-xl font-bold text-teal-300 mb-2">Crane Towers</h3>
            <p className="text-teal-200 text-sm">
              Massive mechanical arms work tirelessly, lifting containers with impossible precision, 
              their movements a ballet of efficiency.
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-600/30 to-emerald-600/30 backdrop-blur-md rounded-xl p-6 border border-green-400/30">
            <div className="text-4xl mb-3">🌊</div>
            <h3 className="text-xl font-bold text-green-300 mb-2">Trade Routes</h3>
            <p className="text-green-200 text-sm">
              Glowing lines trace paths across the harbor, each one representing a connection to 
              distant suppliers, pulsing with the flow of goods.
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-600/30 to-cyan-600/30 backdrop-blur-md rounded-xl p-6 border border-emerald-400/30">
            <div className="text-4xl mb-3">📦</div>
            <h3 className="text-xl font-bold text-emerald-300 mb-2">Container Gardens</h3>
            <p className="text-emerald-200 text-sm">
              Between the working docks, vertical gardens bloom within repurposed containers, 
              bringing life and beauty to the industrial landscape.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Link
            href="/supplier"
            className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-2xl"
          >
            <Package className="w-5 h-5" />
            <span>Join as Supplier</span>
          </Link>
        </div>
      </main>

      <style jsx>{`
        @keyframes float-container {
          0%, 100% {
            transform: translateY(0px) rotate(-2deg);
          }
          50% {
            transform: translateY(-15px) rotate(2deg);
          }
        }

        @keyframes flow {
          0%, 100% {
            opacity: 0.3;
            transform: translateX(-20px);
          }
          50% {
            opacity: 0.8;
            transform: translateX(20px);
          }
        }
        
        .animate-float-container {
          animation: float-container 5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
