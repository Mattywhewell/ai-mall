"use client";

import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { OrbitControls, Html, Text } from '@react-three/drei';
import * as THREE from 'three';
import dynamic from 'next/dynamic';

// Extend THREE.js objects globally for all drei components - MUST be at module level
extend({
  // Add Polygon as ShapeGeometry (drei expects this)
  Polygon: THREE.ShapeGeometry,

  // Sides
  BackSide: THREE.BackSide,
  FrontSide: THREE.FrontSide,
  DoubleSide: THREE.DoubleSide,

  // Materials
  ShaderMaterial: THREE.ShaderMaterial,
  MeshBasicMaterial: THREE.MeshBasicMaterial,
  MeshStandardMaterial: THREE.MeshStandardMaterial,
  MeshLambertMaterial: THREE.MeshLambertMaterial,
  MeshPhongMaterial: THREE.MeshPhongMaterial,
  MeshPhysicalMaterial: THREE.MeshPhysicalMaterial,
  LineBasicMaterial: THREE.LineBasicMaterial,
  PointsMaterial: THREE.PointsMaterial,
  SpriteMaterial: THREE.SpriteMaterial,

  // Geometries
  BufferGeometry: THREE.BufferGeometry,
  BoxGeometry: THREE.BoxGeometry,
  SphereGeometry: THREE.SphereGeometry,
  CylinderGeometry: THREE.CylinderGeometry,
  PlaneGeometry: THREE.PlaneGeometry,
  CircleGeometry: THREE.CircleGeometry,
  ConeGeometry: THREE.ConeGeometry,
  TorusGeometry: THREE.TorusGeometry,
  RingGeometry: THREE.RingGeometry,
  Shape: THREE.Shape,
  ExtrudeGeometry: THREE.ExtrudeGeometry,
  ShapeGeometry: THREE.ShapeGeometry,
  LatheGeometry: THREE.LatheGeometry,
  TubeGeometry: THREE.TubeGeometry,

  // Other common objects
  Color: THREE.Color,
  Vector3: THREE.Vector3,
  Euler: THREE.Euler,
  Quaternion: THREE.Quaternion,
});

// Temporarily disable complex components to isolate the Polygon issue
const ENABLE_COMPLEX_COMPONENTS = true;

// Dynamically import our enhanced 3D components to isolate runtime errors and avoid SSR
const EnhancedSpatialEnvironment = dynamic(
  () => import('./3d/SpatialEnvironment').then((mod) => mod.SpatialEnvironment),
  { ssr: false }
);
const EnhancedPlaza = dynamic(() => import('./3d/Plaza').then((mod) => mod.Plaza), { ssr: false });
const EnhancedDistrictPathways = dynamic(
  () => import('./3d/DistrictPathways').then((mod) => mod.DistrictPathways),
  { ssr: false }
);
const EnhancedAICitizens = dynamic(() => import('./3d/AICitizens').then((mod) => mod.AICitizens), { ssr: false });
const EnhancedShopEntrances = dynamic(() => import('./3d/ShopEntrances').then((mod) => mod.ShopEntrances), { ssr: false });
const EnhancedNavigationControls = dynamic(
  () => import('./3d/NavigationControls').then((mod) => mod.NavigationControls),
  { ssr: false }
);
const EnhancedShopTourViewer = dynamic(() => import('./3d/ShopTourViewer').then((mod) => mod.ShopTourViewer), { ssr: false });

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
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Three.js component error in ${this.props.componentName || 'unknown'}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <mesh>
          <Html center>
            <div className="text-red-400">
              3D Component Error: {this.props.componentName || 'Unknown'}
            </div>
          </Html>
        </mesh>
      );
    }

    return this.props.children;
  }
}

interface SpatialCanvasProps {
  onDistrictSelect?: (districtId: string) => void;
  onShopSelect?: (shopId: string) => void;
  onCitizenInteract?: (citizenId: string) => void;
  navigationMode?: 'walk' | 'teleport';
}

