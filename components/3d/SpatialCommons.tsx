'use client';

import { useState, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
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

export function SpatialCommons({ className = '' }: SpatialCommonsProps) {
  const [navigationMode, setNavigationMode] = useState<'walk' | 'teleport'>('walk');
  const [selectedShop, setSelectedShop] = useState<string | null>(null);
  const [showTour, setShowTour] = useState(false);
  const [currentDistrict, setCurrentDistrict] = useState<string | null>(null);

  const handleShopEnter = (shopId: string) => {
    setSelectedShop(shopId);
    setShowTour(true);
  };

  const handleShopExit = () => {
    setSelectedShop(null);
    setShowTour(false);
  };

  const handleDistrictTeleport = (districtId: string) => {
    setCurrentDistrict(districtId);
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