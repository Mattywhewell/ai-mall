'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleFieldProps {
  count?: number;
  radius?: number;
  color?: string;
  size?: number;
}

export function ParticleField({
  count = 1000,
  radius = 50,
  color = '#00ffff',
  size = 0.02
}: ParticleFieldProps) {
  const particlesRef = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Create spherical distribution
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      const r = radius * Math.cbrt(Math.random());

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Energy-based coloring
      const energy = Math.random();
      colors[i * 3] = energy * 0.5 + 0.5; // R
      colors[i * 3 + 1] = energy * 0.8 + 0.2; // G
      colors[i * 3 + 2] = energy + 0.5; // B
    }

    return { positions, colors };
  }, [count, radius]);

  useFrame((state) => {
    if (particlesRef.current) {
      const time = state.clock.getElapsedTime();

      // Orbital rotation
      particlesRef.current.rotation.y = time * 0.05;
      particlesRef.current.rotation.x = Math.sin(time * 0.03) * 0.1;

      // Pulsing effect
      const pulse = Math.sin(time * 2) * 0.1 + 0.9;
      particlesRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}