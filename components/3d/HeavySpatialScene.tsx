'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';

// Sub-components (kept inside heavy module so they're not imported unless needed)
import { SpatialEnvironment } from './SpatialEnvironment';
import { Plaza } from './Plaza';
import { DistrictPathways } from './DistrictPathways';
import { AICitizens } from './AICitizens';
import { ShopEntrances } from './ShopEntrances';

interface HeavySpatialSceneProps {
  navigationMode: 'walk' | 'teleport';
  onShopEnter: (shopId: string) => void;
  onShopExit: () => void;
  onDistrictTeleport: (districtId: string) => void;
}

export default function HeavySpatialScene({ navigationMode, onShopEnter, onShopExit, onDistrictTeleport }: HeavySpatialSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 5, 10], fov: 60, near: 0.1, far: 1000 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
      shadows
    >
      <React.Suspense fallback={
        <Html center>
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Loading Aiverse Commons...</span>
          </div>
        </Html>
      }>
        <SpatialEnvironment />

        <Plaza />
        <DistrictPathways onDistrictSelect={onDistrictTeleport} />
        <AICitizens />
        <ShopEntrances onShopEnter={onShopEnter} />

        <OrbitControls
          enablePan={navigationMode === 'walk'}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={50}
          maxPolarAngle={Math.PI / 2}
          target={[0, 0, 0]}
        />
      </React.Suspense>
    </Canvas>
  );
}
