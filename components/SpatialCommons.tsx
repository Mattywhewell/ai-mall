"use client";

import React, { Suspense, useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { log as ndLog } from '@/lib/client-ndjson';

// Dynamically import the entire 3D canvas to prevent SSR issues
const SpatialCanvas = dynamic(() => import('./SpatialCanvas'), { ssr: false });

// Dynamically import UI components that might have 3D dependencies
const EnhancedShopTourViewer = dynamic(() => import('./3d/ShopTourViewer').then((mod) => mod.ShopTourViewer), { ssr: false });
const EnhancedNavigationControls = dynamic(() => import('./3d/NavigationControls').then((mod) => mod.NavigationControls), { ssr: false });

// Lightweight loading fallback for 3D components
function Loading3DFallback() {
  return (
    <mesh>
      <Html center>
        <div className="text-white">Loading 3D environment…</div>
      </Html>
    </mesh>
  );
}

// Error Boundary for Three.js components
class ThreeErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode; componentName?: string },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode; componentName?: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    // Log generic error
    ndLog('error','threejs_error_caught',{error: String(error)});
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Include component name if provided
    const name = (this.props as any).componentName || 'Unknown 3D Component';
    ndLog('error','threejs_error_details',{componentName: name, error: String(error), info: String(errorInfo)});
  }

  render() {
    if (this.state.hasError) {
      const name = (this.props as any).componentName || '3D Component';
      return this.props.fallback || (
        <div className="flex items-center justify-center h-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <div>
            <h3 className="font-bold">{name} Failed to Load</h3>
            <p className="text-sm">Unable to load this part of the spatial environment.</p>
            <p className="text-xs mt-2">Error: {this.state.error?.message}</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Spatial Commons Main Component
export function SpatialCommons() {
  const [navigationMode, setNavigationMode] = useState<'walk' | 'teleport'>('walk');
  const [showTraditionalUI, setShowTraditionalUI] = useState(false);
  const [activeShopTour, setActiveShopTour] = useState<string | null>(null);
  const [activeArcade, setActiveArcade] = useState<string | null>(null);
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);
  const [clientError, setClientError] = useState<Error | null>(null);

  useEffect(() => {
    // Check WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setWebglSupported(!!gl);
      if (!gl) {
        ndLog('warn','webgl_not_supported',{});
      }
    } catch (e) {
      ndLog('error','webgl_check_failed',{error: String(e)});
      setWebglSupported(false);
    }
  }, []);

  // Global client-side error handler to capture runtime errors and show a banner
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onError = (event: ErrorEvent) => {
      ndLog('error','client_error_captured',{error: String(event.error || event.message)});
      setClientError(event.error || new Error(event.message || 'Unknown error'));
    }; 

    const onRejection = (event: PromiseRejectionEvent) => {
      ndLog('error','unhandled_rejection',{reason: String(event.reason)});
      setClientError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
    }; 

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection as any);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection as any);
    };
  }, []);

  if (webglSupported === false) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-blue-900 via-purple-900 to-indigo-900">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">WebGL Not Supported</h2>
          <p className="text-gray-600 mb-4">
            Your browser or graphics card doesn't support WebGL, which is required for the 3D spatial environment.
          </p>
          <div className="text-sm text-gray-500">
            <p>Try updating your graphics drivers or using a different browser.</p>
            <p>Alternatively, you can use the traditional navigation mode.</p>
          </div>
          <button
            onClick={() => setShowTraditionalUI(true)}
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Use Traditional Mode
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-blue-900 via-purple-900 to-indigo-900">
      {/* Client-side error banner */}
      {clientError && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-4 py-2 rounded shadow-md max-w-xl w-full mx-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <strong className="block">Client Runtime Error</strong>
              <div className="text-sm mt-1 truncate">{clientError.message}</div>
            </div>
            <div>
              <button
                className="ml-2 bg-white text-red-600 rounded px-3 py-1 text-sm font-medium"
                onClick={() => setClientError(null)}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Spatial Canvas */}
      <ThreeErrorBoundary>
        <SpatialCanvas
          navigationMode={navigationMode}
          onDistrictSelect={(districtId) => {
              ndLog('info','district_selected',{districtId});
              // TODO: Implement district teleportation
            }}
            onShopSelect={(shopId) => {
              ndLog('info','shop_selected',{shopId});
              setActiveShopTour(shopId);
            }}
            onCitizenInteract={(citizenId) => {
              ndLog('info','citizen_interaction',{citizenId});

      {/* Active Shop Tour Viewer */}
      {activeShopTour && (
        <EnhancedShopTourViewer
          shopId={activeShopTour}
          onClose={() => setActiveShopTour(null)}
        />
      )}

      {/* Active Arcade Game Viewer */}
      {activeArcade && (
        <ArcadeGameViewer
          gameId={activeArcade}
          onClose={() => setActiveArcade(null)}
        />
      )}

      {/* Hybrid UI Overlay */}
      <SpatialUIOverlay
        onToggleTraditional={() => setShowTraditionalUI(!showTraditionalUI)}
        navigationMode={navigationMode}
        onModeChange={setNavigationMode}
      />

      {/* Navigation Controls (DOM overlay) */}
      <div className="absolute top-6 right-6 z-40">
        <React.Suspense fallback={<div className="bg-white bg-opacity-80 p-2 rounded">Loading…</div>}>
          <EnhancedNavigationControls
            mode={navigationMode}
            onModeChange={setNavigationMode}
            onHomeClick={() => ndLog('info','return_home',{})}
          />
        </React.Suspense>
      </div>

      {/* Traditional Fallback */}
      {showTraditionalUI && (
        <TraditionalNavigationFallback onClose={() => setShowTraditionalUI(false)} />
      )}
    </div>
  );
}

