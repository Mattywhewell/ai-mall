'use client';

import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSoundManager } from '@/lib/sound/SoundManager';

interface SpatialAudioNodeProps {
  position: [number, number, number];
  frequency: number;
  amplitude: number;
  color?: string;
}

function SpatialAudioNode({ position, frequency, amplitude, color = '#ff00ff' }: SpatialAudioNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { audioContext, analyser } = useSoundManager();

  useFrame((state) => {
    if (meshRef.current && analyser) {
      const time = state.clock.getElapsedTime();

      // Get frequency data
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);

      // Map frequency to array index
      const freqIndex = Math.floor((frequency / 22050) * dataArray.length);
      const intensity = dataArray[freqIndex] / 255;

      // Animate based on audio
      const scale = 0.5 + intensity * amplitude;
      meshRef.current.scale.setScalar(scale);

      // Color shift based on intensity
      const hue = (intensity * 360 + time * 50) % 360;
      meshRef.current.material.color.setHSL(hue / 360, 0.8, 0.6);

      // Gentle floating motion
      meshRef.current.position.y = position[1] + Math.sin(time * 2 + position[0]) * 0.2;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
        transparent
        opacity={0.7}
      />
    </mesh>
  );
}

interface SpatialAudioNodesProps {
  nodes?: Array<{
    position: [number, number, number];
    frequency: number;
    amplitude: number;
    color?: string;
  }>;
}

export function SpatialAudioNodes({
  nodes = [
    { position: [-5, 2, -5], frequency: 440, amplitude: 2, color: '#ff00ff' },
    { position: [5, 2, -5], frequency: 880, amplitude: 1.5, color: '#00ffff' },
    { position: [0, 3, 5], frequency: 220, amplitude: 2.5, color: '#ffff00' },
    { position: [-3, 1, 3], frequency: 660, amplitude: 1.8, color: '#ff6600' },
    { position: [3, 1, 3], frequency: 1100, amplitude: 1.2, color: '#6600ff' },
  ]
}: SpatialAudioNodesProps) {
  return (
    <group>
      {nodes.map((node, index) => (
        <SpatialAudioNode key={index} {...node} />
      ))}
    </group>
  );
}