// Walk Controls Component for first-person movement
function WalkControls() {
  const { camera } = useThree();
  const keysPressed = useRef<Set<string>>(new Set());
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      keysPressed.current.add(event.code.toLowerCase());
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      keysPressed.current.delete(event.code.toLowerCase());
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement) {
        const sensitivity = 0.002;
        camera.rotation.y -= event.movementX * sensitivity;
        camera.rotation.x -= event.movementY * sensitivity;
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
      }
    };

    const handleClick = () => {
      document.body.requestPointerLock();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick);
      document.exitPointerLock();
    };
  }, [camera]);

  useFrame((state, delta) => {
    // Reset velocity
    velocity.current.set(0, 0, 0);

    // Calculate movement direction based on camera rotation
    direction.current.set(0, 0, -1);
    direction.current.applyEuler(camera.rotation);
    direction.current.y = 0; // Keep movement horizontal
    direction.current.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(direction.current, camera.up).normalize();

    // Handle keyboard input
    const speed = 10 * delta; // Movement speed

    if (keysPressed.current.has('keyw') || keysPressed.current.has('arrowup')) {
      velocity.current.add(direction.current.clone().multiplyScalar(speed));
    }
    if (keysPressed.current.has('keys') || keysPressed.current.has('arrowdown')) {
      velocity.current.add(direction.current.clone().multiplyScalar(-speed));
    }
    if (keysPressed.current.has('keya') || keysPressed.current.has('arrowleft')) {
      velocity.current.add(right.clone().multiplyScalar(-speed));
    }
    if (keysPressed.current.has('keyd') || keysPressed.current.has('arrowright')) {
      velocity.current.add(right.clone().multiplyScalar(speed));
    }

    // Apply movement
    camera.position.add(velocity.current);

    // Keep camera above ground
    camera.position.y = Math.max(camera.position.y, 1.5);
  });

  return null;
}

export default function SpatialCanvas({ onDistrictSelect, onShopSelect, onCitizenInteract, navigationMode = 'teleport' }: SpatialCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 5, 10], fov: 75 }}
      shadows
      className="w-full h-full"
      onCreated={({ gl }) => {
        console.log('Three.js canvas created successfully');
        gl.setClearColor('#000011');
      }}
      onError={(error) => {
        console.error('Three.js canvas error:', error);
      }}
    >
      {/* Walk Controls - only active in walk mode */}
      {navigationMode === 'walk' && <WalkControls />}

      {/* Orbit Controls - only active in teleport mode */}
      {navigationMode === 'teleport' && (
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={50}
          maxPolarAngle={Math.PI / 2}
        />
      )}

      <Suspense fallback={<Loading3DFallback />}>
        <ThreeErrorBoundary componentName="SpatialEnvironment">
          <EnhancedSpatialEnvironment />
        </ThreeErrorBoundary>
      </Suspense>

      <Suspense fallback={<Loading3DFallback />}>
        <ThreeErrorBoundary componentName="Plaza">
          <EnhancedPlaza />
        </ThreeErrorBoundary>
      </Suspense>

      <Suspense fallback={<Loading3DFallback />}>
        <ThreeErrorBoundary componentName="DistrictPathways">
          <EnhancedDistrictPathways onDistrictSelect={onDistrictSelect} />
        </ThreeErrorBoundary>
      </Suspense>

      <Suspense fallback={<Loading3DFallback />}>
        <ThreeErrorBoundary componentName="AICitizens">
          <EnhancedAICitizens onCitizenInteract={onCitizenInteract} />
        </ThreeErrorBoundary>
      </Suspense>

      <Suspense fallback={<Loading3DFallback />}>
        <ThreeErrorBoundary componentName="ShopEntrances">
          <EnhancedShopEntrances onShopSelect={onShopSelect} />
        </ThreeErrorBoundary>
      </Suspense>

      <Suspense fallback={<Loading3DFallback />}>
        <ThreeErrorBoundary componentName="NavigationControls">
          <EnhancedNavigationControls />
        </ThreeErrorBoundary>
      </Suspense>

      <Suspense fallback={<Loading3DFallback />}>
        <ThreeErrorBoundary componentName="ShopTourViewer">
          <EnhancedShopTourViewer />
        </ThreeErrorBoundary>
      </Suspense>
    </Canvas>
  );
}