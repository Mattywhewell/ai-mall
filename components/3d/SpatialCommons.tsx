'use client';

import { useState, useRef, Suspense, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { Button } from '@/components/ui/button';
import { MapPin, Users, ShoppingBag, Home, RotateCcw } from 'lucide-react';
import * as THREE from 'three';

// Sub-components
import { SpatialEnvironment } from './SpatialEnvironment';
import { Plaza } from './Plaza';
import { DistrictPathways } from './DistrictPathways';
import { AICitizens } from './AICitizens';
import { ShopEntrances } from './ShopEntrances';
import { NavigationControls } from './NavigationControls';
import { ShopTourViewer } from './ShopTourViewer';

interface SpatialCommonsProps {
  className?: string;
}

// Lazy load SoundManager to prevent chunk loading issues
let SoundManager: any = null;
let useSoundManager: any = null;

if (typeof window !== 'undefined') {
  try {
    import('../lib/sound/SoundManager').then(soundModule => {
      SoundManager = soundModule.SoundManager;
      useSoundManager = soundModule.useSoundManager;
    }).catch(error => {
      console.warn('SoundManager not available:', error);
    });
  } catch (error) {
    console.warn('SoundManager not available:', error);
  }
}

// Proximity Audio Handler Component
function AudioProximityHandler({
  soundManager,
  proximitySounds,
  setProximitySounds
}: {
  soundManager: any;
  proximitySounds: Map<string, string>;
  setProximitySounds: (sounds: Map<string, string>) => void;
}) {
  const { camera } = useThree();
  const lastPositions = useRef<Map<string, THREE.Vector3>>(new Map());

  // Shop positions (matching ShopEntrances)
  const shopPositions = [
    { id: 'memory-bazaar', position: new THREE.Vector3(15, 0, 8) },
    { id: 'loomworks', position: new THREE.Vector3(-12, 0, 10) },
    { id: 'garden-hearts', position: new THREE.Vector3(8, 0, -12) },
    { id: 'harbor-echoes', position: new THREE.Vector3(-10, 0, -8) }
  ];

  // District positions (matching DistrictPathways)
  const districtPositions = [
    { id: 'wonder', position: new THREE.Vector3(20, 0, 0) },
    { id: 'belonging', position: new THREE.Vector3(-20, 0, 0) },
    { id: 'purpose', position: new THREE.Vector3(0, 0, 20) }
  ];

  useFrame(() => {
    if (!soundManager || !soundManager.isReady) return;

    const cameraPosition = camera.position.clone();
    const proximityThreshold = 8; // Distance to trigger proximity audio

    // Check shop proximity
    shopPositions.forEach(({ id, position }) => {
      const distance = cameraPosition.distanceTo(position);
      const isClose = distance < proximityThreshold;
      const wasClose = lastPositions.current.get(id)?.distanceTo(position) < proximityThreshold;

      if (isClose && !wasClose && !proximitySounds.has(id)) {
        // Entered proximity - play ambient shop sound
        const soundId = soundManager.playAmbient('energy-hum', {
          volume: Math.max(0.05, (proximityThreshold - distance) / proximityThreshold * 0.15),
          fadeIn: 1
        });
        if (soundId) {
          setProximitySounds(new Map(proximitySounds.set(id, soundId)));
        }
      } else if (!isClose && wasClose && proximitySounds.has(id)) {
        // Left proximity - fade out sound
        const soundId = proximitySounds.get(id);
        if (soundId) {
          soundManager.stopSound(soundId, 2);
          const newSounds = new Map(proximitySounds);
          newSounds.delete(id);
          setProximitySounds(newSounds);
        }
      } else if (isClose && proximitySounds.has(id)) {
        // Adjust volume based on distance
        // Note: In a full implementation, you'd adjust the gain node directly
        // For now, we'll rely on the initial volume setting
      }

      lastPositions.current.set(id, position.clone());
    });

    // Check district proximity (similar logic could be added for districts)
    districtPositions.forEach(({ id, position }) => {
      lastPositions.current.set(id, position.clone());
    });
  });

  return null;
}

export function SpatialCommons({ className = '' }: SpatialCommonsProps) {
  const [navigationMode, setNavigationMode] = useState<'walk' | 'teleport'>('walk');
  const [selectedShop, setSelectedShop] = useState<string | null>(null);
  const [showTour, setShowTour] = useState(false);
  const [currentDistrict, setCurrentDistrict] = useState<string | null>(null);

  // Audio state
  const [ambientSoundId, setAmbientSoundId] = useState<string | null>(null);
  const [proximitySounds, setProximitySounds] = useState<Map<string, string>>(new Map());

  // Initialize sound manager (lazy loaded)
  const soundManager = useSoundManager ? useSoundManager() : null;

  // Audio effect handlers
  const playDistrictAmbient = (district: string | null) => {
    // Stop current ambient sound
    if (ambientSoundId && soundManager) {
      soundManager.stopSound(ambientSoundId, 2);
      setAmbientSoundId(null);
    }

    if (!district || !soundManager) return;

    // Play district-specific ambient audio
    const districtSounds: Record<string, string> = {
      'tech': 'cosmic-ambient',
      'fashion': 'energy-hum',
      'food': 'particle-field',
      'entertainment': 'cosmic-ambient',
      'health': 'energy-hum',
      'education': 'particle-field'
    };

    const soundName = districtSounds[district.toLowerCase()] || 'cosmic-ambient';
    const newSoundId = soundManager.playAmbient(soundName, {
      volume: 0.15,
      fadeIn: 3
    });

    if (newSoundId) {
      setAmbientSoundId(newSoundId);
    }
  };

  const playNavigationSound = (type: 'teleport' | 'walk') => {
    if (!soundManager) return;

    const soundName = type === 'teleport' ? 'portal-open' : 'node-hover';
    soundManager.playEffect(soundName, { volume: 0.3 });
  };

  const playShopSound = (shopId: string, action: 'enter' | 'exit') => {
    if (!soundManager) return;

    const soundName = action === 'enter' ? 'welcome-chime' : 'node-click';
    soundManager.playEffect(soundName, { volume: 0.4 });
  };

  // Handle district changes for ambient audio
  useEffect(() => {
    playDistrictAmbient(currentDistrict);
  }, [currentDistrict]);

  // Welcome sound on initial load
  useEffect(() => {
    if (soundManager && soundManager.isReady) {
      // Small delay to ensure everything is loaded
      const timer = setTimeout(() => {
        soundManager.playEffect('welcome-chime', { volume: 0.2 });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [soundManager?.isReady]);

  const handleShopEnter = (shopId: string) => {
    setSelectedShop(shopId);
    setShowTour(true);
    playShopSound(shopId, 'enter');
  };

  const handleShopExit = () => {
    if (selectedShop) {
      playShopSound(selectedShop, 'exit');
    }
    setSelectedShop(null);
    setShowTour(false);
  };

  const handleDistrictTeleport = (districtId: string) => {
    setCurrentDistrict(districtId);
    playNavigationSound('teleport');
    // TODO: Implement camera teleportation to district
  };

  return (
    <div className={`relative w-full h-full bg-gradient-to-b from-sky-200 to-sky-100 ${className}`}>
      {/* 3D Canvas */}
      <Canvas
        camera={{
          position: [0, 5, 10],
          fov: 60,
          near: 0.1,
          far: 1000
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance'
        }}
        dpr={[1, 2]}
        shadows
      >
        <Suspense fallback={
          <Html center>
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Loading Aiverse Commons...</span>
            </div>
          </Html>
        }>
          {/* Environment */}
          <SpatialEnvironment />

          {/* Scene Objects */}
          <Plaza />
          <DistrictPathways onDistrictSelect={handleDistrictTeleport} />
          <AICitizens />
          <ShopEntrances onShopEnter={handleShopEnter} />

          {/* Audio Proximity Handler */}
          {soundManager && (
            <AudioProximityHandler
              soundManager={soundManager}
              proximitySounds={proximitySounds}
              setProximitySounds={setProximitySounds}
            />
          )}

          {/* Camera Controls */}
          <OrbitControls
            enablePan={navigationMode === 'walk'}
            enableZoom={true}
            enableRotate={true}
            minDistance={3}
            maxDistance={50}
            maxPolarAngle={Math.PI / 2}
            target={[0, 0, 0]}
          />
        </Suspense>
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute top-4 left-4 z-10">
        <NavigationControls
          mode={navigationMode}
          onModeChange={setNavigationMode}
          onHomeClick={() => setCurrentDistrict(null)}
          isMuted={soundManager?.isMuted}
          onToggleMute={soundManager?.toggleMute}
        />
      </div>

      {/* District Info */}
      {currentDistrict && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-white bg-opacity-90 px-4 py-2 rounded-lg shadow">
            <h3 className="font-semibold text-lg capitalize">{currentDistrict} District</h3>
            <p className="text-sm text-gray-600">Explore and discover amazing experiences</p>
          </div>
        </div>
      )}

      {/* Shop Tour Modal */}
      {showTour && selectedShop && (
        <ShopTourViewer
          shopId={selectedShop}
          onClose={handleShopExit}
        />
      )}

      {/* Welcome Message */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-white bg-opacity-90 px-6 py-3 rounded-lg shadow text-center">
          <h2 className="font-bold text-xl mb-1">Welcome to Aiverse Commons</h2>
          <p className="text-sm text-gray-600">Explore, discover, and shop in our living 3D marketplace</p>
        </div>
      </div>
    </div>
  );
}