// Environmental Setup
function SpatialEnvironment() {
  return (
    <>
      {/* Sky and Environment components disabled - may be causing Polygon issues */}
      {/* <Sky
        distance={450000}
        sunPosition={[0, 1, 0]}
        inclination={0}
        azimuth={0.25}
      />
      <Environment preset="sunset" /> */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <fog attach="fog" args={['#e6f3ff', 20, 100]} />
    </>
  );
}

// Central Plaza Component
function Plaza() {
  const plazaRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (plazaRef.current) {
      // Subtle ambient animation
      plazaRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group>
      {/* Main Plaza Platform */}
      <mesh ref={plazaRef} position={[0, -0.5, 0]} receiveShadow>
        <cylinderGeometry args={[15, 15, 0.5, 32]} />
        <meshStandardMaterial
          color="#f5f5dc"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Plaza Center Monument */}
      <mesh position={[0, 2, 0]} castShadow>
        <boxGeometry args={[1, 4, 1]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>

      {/* Emotional Weather Effect */}
      <EmotionalWeather />
    </group>
  );
}

// District Pathways
function DistrictPathways() {
  const districts = [
    { name: 'Wonder', position: [20, 0, 0], color: '#ffd700' },
    { name: 'Belonging', position: [-20, 0, 0], color: '#ff69b4' },
    { name: 'Purpose', position: [0, 0, -20], color: '#4169e1' },
    { name: 'Arcade', position: [0, 0, 20], color: '#ff4500' }
  ];

  return (
    <group>
      {districts.map((district, index) => (
        <DistrictPathway
          key={district.name ?? index}
          district={district}
          index={index}
        />
      ))}
    </group>
  );
}

function DistrictPathway({ district, index }: { district: any, index: number }) {
  const pathRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (pathRef.current) {
      // Glowing animation
      const intensity = Math.sin(state.clock.elapsedTime * 2 + index) * 0.3 + 0.7;
      (pathRef.current.material as THREE.MeshStandardMaterial).emissive.setHex(
        parseInt(district.color.replace('#', ''), 16)
      );
      (pathRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = intensity;
    }
  });

  return (
    <group>
      {/* Pathway */}
      <mesh
        ref={pathRef}
        position={district.position}
        rotation={[0, Math.atan2(district.position[0], district.position[2]), 0]}
      >
        <boxGeometry args={[2, 0.1, 10]} />
        <meshStandardMaterial
          color={district.color}
          emissive={district.color}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* District Name */}
      <Text
        position={[district.position[0], 3, district.position[2]]}
        fontSize={1}
        color={district.color}
        anchorX="center"
        anchorY="middle"
      >
        {district.name}
      </Text>
    </group>
  );
}

