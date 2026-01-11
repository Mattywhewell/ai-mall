'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
// import { Sky, Environment } from '@react-three/drei';
import * as THREE from 'three';

export function SpatialEnvironment() {
  const lightRef = useRef<THREE.DirectionalLight>(null);

  // Animate sun position for dynamic lighting
  useFrame((state) => {
    if (lightRef.current) {
      const time = state.clock.getElapsedTime();
      // Subtle sun movement for dynamic shadows
      lightRef.current.position.x = Math.sin(time * 0.1) * 10;
      lightRef.current.position.z = Math.cos(time * 0.1) * 10;
    }
  });

  return (
    <>
      {/* Sky component - disabled due to Polygon namespace issues */}
      {/* <Sky
        distance={450000}
        sunPosition={[0, 1, 0]}
        inclination={0.49}
        azimuth={0.25}
      /> */}

      {/* Simple gradient sky background */}
      <color attach="background" args={['#87CEEB']} />

      {/* Simple cloud effect using basic geometry */}
      <group position={[0, 8, 0]}>
        <mesh>
          <sphereGeometry args={[3, 8, 6]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.3} />
        </mesh>
        <mesh position={[2, 0, 0]}>
          <sphereGeometry args={[2.5, 8, 6]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.3} />
        </mesh>
        <mesh position={[-2, 0, 0]}>
          <sphereGeometry args={[2.5, 8, 6]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.3} />
        </mesh>
      </group>

      {/* Lighting */}
      <ambientLight intensity={0.3} color="#87CEEB" />
      <directionalLight
        ref={lightRef}
        position={[10, 10, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        color="#FFF8DC"
      />

      {/* Fill light */}
      <directionalLight
        position={[-5, 5, -5]}
        intensity={0.4}
        color="#FFE4B5"
      />

      {/* Environment component - disabled due to Polygon namespace issues */}
      {/* <Environment preset="sunset" /> */}

      {/* Atmospheric fog */}
      <fog attach="fog" args={['#87CEEB', 30, 100]} />

      {/* Ground plane for shadows */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshLambertMaterial color="#90EE90" transparent opacity={0.3} />
      </mesh>
    </>
  );
}