"use client";

import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

type VisualLayerRendererProps = {
  strength?: number; // 0..1
  tint?: string; // hex color
};

const OverlayShaderMaterial = ({ strength = 0.6, tint = "#FFC87A" }: any) => {
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  // Convert hex to vec3
  const hexToVec3 = (hex: string) => {
    const c = new THREE.Color(hex);
    return [c.r, c.g, c.b];
  };

  useFrame(({ clock }) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.u_time.value = clock.getElapsedTime();
  });

  return (
    <shaderMaterial
      ref={materialRef}
      transparent
      depthWrite={false}
      uniforms={{
        u_time: { value: 0 },
        u_strength: { value: strength },
        u_tint: { value: new THREE.Color(tint) },
        u_resolution: { value: new THREE.Vector2(800, 600) },
      }}
      vertexShader={/* glsl */ `
        varying vec2 vUv;
        void main(){
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `}
      fragmentShader={/* glsl */ `
        precision mediump float;
        uniform float u_time;
        uniform float u_strength;
        uniform vec3 u_tint;
        varying vec2 vUv;

        // Simple pseudo-random noise
        float rand(vec2 co){
          return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
        }

        void main(){
          // radial vignette
          vec2 uv = vUv - 0.5;
          float dist = length(uv);
          float vignette = smoothstep(0.5, 0.2, dist);

          // animated noise
          float n = rand(uv * 10.0 + u_time * 0.05);
          float fog = smoothstep(0.0, 1.0, (n - 0.4) * u_strength * 2.0);

          vec3 color = mix(vec3(0.0), u_tint, fog * 0.7);

          // final alpha influenced by vignette and strength
          float alpha = fog * vignette;
          gl_FragColor = vec4(color, alpha);
        }
      `}
      // @ts-ignore three types don't include this prop on shaderMaterial JSX
      blending={THREE.AdditiveBlending}
    />
  );
};

export default function VisualLayerRenderer({ strength = 0.6, tint = "#FFC87A" }: VisualLayerRendererProps) {
  return (
    <div style={{ width: "100%", height: "500px", borderRadius: 12, overflow: "hidden", background: "#111" }}>
      <Canvas camera={{ position: [0, 1.5, 3], fov: 55 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 7]} intensity={1.0} />

        <mesh position={[0, 0.6, 0]} rotation={[0.4, 0.6, 0]}> 
          <boxGeometry args={[1.2, 1.2, 1.2]} />
          <meshStandardMaterial color="#8B5CF6" metalness={0.4} roughness={0.2} />
        </mesh>

        <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#111" metalness={0.0} roughness={1} />
        </mesh>

        {/* Fullscreen overlay quad */}
        <mesh position={[0, 0, 1]} scale={[4, 2.5, 1]}>
          <planeGeometry args={[1, 1]} />
          <OverlayShaderMaterial strength={strength} tint={tint} />
        </mesh>

        <OrbitControls enablePan={false} minDistance={2} maxDistance={10} />
      </Canvas>
    </div>
  );
}
