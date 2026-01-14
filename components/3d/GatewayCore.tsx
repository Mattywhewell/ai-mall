'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface GatewayCoreProps {
  position?: [number, number, number];
  scale?: number;
}

export function GatewayCore({ position = [0, 0, 0], scale = 1 }: GatewayCoreProps) {
  const coreRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const crystalRef = useRef<THREE.Mesh>(null);

  // Custom shader material for distortion effect
  const distortionMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color('#00ffff') },
      },
      vertexShader: `
        uniform float time;
        varying vec3 vPosition;
        varying vec3 vNormal;

        void main() {
          vPosition = position;
          vNormal = normal;

          vec3 pos = position;
          float distortion = sin(time * 3.0 + position.y * 10.0) * 0.1;
          pos += normal * distortion;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        varying vec3 vPosition;
        varying vec3 vNormal;

        void main() {
          float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          float pulse = sin(time * 2.0) * 0.3 + 0.7;

          vec3 finalColor = color * fresnel * pulse;
          gl_FragColor = vec4(finalColor, 0.8);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (coreRef.current) {
      coreRef.current.rotation.y = time * 0.5;
    }

    if (ringRef.current) {
      ringRef.current.rotation.x = time * 0.3;
      ringRef.current.rotation.z = time * 0.2;
    }

    if (crystalRef.current) {
      crystalRef.current.rotation.y = -time * 0.8;
      crystalRef.current.scale.setScalar(1 + Math.sin(time * 4) * 0.1);
    }

    // Update shader time
    distortionMaterial.uniforms.time.value = time;
  });

  return (
    <group ref={coreRef} position={position} scale={scale}>
      {/* Outer energy ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[3, 0.1, 16, 100]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.6} />
      </mesh>

      {/* Inner crystal core */}
      <mesh ref={crystalRef}>
        <octahedronGeometry args={[1.5, 0]} />
        <primitive object={distortionMaterial} />
      </mesh>

      {/* Energy beams */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} rotation={[0, (i * Math.PI) / 4, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 4]} />
          <meshBasicMaterial
            color="#00ffff"
            transparent
            opacity={0.4}
            emissive="#004444"
          />
        </mesh>
      ))}

      {/* Floating particles around core */}
      {Array.from({ length: 20 }, (_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const radius = 2.5;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.sin(i * 0.5) * 0.5;

        return (
          <mesh key={`particle-${i}`} position={[x, y, z]}>
            <sphereGeometry args={[0.05]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.8}
              emissive="#00ffff"
              emissiveIntensity={0.5}
            />
          </mesh>
        );
      })}
    </group>
  );
}