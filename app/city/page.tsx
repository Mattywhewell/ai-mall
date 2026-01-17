'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import the 3D scene to avoid SSR issues
const CityGateScene = dynamic(() => import('./CityGateScene'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-cyan-300 text-lg">Initializing Aiverse Gateway...</p>
      </div>
    </div>
  )
});

// Main page component
export default function CityGatePage() {
  const disable3D = process.env.NEXT_PUBLIC_DISABLE_3D === '1';

  if (disable3D) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl text-white font-bold">AI City (3D disabled for debugging)</h2>
          <p className="text-cyan-300 mt-4">The immersive 3D gateway is temporarily disabled while we investigate a client-side issue.</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-cyan-300 text-lg">Loading gateway...</p>
        </div>
      </div>
    }>
      <CityGateScene />
    </Suspense>
  );
}
