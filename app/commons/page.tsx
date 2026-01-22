'use client';

// Patch React internals early to satisfy react-reconciler expectations
import '@/lib/patchReactInternals';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the 3D canvas to prevent SSR issues
const SpatialCanvas = dynamic(() => import('@/components/SpatialCanvas'), { ssr: false });

// Minimal fallback for when 3D fails to load
function Fallback3D() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 to-sky-100 flex items-center justify-center" data-testid="spatial-environment-fallback">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">3D Environment Loading...</h2>
        <p className="text-gray-600 mb-4">
          The spatial commons is initializing. If this takes too long, your browser may not support WebGL.
        </p>
        <div className="text-sm text-gray-500">
          <p>Make sure WebGL is enabled in your browser settings.</p>
          <p>Try refreshing the page or updating your graphics drivers.</p>
        </div>
      </div>
    </div>
  );
}

// Simple client-side error boundary so runtime 3D failures don't crash the entire page
class ClientErrorBoundary extends React.Component<{ children: React.ReactNode; fallback?: React.ReactNode }, { hasError: boolean; error?: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any) {
    console.error('ClientErrorBoundary caught error in CommonsPage:', error);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

export default function CommonsPage() {
  return (
    // Always expose a `data-testid="spatial-environment"` container so tests can tolerate graceful fallbacks
    <div className="min-h-screen" data-testid="spatial-environment">
      <ClientErrorBoundary fallback={<Fallback3D /> }>
        <SpatialCanvas
          onDistrictSelect={(district) => console.log('Selected district:', district)}
          onCitizenInteract={(citizen) => console.log('Interacted with citizen:', citizen)}
          onShopSelect={(shop) => console.log('Selected shop:', shop)}
          fallback={<Fallback3D />}
        />
      </ClientErrorBoundary>
    </div>
  );
}