'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';

interface DistrictPathwaysProps {
  onDistrictSelect: (districtId: string) => void;
}

interface District {
  id: string;
  name: string;
  color: string;
  position: [number, number, number];
  description: string;
  emoji: string;
}

const districts: District[] = [
  {
    id: 'wonder',
    name: 'Wonder',
    color: '#FFD700',
    position: [20, 0, 0],
    description: 'Discover amazing products and experiences',
    emoji: '✨'
  },
  {
    id: 'belonging',
    name: 'Belonging',
    color: '#FF69B4',
    position: [-20, 0, 0],
    description: 'Connect with communities and creators',
    emoji: '🤝'
  },
  {
    id: 'purpose',
    name: 'Purpose',
    color: '#4169E1',
    position: [0, 0, 20],
    description: 'Find meaning and make a difference',
    emoji: '🎯'
  }
];

export function DistrictPathways({ onDistrictSelect }: DistrictPathwaysProps) {
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);

  return (
    <group>
      {districts.map((district) => (
        <DistrictPathway
          key={district.id}
          district={district}
          isHovered={hoveredDistrict === district.id}
          onHover={setHoveredDistrict}
          onSelect={onDistrictSelect}
        />
      ))}
    </group>
  );
}

interface DistrictPathwayProps {
  district: District;
  isHovered: boolean;
  onHover: (districtId: string | null) => void;
  onSelect: (districtId: string) => void;
}

function DistrictPathway({ district, isHovered, onHover, onSelect }: DistrictPathwayProps) {
  const pathRef = useRef<THREE.Group>(null);
  const portalRef = useRef<THREE.Mesh>(null);

  // Animate the pathway
  useFrame((state) => {
    if (pathRef.current) {
      // Gentle pulsing effect
      const scale = 1 + Math.sin(state.clock.getElapsedTime() * 2 + district.position[0]) * 0.05;
      pathRef.current.scale.setScalar(scale);
    }

    if (portalRef.current && portalRef.current.material) {
      // Rotate the portal
      portalRef.current.rotation.y += 0.01;

      // Glow effect
      const material = portalRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = isHovered ? 0.3 : 0.1;
    }
  });

  // Create pathway points from center to district
  const pathwayPoints = [];
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pathwayPoints.push(
      new THREE.Vector3(
        district.position[0] * t,
        0.1,
        district.position[2] * t
      )
    );
  }

  return (
    <group ref={pathRef}>
      {/* Glowing Pathway */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[0.5, 1, 16]} />
        <meshStandardMaterial
          color={district.color}
          emissive={district.color}
          emissiveIntensity={0.2}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Pathway Line */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={pathwayPoints.length}
            array={new Float32Array(pathwayPoints.flatMap(p => [p.x, p.y, p.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={district.color} linewidth={3} />
      </line>

      {/* District Portal */}
      <group position={district.position}>
        {/* Portal Ring */}
        <mesh
          ref={portalRef}
          position={[0, 2, 0]}
          onPointerEnter={() => onHover(district.id)}
          onPointerLeave={() => onHover(null)}
          onClick={() => onSelect(district.id)}
        >
          <torusGeometry args={[2, 0.2, 8, 16]} />
          <meshStandardMaterial
            color={district.color}
            emissive={district.color}
            emissiveIntensity={0.1}
            transparent
            opacity={0.8}
          />
        </mesh>

        {/* Portal Center */}
        <mesh position={[0, 2, 0]}>
          <circleGeometry args={[1.8, 16]} />
          <meshBasicMaterial
            color="#000000"
            transparent
            opacity={0.3}
          />
        </mesh>

        {/* District Name */}
        <Text
          position={[0, 4, 0]}
          fontSize={0.8}
          color={district.color}
          anchorX="center"
          anchorY="middle"
          font="/fonts/inter.woff"
        >
          {district.emoji} {district.name}
        </Text>

        {/* Hover Info */}
        {isHovered && (
          <Html position={[0, 5.5, 0]} center>
            <div className="bg-white bg-opacity-95 px-4 py-2 rounded-lg shadow-lg max-w-xs">
              <h3 className="font-bold text-lg" style={{ color: district.color }}>
                {district.emoji} {district.name} District
              </h3>
              <p className="text-sm text-gray-700 mt-1">{district.description}</p>
              <button
                className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                onClick={() => onSelect(district.id)}
              >
                Explore District
              </button>
            </div>
          </Html>
        )}

        {/* Floating Particles */}
        <DistrictParticles district={district} />
      </group>
    </group>
  );
}

// Animated particles for each district
function DistrictParticles({ district }: { district: District }) {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 20;

  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 6;
    positions[i * 3 + 1] = Math.random() * 4 + 1;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6;

    // District-colored particles
    const color = new THREE.Color(district.color);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.005;
      // Floating motion
      const time = state.clock.getElapsedTime();
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += Math.sin(time * 2 + i * 0.5) * 0.002;
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
        size={0.05}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}