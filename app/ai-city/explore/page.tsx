/**
 * AI City Explorer - Sprawling Visual Experience
 * A living, breathing city with distinct themed districts
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, Sparkles, TrendingUp, Package, 
  Zap, BookOpen, Map, Eye, Heart, Clock 
} from 'lucide-react';

export default function AICityExplorer() {
  const [timeOfDay, setTimeOfDay] = useState<'dawn' | 'day' | 'dusk' | 'night'>('day');
  const [activeDistrict, setActiveDistrict] = useState<string | null>(null);
  const [flowAnimation, setFlowAnimation] = useState(true);
  const [cursorRhythm, setCursorRhythm] = useState<'slow' | 'medium' | 'fast'>('medium');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mouseHistory, setMouseHistory] = useState<Array<{x: number, y: number, time: number}>>([]);
  const [userMood, setUserMood] = useState<'curious' | 'focused' | 'exploratory' | 'overwhelmed'>('curious');
  const [interactionPatterns, setInteractionPatterns] = useState({
    hoverTime: 0,
    clicks: 0,
    scrolls: 0,
    districtVisits: new Set<string>(),
    lastActivity: Date.now()
  });
  const [userMemory, setUserMemory] = useState({
    favoriteDistricts: [] as string[],
    visitCount: {} as Record<string, number>,
    preferredTimeOfDay: 'day' as 'dawn' | 'day' | 'dusk' | 'night',
    journeyHistory: [] as Array<{district: string, timestamp: number, duration: number}>
  });

  useEffect(() => {
    // Cycle through time of day every 30 seconds
    const interval = setInterval(() => {
      setTimeOfDay(prev => {
        const cycle = ['dawn', 'day', 'dusk', 'night'] as const;
        const currentIndex = cycle.indexOf(prev);
        return cycle[(currentIndex + 1) % cycle.length];
      });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load and save user memory
  useEffect(() => {
    const savedMemory = localStorage.getItem('ai-city-memory');
    if (savedMemory) {
      try {
        const memory = JSON.parse(savedMemory);
        setUserMemory(memory);
        // Set preferred time of day
        if (memory.preferredTimeOfDay) {
          setTimeOfDay(memory.preferredTimeOfDay);
        }
      } catch (error) {
        console.log('Could not load user memory');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ai-city-memory', JSON.stringify(userMemory));
  }, [userMemory]);

  // Cursor rhythm detection
  useEffect(() => {
    let lastTime = Date.now();
    let lastPosition = { x: 0, y: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      const currentTime = Date.now();
      const currentPosition = { x: e.clientX, y: e.clientY };
      
      setMousePosition(currentPosition);
      
      // Track mouse history for rhythm analysis
      setMouseHistory(prev => {
        const newHistory = [...prev.slice(-10), { ...currentPosition, time: currentTime }];
        
        // Calculate average speed over last 10 movements
        if (newHistory.length >= 5) {
          let totalDistance = 0;
          let totalTime = 0;
          
          for (let i = 1; i < newHistory.length; i++) {
            const dx = newHistory[i].x - newHistory[i-1].x;
            const dy = newHistory[i].y - newHistory[i-1].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const timeDiff = newHistory[i].time - newHistory[i-1].time;
            
            totalDistance += distance;
            totalTime += timeDiff;
          }
          
          const avgSpeed = totalDistance / (totalTime / 1000); // pixels per second
          
          if (avgSpeed < 200) setCursorRhythm('slow');
          else if (avgSpeed < 500) setCursorRhythm('medium');
          else setCursorRhythm('fast');
        }
        
        return newHistory;
      });
      
      lastTime = currentTime;
      lastPosition = currentPosition;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Mood detection based on interaction patterns
  useEffect(() => {
    const moodInterval = setInterval(() => {
      const patterns = interactionPatterns;
      const timeSinceActivity = Date.now() - patterns.lastActivity;

      // Mood detection logic
      if (patterns.hoverTime > 30000 && patterns.districtVisits.size >= 3) {
        setUserMood('focused'); // Deep engagement
      } else if (patterns.clicks > 10 && timeSinceActivity < 5000) {
        setUserMood('exploratory'); // Active exploration
      } else if (patterns.hoverTime < 5000 && patterns.districtVisits.size < 2) {
        setUserMood('curious'); // Initial curiosity
      } else if (timeSinceActivity > 30000 || patterns.scrolls > 20) {
        setUserMood('overwhelmed'); // Information overload
      }
    }, 5000);

    return () => clearInterval(moodInterval);
  }, [interactionPatterns]);

  // Track interactions
  const trackInteraction = (type: 'hover' | 'click' | 'scroll' | 'visit', districtId?: string) => {
    setInteractionPatterns(prev => ({
      ...prev,
      lastActivity: Date.now(),
      [type === 'hover' ? 'hoverTime' : type === 'click' ? 'clicks' : type === 'scroll' ? 'scrolls' : 'districtVisits']:
        type === 'visit' && districtId
          ? new Set([...prev.districtVisits, districtId])
          : type === 'hover'
          ? prev.hoverTime + 1000
          : prev[type === 'click' ? 'clicks' : 'scrolls'] + 1
    }));

    // Update memory for visits
    if (type === 'visit' && districtId) {
      setUserMemory(prev => {
        const newVisitCount = { ...prev.visitCount };
        newVisitCount[districtId] = (newVisitCount[districtId] || 0) + 1;

        const newJourneyHistory = [...prev.journeyHistory.slice(-9), {
          district: districtId,
          timestamp: Date.now(),
          duration: 0 // Could be calculated based on time spent
        }];

        // Update favorite districts (top 3 most visited)
        const sortedDistricts = Object.entries(newVisitCount)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([district]) => district);

        return {
          ...prev,
          visitCount: newVisitCount,
          journeyHistory: newJourneyHistory,
          favoriteDistricts: sortedDistricts
        };
      });
    }
  };

  // Scroll tracking
  useEffect(() => {
    const handleScroll = () => trackInteraction('scroll');
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const districts = [
    {
      id: 'commerce',
      name: 'Commerce District',
      icon: TrendingUp,
      color: 'gold',
      position: { top: '20%', left: '60%' },
      description: 'The beating heart of trade and transactions',
      landmarks: ['Pricing Observatory', 'Market Exchange Tower'],
      atmosphere: 'neon-pulse',
      features: ['Holographic billboards', 'Floating price tickers', 'Revenue streams']
    },
    {
      id: 'automation',
      name: 'Automation District',
      icon: Zap,
      color: 'blue',
      position: { top: '60%', left: '70%' },
      description: 'Where intelligence flows and systems evolve',
      landmarks: ['The Automation Nexus', 'Circuit Cathedral'],
      atmosphere: 'tech-pulse',
      features: ['Conveyor belt motifs', 'Glowing pipelines', 'Data streams']
    },
    {
      id: 'lore',
      name: 'Lore District',
      icon: BookOpen,
      color: 'purple',
      position: { top: '40%', left: '20%' },
      description: 'Ancient wisdom meets digital consciousness',
      landmarks: ['The Ritual Hall', 'Memory Well', 'Time Spire'],
      atmosphere: 'mystic-glow',
      features: ['Ancient runes', 'Celestial symbols', 'Ethereal mists']
    },
    {
      id: 'supplier',
      name: 'Supplier Harbor',
      icon: Package,
      color: 'green',
      position: { top: '70%', left: '30%' },
      description: 'Gateway of goods and connections',
      landmarks: ['Supplier Embassy', 'Trade Route Hub', 'Cargo Sanctum'],
      atmosphere: 'harbor-lights',
      features: ['Docking bays', 'Crane towers', 'Container gardens']
    },
    {
      id: 'growth',
      name: 'Growth Sector',
      icon: Heart,
      color: 'rose',
      position: { top: '30%', left: '45%' },
      description: 'Where communities flourish and scale',
      landmarks: ['The Scoring Tower', 'Analytics Spire'],
      atmosphere: 'organic-bloom',
      features: ['Living metrics', 'Growth rings', 'Network blossoms']
    }
  ];

  const pathways = [
    { from: 'commerce', to: 'automation', type: 'data', color: 'blue' },
    { from: 'automation', to: 'supplier', type: 'task', color: 'green' },
    { from: 'supplier', to: 'commerce', type: 'goods', color: 'gold' },
    { from: 'lore', to: 'growth', type: 'wisdom', color: 'purple' },
    { from: 'growth', to: 'commerce', type: 'insights', color: 'rose' },
  ];

  const skyGradients = {
    dawn: 'from-pink-300 via-orange-200 to-blue-300',
    day: 'from-blue-400 via-cyan-300 to-blue-500',
    dusk: 'from-purple-400 via-pink-300 to-orange-400',
    night: 'from-indigo-900 via-purple-900 to-slate-900'
  };

  // Mood-based atmospheric effects
  const moodAtmospheres = {
    curious: {
      overlay: 'bg-gradient-to-br from-transparent via-blue-500/10 to-transparent',
      particles: 'sparkle',
      intensity: 'gentle'
    },
    focused: {
      overlay: 'bg-gradient-to-br from-transparent via-purple-500/15 to-transparent',
      particles: 'flow',
      intensity: 'moderate'
    },
    exploratory: {
      overlay: 'bg-gradient-to-br from-transparent via-green-500/10 to-transparent',
      particles: 'energy',
      intensity: 'active'
    },
    overwhelmed: {
      overlay: 'bg-gradient-to-br from-transparent via-gray-500/20 to-transparent',
      particles: 'calm',
      intensity: 'subtle'
    }
  };

  const currentAtmosphere = moodAtmospheres[userMood];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${skyGradients[timeOfDay]} transition-all duration-[3000ms] relative overflow-hidden ${currentAtmosphere.overlay}`}>
      {/* Mood indicator */}
      <div className="absolute top-4 right-4 z-10 bg-black/20 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm">
        Mood: {userMood}
      </div>

      {/* Memory welcome for returning visitors */}
      {userMemory.journeyHistory.length > 0 && (
        <div className="absolute top-4 left-4 z-10 bg-black/20 backdrop-blur-sm rounded-xl px-4 py-2 text-white max-w-xs">
          <div className="text-sm font-semibold mb-1">Welcome back! 👋</div>
          <div className="text-xs opacity-90">
            {userMemory.favoriteDistricts.length > 0 && (
              <>Your favorite districts: {userMemory.favoriteDistricts.join(', ')}</>
            )}
          </div>
        </div>
      )}
      {/* Atmospheric Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Mood-responsive floating particles */}
        <div className={`absolute inset-0 ${userMood === 'overwhelmed' ? 'opacity-10' : 'opacity-30'}`}>
          {[...Array(userMood === 'exploratory' ? 50 : userMood === 'focused' ? 20 : 30)].map((_, i) => (
            <div
              key={i}
              className={`absolute rounded-full animate-float ${
                userMood === 'curious' ? 'w-1 h-1 bg-blue-200' :
                userMood === 'focused' ? 'w-2 h-2 bg-purple-300' :
                userMood === 'exploratory' ? 'w-1 h-1 bg-green-200' :
                'w-1 h-1 bg-gray-300'
              }`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${userMood === 'overwhelmed' ? 15 : 5 + Math.random() * 10}s`
              }}
            />
          ))}
        </div>

        {/* Mood-responsive fog layers */}
        <div className={`absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t backdrop-blur-sm ${
          userMood === 'curious' ? 'from-blue-500/10 to-transparent' :
          userMood === 'focused' ? 'from-purple-500/15 to-transparent' :
          userMood === 'exploratory' ? 'from-green-500/10 to-transparent' :
          'from-gray-500/20 to-transparent'
        }`} />
        
        {/* Light rays */}
        {timeOfDay === 'dawn' && (
          <div className="absolute top-0 left-1/4 w-1/2 h-full bg-gradient-to-b from-yellow-200/20 to-transparent rotate-12 blur-3xl" />
        )}
      </div>

      {/* Header */}
      <header className="relative z-50 p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <Building2 className="w-8 h-8 text-white" />
            <span className="text-2xl font-bold text-white">AI City</span>
          </Link>
          
          <div className="flex items-center space-x-6">
            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              <Clock className="inline w-4 h-4 mr-2 text-white" />
              <span className="text-white text-sm font-semibold capitalize">{timeOfDay}</span>
            </div>
            <button
              onClick={() => setFlowAnimation(!flowAnimation)}
              className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-white/20 transition-colors"
            >
              <Eye className="inline w-4 h-4 mr-2" />
              {flowAnimation ? 'Hide' : 'Show'} Flow
            </button>
          </div>
        </div>
      </header>

      {/* Main City View */}
      <main className="relative z-10 px-8 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Title */}
          <div className="text-center mb-16">
            <h1 className="text-7xl font-black text-white mb-4 drop-shadow-2xl">
              The Living City
            </h1>
            <p className="text-2xl text-white/90 font-medium">
              Where intelligence, commerce, and culture converge
            </p>
          </div>

          {/* City Map Canvas */}
          <div className="relative w-full aspect-video bg-black/20 backdrop-blur-md rounded-3xl border-2 border-white/30 overflow-hidden">
            {/* Background grid */}
            <div className="absolute inset-0 opacity-10">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Pathways */}
            {flowAnimation && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  {pathways.map((path, idx) => (
                    <linearGradient key={idx} id={`gradient-${idx}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={`var(--color-${path.color})`} stopOpacity="0" />
                      <stop offset="50%" stopColor={`var(--color-${path.color})`} stopOpacity="1" />
                      <stop offset="100%" stopColor={`var(--color-${path.color})`} stopOpacity="0" />
                    </linearGradient>
                  ))}
                </defs>
                
                {pathways.map((path, idx) => {
                  const fromDistrict = districts.find(d => d.id === path.from);
                  const toDistrict = districts.find(d => d.id === path.to);
                  if (!fromDistrict || !toDistrict) return null;

                  return (
                    <g key={idx}>
                      <line
                        x1={fromDistrict.position.left}
                        y1={fromDistrict.position.top}
                        x2={toDistrict.position.left}
                        y2={toDistrict.position.top}
                        stroke={`url(#gradient-${idx})`}
                        strokeWidth="3"
                        className="animate-pulse"
                      />
                      {/* Animated particles along path */}
                      <circle
                        className="animate-flow"
                        r="4"
                        fill={`var(--color-${path.color})`}
                      >
                        <animateMotion
                          dur="3s"
                          repeatCount="indefinite"
                          path={`M ${fromDistrict.position.left},${fromDistrict.position.top} L ${toDistrict.position.left},${toDistrict.position.top}`}
                        />
                      </circle>
                    </g>
                  );
                })}
              </svg>
            )}

            {/* Districts */}
            {districts.map((district) => {
              // Calculate reactive positioning based on cursor proximity and rhythm
              const baseTop = parseFloat(district.position.top);
              const baseLeft = parseFloat(district.position.left);
              
              const dx = mousePosition.x - (baseLeft / 100 * (typeof window !== 'undefined' ? window.innerWidth : 1920));
              const dy = mousePosition.y - (baseTop / 100 * (typeof window !== 'undefined' ? window.innerHeight : 1080));
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              // Cursor proximity effect
              const proximityFactor = Math.max(0, 1 - distance / 300); // Closer = stronger effect
              
              // Rhythm-based movement
              const rhythmOffset = cursorRhythm === 'fast' ? 2 : cursorRhythm === 'slow' ? 0.5 : 1;
              const time = Date.now() * 0.001 * rhythmOffset;
              
              const reactiveTop = baseTop + Math.sin(time + district.id.charCodeAt(0)) * proximityFactor * 5;
              const reactiveLeft = baseLeft + Math.cos(time + district.id.charCodeAt(0)) * proximityFactor * 5;

              // Memory-based personalization
              const isFavorite = userMemory.favoriteDistricts.includes(district.id);
              const visitCount = userMemory.visitCount[district.id] || 0;
              const memoryMultiplier = Math.min(visitCount * 0.1 + 1, 1.5); // Up to 50% boost for favorites
              
              return (
                <div
                  key={district.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  style={{ 
                    left: `${Math.max(10, Math.min(80, reactiveLeft))}%`, 
                    top: `${Math.max(10, Math.min(80, reactiveTop))}%`,
                    transform: `translate(-50%, -50%) scale(${1 + proximityFactor * 0.2})`,
                    transition: 'transform 0.3s ease-out'
                  }}
                  onMouseEnter={() => {
                    setActiveDistrict(district.id);
                    trackInteraction('hover');
                  }}
                  onMouseLeave={() => setActiveDistrict(null)}
                  onClick={() => {
                    trackInteraction('click');
                    trackInteraction('visit', district.id);
                  }}
                >
                  {/* Memory-based glow effect */}
                  {isFavorite && (
                    <div className="absolute inset-0 w-40 h-40 -m-20 bg-yellow-400/20 rounded-full blur-3xl animate-pulse" />
                  )}

                {activeDistrict === district.id && (
                  <div className="absolute top-full mt-16 left-1/2 transform -translate-x-1/2 w-80 z-50">
                    <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border-2 border-white animate-slideUp">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{district.name}</h3>
                      <p className="text-gray-700 mb-4">{district.description}</p>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-600 mb-2">Landmarks:</h4>
                        <div className="flex flex-wrap gap-2">
                          {district.landmarks.map((landmark, idx) => (
                            <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                              {landmark}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-600 mb-2">Features:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {district.features.map((feature, idx) => (
                            <li key={idx}>• {feature}</li>
                          ))}
                        </ul>
                      </div>

                      <Link
                        href={`/districts/${district.id}`}
                        className={`mt-4 block w-full text-center px-4 py-2 bg-gradient-to-r from-${district.color}-500 to-${district.color}-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow`}
                      >
                        Enter District
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              );
            })}

            {/* Decorative elements */}
            <div className="absolute bottom-8 left-8 flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-500/30 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Map className="w-6 h-6 text-white" />
              </div>
              <div className="text-white font-semibold">
                <div className="text-xs opacity-70">Active Districts</div>
                <div className="text-2xl">{districts.length}</div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-5 gap-6">
            {districts.map((district) => (
              <div key={district.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-10 h-10 bg-gradient-to-br from-${district.color}-400 to-${district.color}-600 rounded-lg flex items-center justify-center`}>
                    <district.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-white font-bold">{district.name}</h3>
                </div>
                <p className="text-white/80 text-sm">{district.description}</p>
              </div>
            ))}
          </div>

          {/* Ritual Elements */}
          <div className="mt-16 text-center">
            <h2 className="text-4xl font-bold text-white mb-8">Sacred Spaces</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { name: 'Memory Well', icon: '🌊', description: 'Where past and present merge' },
                { name: 'Time Spire', icon: '⏰', description: 'Guardian of temporal flow' },
                { name: 'Wisdom Shrine', icon: '📿', description: 'Ancient knowledge preserved' },
                { name: 'Portal Gardens', icon: '🌸', description: 'Gateways between realms' },
              ].map((sacred, idx) => (
                <div key={idx} className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 backdrop-blur-md rounded-2xl p-6 border-2 border-purple-400/30 hover:border-purple-400/60 transition-colors">
                  <div className="text-5xl mb-3">{sacred.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{sacred.name}</h3>
                  <p className="text-purple-200 text-sm">{sacred.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Styles */}
      <style jsx>{`
        :global(:root) {
          --color-blue: #3B82F6;
          --color-gold: #F59E0B;
          --color-purple: #A855F7;
          --color-green: #10B981;
          --color-rose: #F43F5E;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-float {
          animation: float ease-in-out infinite;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
