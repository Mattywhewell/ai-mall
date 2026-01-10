'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';

export function Plaza() {
  const plazaRef = useRef<THREE.Group>(null);
  const [visitorCount] = useState(Math.floor(Math.random() * 50) + 10);

  // Gentle floating animation for the central monument
  useFrame((state) => {
    if (plazaRef.current) {
      plazaRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.2) * 0.1;
      plazaRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.05;
    }
  });

  return (
    <group ref={plazaRef}>
      {/* Central Monument */}
      <group position={[0, 2, 0]}>
        {/* Base */}
        <mesh position={[0, -1, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[3, 3.5, 2, 16]} />
          <meshStandardMaterial color="#F5F5DC" />
        </mesh>

        {/* Pillar */}
        <mesh position={[0, 1, 0]} castShadow>
          <cylinderGeometry args={[0.5, 0.8, 4, 12]} />
          <meshStandardMaterial color="#DAA520" />
        </mesh>

        {/* Top */}
        <mesh position={[0, 3.5, 0]} castShadow>
          <sphereGeometry args={[0.8, 16, 12]} />
          <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.1} />
        </mesh>

        {/* Welcome Text */}
        <Text
          position={[0, 5, 0]}
          fontSize={0.5}
          color="#2F4F4F"
          anchorX="center"
          anchorY="middle"
          font="/fonts/inter.woff"
        >
          Aiverse Commons
        </Text>
      </group>

      {/* Plaza Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[15, 32]} />
        <meshStandardMaterial
          color="#F5F5DC"
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Decorative Elements */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const x = Math.cos(angle) * 12;
        const z = Math.sin(angle) * 12;

        return (
          <group key={i} position={[x, 0.5, z]}>
            {/* Small pillars around the plaza */}
            <mesh castShadow>
              <cylinderGeometry args={[0.3, 0.4, 1, 8]} />
              <meshStandardMaterial color="#8B4513" />
            </mesh>
            {/* Top ornament */}
            <mesh position={[0, 0.8, 0]}>
              <sphereGeometry args={[0.2, 8, 6]} />
              <meshStandardMaterial color="#FFD700" />
            </mesh>
          </group>
        );
      })}

      {/* Visitor Counter */}
      <Html position={[0, 6, 0]} center>
        <div className="bg-white bg-opacity-90 px-3 py-1 rounded-lg shadow text-sm">
          <div className="flex items-center space-x-1">
            <span>👥</span>
            <span>{visitorCount} visitors exploring</span>
          </div>
        </div>
      </Html>

      {/* Emotional Weather Effect */}
      <EmotionalWeather />
    </group>
  );
}

// Emotional weather system - particles that respond to collective mood
function EmotionalWeather() {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 50;

  // Create particle system
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 30;
    positions[i * 3 + 1] = Math.random() * 10 + 2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 30;

    // Warm, positive colors
    colors[i * 3] = 1; // R
    colors[i * 3 + 1] = Math.random() * 0.5 + 0.5; // G
    colors[i * 3 + 2] = Math.random() * 0.3; // B
  }

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.002;
      // Gentle floating motion
      const time = state.clock.getElapsedTime();
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += Math.sin(time + i) * 0.001;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}