// AI Citizens
function AICitizens() {
  const citizens = [
    { name: 'Mara', position: [5, 0, 5], color: '#ff6b6b' },
    { name: 'Jun', position: [-5, 0, 5], color: '#4ecdc4' },
    { name: 'Ash', position: [5, 0, -5], color: '#45b7d1' },
    { name: 'Ori', position: [-5, 0, -5], color: '#f9ca24' }
  ];

  return (
    <group>
      {citizens.map((citizen, i) => (
        <AICitizen key={citizen.name ?? i} citizen={citizen} />
      ))}
    </group>
  );
}

function AICitizen({ citizen }: { citizen: any }) {
  const citizenRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (citizenRef.current) {
      // Gentle floating animation
      citizenRef.current.position.y = citizen.position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      citizenRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group>
      <mesh ref={citizenRef} position={citizen.position} castShadow>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color={citizen.color} />
      </mesh>

      {/* Name Label */}
      <Html position={[citizen.position[0], citizen.position[1] + 1.5, citizen.position[2]]}>
        <div className="bg-white/80 px-2 py-1 rounded text-sm font-medium">
          {citizen.name}
        </div>
      </Html>
    </group>
  );
}

// Shop Entrances
function ShopEntrances({ onEnterShop, activeTour }: { onEnterShop: (tourId: string) => void; activeTour: string | null }) {
  const shops = [
    { name: 'Memory Bazaar', position: [10, 0, 8], type: 'antique', tourId: 'sample-tour-1' },
    { name: 'Loomworks', position: [-10, 0, 8], type: 'creator', tourId: 'sample-tour-2' },
    { name: 'Garden of Hearts', position: [10, 0, -8], type: 'wellness', tourId: 'sample-tour-3' },
    { name: 'Harbor Echoes', position: [-10, 0, -8], type: 'entertainment', tourId: 'sample-tour-4' }
  ];

  return (
    <group>
      {shops.map((shop, i) => (
        <ShopEntrance
          key={shop.tourId ?? shop.name ?? i}
          shop={shop}
          onEnter={onEnterShop}
          isActive={activeTour === shop.tourId}
        />
      ))}
    </group>
  );
}

function ShopEntrance({ shop, onEnter, isActive }: { shop: any; onEnter: (tourId: string) => void; isActive: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <group>
      {/* Shop Portal */}
      <mesh
        position={shop.position}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => onEnter(shop.tourId)}
      >
        <boxGeometry args={[3, 4, 0.5]} />
        <meshStandardMaterial
          color={isActive ? '#00ff88' : hovered ? '#ffffff' : '#e0e0e0'}
          emissive={isActive ? '#004422' : hovered ? '#444444' : '#000000'}
          emissiveIntensity={isActive ? 0.4 : hovered ? 0.2 : 0}
        />
      </mesh>

      {/* Shop Name */}
      <Text
        position={[shop.position[0], shop.position[1] + 2.5, shop.position[2]]}
        fontSize={0.5}
        color="#333333"
        anchorX="center"
        anchorY="middle"
      >
        {shop.name}
      </Text>

      {/* Hover Effect */}
      {hovered && (
        <Html position={[shop.position[0], shop.position[1] + 3, shop.position[2]]}>
          <div className="bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg">
            Click to enter 3D shop tour
          </div>
        </Html>
      )}
    </group>
  );
}

