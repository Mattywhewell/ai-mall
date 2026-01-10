'use client';

import { useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Html } from '@react-three/drei';
import { Loader2 } from 'lucide-react';
import * as THREE from 'three';

interface ModelViewerProps {
  modelUrl: string;
  className?: string;
  autoRotate?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
}

// Model component that loads and displays GLTF/GLB models
function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const meshRef = useRef<THREE.Group>(null);

  // Clone the scene to avoid modifying the original
  const clonedScene = scene.clone();

  // Center and scale the model
  useEffect(() => {
    if (clonedScene) {
      // Compute bounding box to center the model
      const box = new THREE.Box3().setFromObject(clonedScene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      // Center the model
      clonedScene.position.sub(center);

      // Scale to fit in view (assuming camera distance of ~5)
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = maxDim > 0 ? 3 / maxDim : 1;
      clonedScene.scale.setScalar(scale);

      // Ensure materials are properly set up
      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.material) {
            // Ensure material properties are set
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => {
                mat.needsUpdate = true;
              });
            } else {
              child.material.needsUpdate = true;
            }
          }
        }
      });
    }
  }, [clonedScene]);

  return <primitive ref={meshRef} object={clonedScene} />;
}

// Loading fallback component
function Loader() {
  return (
    <Html center>
      <div className="flex items-center space-x-2 bg-white bg-opacity-90 px-4 py-2 rounded-lg shadow">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading 3D model...</span>
      </div>
    </Html>
  );
}

// Error fallback component
function ErrorFallback() {
  return (
    <Html center>
      <div className="flex flex-col items-center space-y-2 bg-white bg-opacity-90 px-4 py-2 rounded-lg shadow">
        <div className="text-red-500 text-2xl">⚠️</div>
        <span className="text-sm text-gray-700">Failed to load 3D model</span>
      </div>
    </Html>
  );
}

// Camera setup component
function CameraSetup() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return null;
}

export function ModelViewer({
  modelUrl,
  className = '',
  autoRotate = true,
  enableZoom = true,
  enablePan = true
}: ModelViewerProps) {
  return (
    <div className={`w-full h-full bg-gray-100 rounded-lg overflow-hidden ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
        dpr={[1, 2]}
      >
        <CameraSetup />

        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight
          position={[-10, -10, -5]}
          intensity={0.5}
        />

        {/* Environment for reflections */}
        <Environment preset="studio" />

        {/* Controls */}
        <OrbitControls
          enableZoom={enableZoom}
          enablePan={enablePan}
          autoRotate={autoRotate}
          autoRotateSpeed={0.5}
          minDistance={2}
          maxDistance={10}
          maxPolarAngle={Math.PI}
        />

        {/* Model */}
        <Suspense fallback={<Loader />}>
          <Model url={modelUrl} />
        </Suspense>

        {/* Ground plane for reference */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial color="#f0f0f0" transparent opacity={0.3} />
        </mesh>
      </Canvas>
    </div>
  );
}

// Hook to preload GLTF models
export function useGLTFPreload(url: string) {
  useGLTF(url);
}