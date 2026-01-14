'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import { useSoundManager } from '@/lib/sound/SoundManager';
import { SpatialEnvironment } from '@/components/3d/SpatialEnvironment';
import { Plaza } from '@/components/3d/Plaza';
import { NavigationControls } from '@/components/3d/NavigationControls';
import { ParticleField } from '@/components/3d/ParticleField';
import { GatewayCore } from '@/components/3d/GatewayCore';
import { SpatialAudioNodes } from '@/components/3d/SpatialAudioNodes';
import { AnimatedNavigationNodes } from '@/components/3d/AnimatedNavigationNodes';
import { PortalEffects } from '@/components/3d/PortalEffects';
import { CameraRigs } from '@/components/3d/CameraRigs';
import { DistortionShaders } from '@/components/3d/DistortionShaders';

function SceneContent() {
  const { initializeAudio, isInitialized } = useSoundManager();

  const handleNavigation = (destination: string) => {
    console.log('Navigating to:', destination);
  };

  return (
    <>
      <SpatialEnvironment />
      <ParticleField count={1500} radius={60} color="#00ffff" size={0.03} />
      <GatewayCore position={[0, 2, 0]} scale={1.2} />
      <SpatialAudioNodes />
      <AnimatedNavigationNodes onNavigate={handleNavigation} />
      <PortalEffects />
      <DistortionShaders />
      <CameraRigs mode="orbit" target={[0, 2, 0]} />
      <Plaza />
      <Stars radius={300} depth={100} count={500} factor={6} saturation={0} fade speed={0.5} />
      <NavigationControls />

      {!isInitialized && (
        <Html center>
          <div className="bg-black/80 text-white p-4 rounded-lg border border-cyan-500">
            <button
              onClick={initializeAudio}
              className="bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded font-semibold transition-colors"
            >
              Initialize Audio Experience
            </button>
            <p className="text-sm mt-2 text-cyan-300">Enable spatial audio for the full City Gate experience</p>
          </div>
        </Html>
      )}

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

export default function CityGate3D() {
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
          powerPreference: 'high-performance'
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