// Arcade Entrance
function ArcadeEntrance({ onEnterArcade, activeGame }: { onEnterArcade: (gameId: string) => void; activeGame: string | null }) {
  const arcadePosition: [number, number, number] = [0, 0, 15];

  return (
    <group>
      {/* Arcade Portal */}
      <mesh
        position={arcadePosition}
        onClick={() => onEnterArcade('monkey-tag')}
      >
        <boxGeometry args={[4, 5, 0.5]} />
        <meshStandardMaterial
          color={activeGame === 'monkey-tag' ? '#ff6b35' : '#ff8c42'}
          emissive={activeGame === 'monkey-tag' ? '#ff4500' : '#ff6347'}
          emissiveIntensity={activeGame === 'monkey-tag' ? 0.4 : 0.2}
        />
      </mesh>

      {/* Arcade Sign */}
      <Text
        position={[arcadePosition[0], arcadePosition[1] + 3, arcadePosition[2]]}
        fontSize={0.8}
        color="#ff4500"
        anchorX="center"
        anchorY="middle"
      >
        🕹️ ARCADE
      </Text>

      {/* Monkey Tag Game Sign */}
      <Text
        position={[arcadePosition[0], arcadePosition[1] + 2, arcadePosition[2]]}
        fontSize={0.4}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        Monkey Tag Game
      </Text>

      {/* Neon Border Effect */}
      <mesh position={arcadePosition}>
        <boxGeometry args={[4.2, 5.2, 0.3]} />
        <meshBasicMaterial color="#ff4500" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// Navigation Controls
function NavigationControls({ mode }: { mode: 'walk' | 'teleport' }) {
  const { camera } = useThree();

  const teleportToDistrict = (position: [number, number, number]) => {
    camera.position.set(position[0], 5, position[2] + 5);
    camera.lookAt(position[0], 0, position[2]);
  };

  return (
    <Html position={[-10, 8, 0]}>
      <div className="bg-white/90 p-4 rounded-lg shadow-lg max-w-xs">
        <h3 className="font-bold mb-2">Navigation</h3>
        {mode === 'walk' ? (
          <div className="mb-3">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Walk Mode:</strong> Use WASD keys to move, mouse to look around
            </p>
          </div>
        ) : (
          <div className="mb-3">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Teleport Mode:</strong> Click buttons to jump to districts
            </p>
          </div>
        )}
        <div className="space-y-2">
          <button
            onClick={() => teleportToDistrict([20, 0, 0])}
            className="block w-full bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
          >
            Wonder District
          </button>
          <button
            onClick={() => teleportToDistrict([-20, 0, 0])}
            className="block w-full bg-pink-500 text-white px-3 py-1 rounded hover:bg-pink-600"
          >
            Belonging District
          </button>
          <button
            onClick={() => teleportToDistrict([0, 0, -20])}
            className="block w-full bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            Purpose District
          </button>
          <button
            onClick={() => teleportToDistrict([0, 0, 20])}
            className="block w-full bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600"
          >
            🕹️ Arcade
          </button>
        </div>
      </div>
    </Html>
  );
}

// Emotional Weather Effect
function EmotionalWeather() {
  const particlesRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.001;
      particlesRef.current.rotation.x += 0.0005;
    }
  });

  // Create particle system for ambient emotional atmosphere
  const particleCount = 100;
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 40;
    positions[i * 3 + 1] = Math.random() * 10 + 2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
  }

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color="#ffffff"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// UI Overlay for Hybrid Navigation

// Shop Tour Viewer Component
function ShopTourViewer({ tourId, onClose }: { tourId: string; onClose: () => void }) {
  const [shopInfo, setShopInfo] = useState({
    name: 'Sample Shop',
    description: 'Experience this space in 3D',
    products: []
  });

  // Mock shop data - in real implementation, fetch from API
  useEffect(() => {
    const mockShops = {
      'sample-tour-1': { name: 'Memory Bazaar', description: 'Antique treasures and vintage finds', products: [] },
      'sample-tour-2': { name: 'Loomworks', description: 'Creator tools and artistic inspiration', products: [] },
      'sample-tour-3': { name: 'Garden of Hearts', description: 'Wellness products and self-care items', products: [] },
      'sample-tour-4': { name: 'Harbor Echoes', description: 'Entertainment and experiential products', products: [] }
    };

    setShopInfo(mockShops[tourId as keyof typeof mockShops] || mockShops['sample-tour-1']);
  }, [tourId]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">{shopInfo.name}</h2>
            <p className="text-gray-600">{shopInfo.description}</p>
          </div>
          <button
            onClick={onClose}
            className="bg-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors text-xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[600px]">
          {/* 3D Tour */}
          <div className="flex-1">
            <MatterportViewer
              tourUrl={`https://my.matterport.com/show/?m=${tourId}`}
              className="w-full h-full"
              showControls={true}
            />
          </div>

          {/* Shop Sidebar */}
          <div className="w-80 bg-gray-50 p-6 overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Shop Products</h3>

            {/* Sample products - in real implementation, fetch from API */}
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white p-4 rounded-lg shadow">
                  <div className="w-full h-32 bg-gray-200 rounded mb-3 flex items-center justify-center">
                    <span className="text-gray-500">Product Image {i}</span>
                  </div>
                  <h4 className="font-medium">Sample Product {i}</h4>
                  <p className="text-sm text-gray-600 mb-2">Amazing product description</p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-green-600">$29.99</span>
                    <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Shop Actions */}
            <div className="mt-6 space-y-3">
              <button className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 font-medium">
                Continue Shopping
              </button>
              <button className="w-full bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 font-medium">
                Back to Commons
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Arcade Game Viewer
function ArcadeGameViewer({ gameId, onClose }: { gameId: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-orange-900 via-red-900 to-pink-900 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border-4 border-yellow-400">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-yellow-400/30">
          <div className="flex items-center space-x-3">
            <div className="text-4xl">🐒</div>
            <div>
              <h2 className="text-3xl font-bold text-yellow-400">Monkey Tag Game</h2>
              <p className="text-orange-200">Catch the monkey before time runs out!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-red-500 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Game Content */}
        <div className="p-6">
          <MonkeyTagGame onGameEnd={onClose} />
        </div>
      </div>
    </div>
  );
}

