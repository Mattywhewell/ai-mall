/**
 * Automation District - Where Intelligence Flows
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Zap, Cpu, GitBranch, Activity, ArrowLeft, Radio } from 'lucide-react';

export default function AutomationDistrict() {
  const [dataFlow, setDataFlow] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDataFlow(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-950 relative overflow-hidden">
      {/* Circuit Pattern Background */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M10,10 L90,10 M50,10 L50,90 M10,50 L90,50" stroke="#3B82F6" strokeWidth="2" fill="none"/>
              <circle cx="10" cy="10" r="3" fill="#3B82F6"/>
              <circle cx="90" cy="10" r="3" fill="#3B82F6"/>
              <circle cx="50" cy="50" r="3" fill="#3B82F6"/>
              <circle cx="10" cy="90" r="3" fill="#3B82F6"/>
              <circle cx="90" cy="90" r="3" fill="#3B82F6"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circuit)"/>
        </svg>
      </div>

      {/* Glowing Pipelines */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse"
            style={{
              left: '0',
              right: '0',
              top: `${15 + i * 15}%`,
              animationDelay: `${i * 0.3}s`,
              opacity: 0.6
            }}
          />
        ))}
      </div>

      {/* Flowing Data Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-400 rounded-full animate-flow-horizontal"
            style={{
              left: `${-5 + (dataFlow + i * 5) % 110}%`,
              top: `${10 + i * 4}%`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 p-8">
        <Link href="/ai-city/explore" className="inline-flex items-center text-blue-300 hover:text-blue-100 transition-colors mb-6">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to City
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-400 mb-3">
              Automation District
            </h1>
            <p className="text-2xl text-blue-200">Where intelligence flows and systems evolve</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Radio className="w-6 h-6 text-green-400 animate-pulse" />
            <span className="text-green-300 font-semibold">ALL SYSTEMS OPERATIONAL</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-8 py-12 max-w-7xl mx-auto">
        {/* Data Flow Visualization */}
        <div className="mb-12 bg-black/50 backdrop-blur-md border-2 border-blue-500/50 rounded-2xl p-8">
          <div className="flex items-center space-x-4 mb-6">
            <Activity className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-blue-300">Neural Network Status</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-5xl font-black text-blue-400 mb-2">{dataFlow}%</div>
              <div className="text-blue-300 text-sm">Processing Power</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-cyan-400 mb-2">1.2M</div>
              <div className="text-cyan-300 text-sm">Tasks/Second</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-indigo-400 mb-2">99.9%</div>
              <div className="text-indigo-300 text-sm">Uptime</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 h-4 bg-black/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 transition-all duration-500"
              style={{ width: `${dataFlow}%` }}
            />
          </div>
        </div>

        {/* Landmarks */}
        <h2 className="text-4xl font-bold text-blue-300 mb-8">District Landmarks</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-black/80 backdrop-blur-md rounded-2xl p-8 border border-blue-500/50">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Cpu className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-blue-300">The Automation Nexus</h3>
                  <p className="text-blue-500">Core of intelligent systems</p>
                </div>
              </div>
              
              <p className="text-blue-200 mb-4">
                A massive sphere of crystalline processors suspended in mid-air, its surface covered 
                in thousands of pulsing lights. Each light represents an active automation task, 
                coordinating seamlessly with the city's needs.
              </p>
              
              <div className="flex space-x-2">
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">Self-Optimizing</span>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">Predictive</span>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-black/80 backdrop-blur-md rounded-2xl p-8 border border-cyan-500/50">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-indigo-500 rounded-xl flex items-center justify-center">
                  <GitBranch className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-cyan-300">Circuit Cathedral</h3>
                  <p className="text-cyan-500">Where algorithms are born</p>
                </div>
              </div>
              
              <p className="text-cyan-200 mb-4">
                A towering structure of interconnected neural pathways, visible through transparent walls. 
                Here, new automation patterns are tested, refined, and deployed across the city.
              </p>
              
              <div className="flex space-x-2">
                <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm">Machine Learning</span>
                <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm">Evolution</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-blue-600/30 to-cyan-600/30 backdrop-blur-md rounded-xl p-6 border border-blue-400/30">
            <div className="text-4xl mb-3">🔄</div>
            <h3 className="text-xl font-bold text-blue-300 mb-2">Conveyor Belt Motifs</h3>
            <p className="text-blue-200 text-sm">
              Endless streams of tasks flow through translucent tubes, each one automatically 
              sorted, processed, and delivered to its destination.
            </p>
          </div>

          <div className="bg-gradient-to-br from-cyan-600/30 to-indigo-600/30 backdrop-blur-md rounded-xl p-6 border border-cyan-400/30">
            <div className="text-4xl mb-3">💫</div>
            <h3 className="text-xl font-bold text-cyan-300 mb-2">Glowing Pipelines</h3>
            <p className="text-cyan-200 text-sm">
              Data flows visibly through illuminated conduits, pulsing with the rhythm of 
              artificial intelligence at work.
            </p>
          </div>

          <div className="bg-gradient-to-br from-indigo-600/30 to-purple-600/30 backdrop-blur-md rounded-xl p-6 border border-indigo-400/30">
            <div className="text-4xl mb-3">⚙️</div>
            <h3 className="text-xl font-bold text-indigo-300 mb-2">Circuit Patterns</h3>
            <p className="text-indigo-200 text-sm">
              The very streets are etched with circuit-like designs, glowing softly as information 
              passes beneath your feet.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Link
            href="/admin/autonomous"
            className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-2xl"
          >
            <Zap className="w-5 h-5" />
            <span>View Automation Systems</span>
          </Link>
        </div>
      </main>

      <style jsx>{`
        @keyframes flow-horizontal {
          0% {
            transform: translateX(-100px);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateX(100vw);
            opacity: 0;
          }
        }
        
        .animate-flow-horizontal {
          animation: flow-horizontal linear infinite;
        }
      `}</style>
    </div>
  );
}
