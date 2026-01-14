'use client';

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

interface NavigationNodeProps {
  position: [number, number, number];
  label: string;
  destination: string;
  onClick?: () => void;
  color?: string;
}

function NavigationNode({ position, label, destination, onClick, color = '#00ff88' }: NavigationNodeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.getElapsedTime();

      // Bobbing animation
      groupRef.current.position.y = position[1] + Math.sin(time * 2 + position[0] * 0.1) * 0.1;

      // Rotation
      groupRef.current.rotation.y = time * 0.5;

      // Scale on hover
      const targetScale = hovered ? 1.2 : 1;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {/* Main node geometry */}
      <mesh>
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.5 : 0.2}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Energy ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.05, 8, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered ? 0.6 : 0.3}
        />
      </mesh>

      {/* Label */}
      <Text
        position={[0, 0.8, 0]}
        fontSize={0.15}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {label}
      </Text>

      {/* Connection lines to center */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, 0, -position[0] * 0.3, -position[1] * 0.3, -position[2] * 0.3])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.4} />
      </line>
    </group>
  );
}

interface AnimatedNavigationNodesProps {
  onNavigate?: (destination: string) => void;
}

export function AnimatedNavigationNodes({ onNavigate }: AnimatedNavigationNodesProps) {
  const nodes = [
    { position: [-8, 2, -8] as [number, number, number], label: 'Plaza', destination: '/plaza' },
    { position: [8, 2, -8] as [number, number, number], label: 'Market', destination: '/market' },
    { position: [0, 4, -10] as [number, number, number], label: 'AI City', destination: '/ai-city' },
    { position: [-6, 1, 6] as [number, number, number], label: 'Creator Hub', destination: '/creator' },
    { position: [6, 1, 6] as [number, number, number], label: 'Commerce', destination: '/commerce' },
    { position: [0, -2, 8] as [number, number, number], label: 'Portal', destination: '/portal' },
  ];

  return (
    <group>
      {nodes.map((node, index) => (
        <NavigationNode
          key={index}
          {...node}
          onClick={() => onNavigate?.(node.destination)}
        />
      ))}
    </group>
  );
}