// Monkey Tag Game Component
function MonkeyTagGame({ onGameEnd }: { onGameEnd: () => void }) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameActive, setGameActive] = useState(true);
  const [monkeyPosition, setMonkeyPosition] = useState({ x: 50, y: 50 });
  const [message, setMessage] = useState("Click the monkey to catch it!");

  // Move monkey randomly
  useEffect(() => {
    if (!gameActive) return;

    const moveMonkey = () => {
      const newX = Math.random() * 80 + 10; // Keep within bounds
      const newY = Math.random() * 80 + 10;
      setMonkeyPosition({ x: newX, y: newY });
    };

    const interval = setInterval(moveMonkey, 800); // Move every 800ms
    return () => clearInterval(interval);
  }, [gameActive]);

  // Countdown timer
  useEffect(() => {
    if (!gameActive || timeLeft <= 0) return;

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, gameActive]);

  // End game when time runs out
  useEffect(() => {
    if (timeLeft <= 0 && gameActive) {
      setGameActive(false);
      setMessage(`Time's up! Final score: ${score} monkeys caught!`);
    }
  }, [timeLeft, gameActive, score]);

  const catchMonkey = () => {
    if (!gameActive) return;

    setScore(score + 1);
    setMessage("Great catch! Keep going!");
    
    // Move monkey immediately when caught
    const newX = Math.random() * 80 + 10;
    const newY = Math.random() * 80 + 10;
    setMonkeyPosition({ x: newX, y: newY });

    // Clear message after 1 second
    setTimeout(() => {
      setMessage("Click the monkey to catch it!");
    }, 1000);
  };

  return (
    <div className="text-center">
      {/* Game Stats */}
      <div className="flex justify-center space-x-8 mb-6 text-white">
        <div className="bg-yellow-600 px-4 py-2 rounded-lg">
          <div className="text-2xl font-bold">{score}</div>
          <div className="text-sm">Score</div>
        </div>
        <div className="bg-red-600 px-4 py-2 rounded-lg">
          <div className="text-2xl font-bold">{timeLeft}</div>
          <div className="text-sm">Time Left</div>
        </div>
      </div>

      {/* Game Message */}
      <div className="mb-6">
        <p className="text-xl text-yellow-300 font-medium">{message}</p>
      </div>

      {/* Game Area */}
      <div className="relative w-full h-96 bg-gradient-to-br from-green-800 to-green-900 rounded-lg border-4 border-yellow-400 mx-auto max-w-2xl overflow-hidden">
        {gameActive ? (
          <>
            {/* Jungle Background Elements */}
            <div className="absolute inset-0">
              <div className="absolute top-4 left-4 text-4xl opacity-30">🌴</div>
              <div className="absolute top-8 right-8 text-3xl opacity-30">🌿</div>
              <div className="absolute bottom-4 left-8 text-3xl opacity-30">🍌</div>
              <div className="absolute bottom-8 right-4 text-4xl opacity-30">🌳</div>
            </div>

            {/* Monkey */}
            <button
              onClick={catchMonkey}
              className="absolute w-16 h-16 bg-yellow-400 rounded-full border-4 border-orange-500 shadow-lg hover:scale-110 transition-transform"
              style={{
                left: `${monkeyPosition.x}%`,
                top: `${monkeyPosition.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <span className="text-3xl">🐒</span>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-white">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-3xl font-bold mb-2">Game Over!</h3>
            <p className="text-xl mb-6">You caught {score} monkeys!</p>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setScore(0);
                  setTimeLeft(30);
                  setGameActive(true);
                  setMessage("Click the monkey to catch it!");
                }}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold text-lg"
              >
                Play Again
              </button>
              <button
                onClick={onGameEnd}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-lg"
              >
                Back to Commons
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 text-orange-200">
        <p className="text-sm">Click the monkey as fast as you can before time runs out!</p>
      </div>
    </div>
  );
}

// Spatial UI Overlay Component
function SpatialUIOverlay({
  onToggleTraditional,
  navigationMode,
  onModeChange
}: {
  onToggleTraditional: () => void;
  navigationMode: 'walk' | 'teleport';
  onModeChange: (mode: 'walk' | 'teleport') => void;
}) {
  return (
    <div className="absolute top-4 left-4 z-30 bg-black/70 backdrop-blur-sm rounded-lg p-4 text-white max-w-xs">
      {/* Living City Status Indicator */}
      <div className="mb-3 pb-2 border-b border-gray-600">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium text-green-400">Living City Active</span>
        </div>
        <div className="text-xs text-gray-300 mt-1">Phase 3A: Autonomous Citizens</div>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-sm mb-2">Navigation Mode</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => onModeChange('walk')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                navigationMode === 'walk'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
              }`}
            >
              🚶 Walk
            </button>
            <button
              onClick={() => onModeChange('teleport')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                navigationMode === 'teleport'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
              }`}
            >
              ⚡ Teleport
            </button>
          </div>
        </div>

        <div>
          <button
            onClick={onToggleTraditional}
            className="w-full bg-gray-600 hover:bg-gray-500 text-gray-300 px-3 py-2 rounded text-xs font-medium transition-colors"
          >
            📱 Traditional View
          </button>
        </div>

        <div className="text-xs text-gray-400 border-t border-gray-600 pt-2">
          {navigationMode === 'walk' ? (
            <div>
              <strong>Walk Mode:</strong><br />
              Use WASD to move, mouse to look around
            </div>
          ) : (
            <div>
              <strong>Teleport Mode:</strong><br />
              Click district buttons to jump instantly
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Traditional Navigation Fallback Component
function TraditionalNavigationFallback({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">AI Mall - Traditional View</h1>
          <button
            onClick={onClose}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Back to Spatial View
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* District Links */}
          <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-purple-800 mb-2">Wonder District</h3>
            <p className="text-purple-600 mb-4">Explore innovative products and cutting-edge technology</p>
            <a href="/districts/wonder" className="text-purple-700 hover:underline">Visit District →</a>
          </div>

          <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-blue-800 mb-2">Belonging District</h3>
            <p className="text-blue-600 mb-4">Connect with community and shared experiences</p>
            <a href="/districts/belonging" className="text-blue-700 hover:underline">Visit District →</a>
          </div>

          <div className="bg-gradient-to-br from-green-100 to-green-200 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-green-800 mb-2">Purpose District</h3>
            <p className="text-green-600 mb-4">Find meaningful products that align with your values</p>
            <a href="/districts/purpose" className="text-green-700 hover:underline">Visit District →</a>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a href="/search" className="bg-gray-100 p-4 rounded text-center hover:bg-gray-200">
              🔍 Search
            </a>
            <a href="/loyalty" className="bg-yellow-100 p-4 rounded text-center hover:bg-yellow-200">
              ⭐ Loyalty
            </a>
            <a href="/gifts" className="bg-pink-100 p-4 rounded text-center hover:bg-pink-200">
              🎁 Gifts
            </a>
            <a href="/profile" className="bg-indigo-100 p-4 rounded text-center hover:bg-indigo-200">
              👤 Profile
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SpatialCommons;