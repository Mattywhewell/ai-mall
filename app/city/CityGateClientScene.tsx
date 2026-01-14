'use client';

import React, { Suspense } from 'react';
// Heavy 3D modules are dynamically imported in production via CityGate3D to avoid bundling/execution
// during E2E runs (which can trigger reconciler/runtime issues). See CityGate3D.tsx
const CityGate3D = React.lazy(() => import('./CityGate3D'));


function SceneContent() {
  const { initializeAudio, isInitialized } = useSoundManager();

  const handleNavigation = (destination: string) => {
    console.log('Navigating to:', destination);
    // Implement navigation logic here
  };

  return (
    <>
      {/* Lighting and Environment */}
      <SpatialEnvironment />

      {/* Particle Field */}
      <ParticleField count={1500} radius={60} color="#00ffff" size={0.03} />

      {/* Gateway Core */}
      <GatewayCore position={[0, 2, 0]} scale={1.2} />

      {/* Spatial Audio Nodes */}
      <SpatialAudioNodes />

      {/* Animated Navigation Nodes */}
      <AnimatedNavigationNodes onNavigate={handleNavigation} />

      {/* Portal Effects */}
      <PortalEffects />

      {/* Distortion Shaders */}
      <DistortionShaders />

      {/* Camera Rigs */}
      <CameraRigs mode="orbit" target={[0, 2, 0]} />

      {/* Plaza with Emotional Weather */}
      <Plaza />

      {/* Stars background */}
      <Stars radius={300} depth={100} count={500} factor={6} saturation={0} fade speed={0.5} />

      {/* Navigation Controls */}
      <NavigationControls />

      {/* Audio initialization button */}
      {!isInitialized && (
        <Html center>
          <div className="bg-black/80 text-white p-4 rounded-lg border border-cyan-500">
            <button
              onClick={initializeAudio}
              className="bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded font-semibold transition-colors"
            >
              Initialize Audio Experience
            </button>
            <p className="text-sm mt-2 text-cyan-300">
              Enable spatial audio for the full City Gate experience
            </p>
          </div>
        </Html>
      )}

      {/* Orbit Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={8}
        maxDistance={50}
        autoRotate={true}
        autoRotateSpeed={0.3}
        dampingFactor={0.05}
        enableDamping={true}
      />
    </>
  );
}

function LoadingFallback() {
  return (
    <Html center>
      <div className="bg-black/90 text-cyan-400 p-6 rounded-lg border border-cyan-500">
        <div className="animate-pulse">Loading City Gate...</div>
      </div>
    </Html>
  );
}

export default function CityGateClientScene() {
  // Allow E2E to disable heavy 3D rendering via query param to avoid reconciler/runtime flakiness
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('e2e_disable_3d') === 'true') {
        return (
          <div className="h-full w-full bg-black flex items-center justify-center">
            <div className="text-white">3D disabled for E2E</div>
          </div>
        );
      }
    } catch (e) {
      // ignore malformed URLs and continue to render normally
    }
  }

  return (
    <div className="h-full w-full bg-black overflow-hidden">
      <Canvas
        camera={{
          position: [0, 5, 20],
          fov: 60,
          near: 0.1,
          far: 1000
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance"
        }}
        dpr={[1, 2]}
      >
        <Suspense fallback={<LoadingFallback />}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
}
