'use client';

import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface CameraRigProps {
  target?: [number, number, number];
  radius?: number;
  height?: number;
  speed?: number;
  autoRotate?: boolean;
}

export function CameraRig({
  target = [0, 0, 0],
  radius = 15,
  height = 5,
  speed = 0.5,
  autoRotate = true
}: CameraRigProps) {
  const { camera } = useThree();
  const rigRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (rigRef.current && autoRotate) {
      const time = state.clock.getElapsedTime();

      // Circular camera movement
      const angle = time * speed;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = height + Math.sin(time * 0.3) * 2;

      rigRef.current.position.set(x, y, z);
      camera.lookAt(target[0], target[1], target[2]);
    }
  });

  return <group ref={rigRef} />;
}

interface CameraRigsProps {
  mode?: 'orbit' | 'follow' | 'cinematic';
  target?: [number, number, number];
}

export function CameraRigs({ mode = 'orbit', target = [0, 0, 0] }: CameraRigsProps) {
  const { camera, controls } = useThree();

  useEffect(() => {
    if (controls) {
      // Configure controls based on mode
      switch (mode) {
        case 'orbit':
          // Standard orbit controls
          break;
        case 'follow':
          // Follow mode - camera follows target
          break;
        case 'cinematic':
          // Cinematic mode - smooth, controlled movement
          if (controls.enableDamping) {
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
          }
          break;
      }
    }
  }, [mode, controls]);

  return (
    <group>
      {mode === 'cinematic' && (
        <CameraRig
          target={target}
          radius={20}
          height={8}
          speed={0.2}
          autoRotate={false}
        />
      )}
      {mode === 'orbit' && (
        <CameraRig
          target={target}
          radius={12}
          height={3}
          speed={0.3}
          autoRotate={true}
        />
      )}
    </group>
  );
}