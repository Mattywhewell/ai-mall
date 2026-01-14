'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PortalEffectProps {
  position?: [number, number, number];
  scale?: number;
  color?: string;
}

export function PortalEffect({ position = [0, 0, 0], scale = 1, color = '#6600ff' }: PortalEffectProps) {
  const portalRef = useRef<THREE.Group>(null);
  const ringsRef = useRef<THREE.Group>(null);

  // Portal shader material
  const portalMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(color) },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;

        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        varying vec2 vUv;
        varying vec3 vPosition;

        void main() {
          float dist = length(vUv - 0.5);
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);

          float wave = sin(time * 5.0 + dist * 20.0) * 0.5 + 0.5;
          vec3 finalColor = color * wave;

          gl_FragColor = vec4(finalColor, alpha * 0.8);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });
  }, [color]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (portalRef.current) {
      portalRef.current.rotation.z = time * 0.2;
    }

    if (ringsRef.current) {
      ringsRef.current.children.forEach((ring, index) => {
        ring.rotation.x = time * (0.5 + index * 0.1);
        ring.rotation.y = time * (0.3 + index * 0.15);
      });
    }

    // Update shader time
    portalMaterial.uniforms.time.value = time;
  });

  return (
    <group ref={portalRef} position={position} scale={scale}>
      {/* Main portal disc */}
      <mesh>
        <circleGeometry args={[2, 32]} />
        <primitive object={portalMaterial} />
      </mesh>

      {/* Energy rings */}
      <group ref={ringsRef}>
        {Array.from({ length: 3 }, (_, i) => (
          <mesh key={i} position={[0, 0, i * 0.1]}>
            <torusGeometry args={[2 + i * 0.3, 0.05, 8, 32]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.4 - i * 0.1}
              emissive={color}
              emissiveIntensity={0.2}
            />
          </mesh>
        ))}
      </group>

      {/* Portal particles */}
      {Array.from({ length: 50 }, (_, i) => {
        const angle = (i / 50) * Math.PI * 2;
        const radius = 1.5 + Math.random() * 0.5;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = (Math.random() - 0.5) * 0.2;

        return (
          <mesh key={`particle-${i}`} position={[x, y, z]}>
            <sphereGeometry args={[0.02]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.6}
              emissive={color}
              emissiveIntensity={0.8}
            />
          </mesh>
        );
      })}

      {/* Inner vortex effect */}
      <mesh position={[0, 0, -0.1]}>
        <cylinderGeometry args={[0.5, 1.8, 0.1, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

interface PortalEffectsProps {
  portals?: Array<{
    position: [number, number, number];
    scale?: number;
    color?: string;
  }>;
}

export function PortalEffects({
  portals = [
    { position: [0, -2, 8], scale: 1.5, color: '#6600ff' },
    { position: [-10, 1, -5], scale: 1, color: '#ff6600' },
    { position: [10, 1, -5], scale: 1, color: '#00ff66' },
  ]
}: PortalEffectsProps) {
  return (
    <group>
      {portals.map((portal, index) => (
        <PortalEffect key={index} {...portal} />
      ))}
    </group>
  );
}