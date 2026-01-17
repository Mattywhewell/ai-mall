'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { MapPin, Users, ShoppingBag, Home, RotateCcw } from 'lucide-react';

import { NavigationControls } from './NavigationControls';
import { ShopTourViewer } from './ShopTourViewer';

// Dynamically load the heavy 3D scene so the module and its dependencies (three, fiber, drei) are only imported when needed
const HeavySpatialScene = dynamic(() => import('./HeavySpatialScene'), {
  ssr: false,
  loading: () => <div className="p-4">Loading 3D preview...</div>,
});

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

  // CI / test-friendly flag: when NEXT_PUBLIC_DISABLE_3D is set at build time (or force via query param), render a lightweight static preview instead of importing three.js
  const disable3D = (process.env.NEXT_PUBLIC_DISABLE_3D === 'true') || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('forceNoWebGL') === 'true');

  return (
    <div className={`relative w-full h-full bg-gradient-to-b from-sky-200 to-sky-100 ${className}`}>
      {/* 3D Canvas or fallback preview */}
      {disable3D ? (
        <div className="w-full h-full flex items-center justify-center">
          <img src="/shader-previews/runic-medium.svg" alt="Runic glow preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) : (
        <HeavySpatialScene
          navigationMode={navigationMode}
          onShopEnter={handleShopEnter}
          onShopExit={handleShopExit}
          onDistrictTeleport={handleDistrictTeleport}
        />
      )}

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