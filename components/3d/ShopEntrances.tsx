'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface ShopEntrancesProps {
  onShopEnter: (shopId: string) => void;
}

interface Shop {
  id: string;
  name: string;
  category: string;
  color: string;
  position: [number, number, number];
  description: string;
  emoji: string;
  tourId: string;
}

const shops: Shop[] = [
  {
    id: 'memory-bazaar',
    name: 'Memory Bazaar',
    category: 'Digital Art',
    color: '#8B4513',
    position: [15, 0, 8],
    description: 'Collectible digital memories and artwork',
    emoji: '🎨',
    tourId: 'sample-tour-1'
  },
  {
    id: 'loomworks',
    name: 'Loomworks',
    category: 'Textiles',
    color: '#4169E1',
    position: [-12, 0, 10],
    description: 'Handcrafted textiles and woven goods',
    emoji: '🧵',
    tourId: 'sample-tour-2'
  },
  {
    id: 'garden-hearts',
    name: 'Garden of Hearts',
    category: 'Wellness',
    color: '#228B22',
    position: [8, 0, -12],
    description: 'Natural wellness and healing products',
    emoji: '🌿',
    tourId: 'sample-tour-3'
  },
  {
    id: 'harbor-echoes',
    name: 'Harbor Echoes',
    category: 'Audio',
    color: '#2F4F4F',
    position: [-10, 0, -8],
    description: 'Unique sounds and musical instruments',
    emoji: '🎵',
    tourId: 'sample-tour-4'
  }
];

export function ShopEntrances({ onShopEnter }: ShopEntrancesProps) {
  const [hoveredShop, setHoveredShop] = useState<string | null>(null);

  return (
    <group>
      {shops.map((shop) => (
        <ShopEntrance
          key={shop.id}
          shop={shop}
          isHovered={hoveredShop === shop.id}
          onHover={setHoveredShop}
          onEnter={onShopEnter}
        />
      ))}
    </group>
  );
}

interface ShopEntranceProps {
  shop: Shop;
  isHovered: boolean;
  onHover: (shopId: string | null) => void;
  onEnter: (shopId: string) => void;
}

function ShopEntrance({ shop, isHovered, onHover, onEnter }: ShopEntranceProps) {
  const entranceRef = useRef<THREE.Group>(null);
  const portalRef = useRef<THREE.Mesh>(null);

  // Animation effects
  useFrame((state) => {
    if (entranceRef.current) {
      // Gentle pulsing
      const scale = 1 + Math.sin(state.clock.getElapsedTime() * 3 + shop.position[0]) * 0.05;
      entranceRef.current.scale.setScalar(scale);
    }

    if (portalRef.current && portalRef.current.material) {
      // Portal rotation and glow
      portalRef.current.rotation.y += 0.008;

      const material = portalRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = isHovered ? 0.4 : 0.1;
    }
  });

  return (
    <group ref={entranceRef} position={shop.position}>
      {/* Shop Building Base */}
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 2, 3]} />
        <meshStandardMaterial
          color={new THREE.Color(shop.color).lerp(new THREE.Color('#FFFFFF'), 0.7)}
        />
      </mesh>

      {/* Shop Sign */}
      <mesh position={[0, 2.8, 1.6]} castShadow>
        <boxGeometry args={[2.5, 0.4, 0.1]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Portal/Entrance */}
      <mesh
        ref={portalRef}
        position={[0, 1, 1.6]}
        onPointerEnter={() => onHover(shop.id)}
        onPointerLeave={() => onHover(null)}
        onClick={() => onEnter(shop.id)}
      >
        <planeGeometry args={[1.5, 1.8]} />
        <meshStandardMaterial
          color="#000000"
          emissive={shop.color}
          emissiveIntensity={0.1}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Portal Frame */}
      <mesh position={[0, 1, 1.5]}>
        <ringGeometry args={[0.8, 1, 16]} />
        <meshStandardMaterial
          color={shop.color}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Shop Name */}
      <Html position={[0, 3, 1.6]} center>
        <div style={{ color: '#2F4F4F', fontSize: '14px', textAlign: 'center' }}>
          {shop.emoji} {shop.name}
        </div>
      </Html>

      {/* Category */}
      <Html position={[0, 2.5, 1.6]} center>
        <div style={{ color: '#666666', fontSize: '12px', textAlign: 'center' }}>
          {shop.category}
        </div>
      </Html>

      {/* Hover Info */}
      {isHovered && (
        <Html position={[0, 4, 0]} center>
          <div className="bg-white bg-opacity-95 px-4 py-3 rounded-lg shadow-lg max-w-sm">
            <h3 className="font-bold text-lg flex items-center space-x-2">
              <span>{shop.emoji}</span>
              <span style={{ color: shop.color }}>{shop.name}</span>
            </h3>
            <p className="text-sm text-gray-600 mt-1">{shop.category}</p>
            <p className="text-sm text-gray-700 mt-2">{shop.description}</p>
            <div className="mt-3 flex space-x-2">
              <button
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                onClick={() => onEnter(shop.id)}
              >
                Enter Shop
              </button>
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                onClick={() => window.open(`/products?category=${shop.category.toLowerCase()}`, '_blank')}
              >
                Browse Products
              </button>
            </div>
          </div>
        </Html>
      )}

      {/* Shop Atmosphere */}
      <ShopAtmosphere shop={shop} isActive={isHovered} />
    </group>
  );
}

// Atmospheric effects for each shop
function ShopAtmosphere({ shop, isActive }: { shop: Shop; isActive: boolean }) {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = isActive ? 25 : 12;

  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 6;
    positions[i * 3 + 1] = Math.random() * 4 + 0.5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6;

    const color = new THREE.Color(shop.color);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.004;

      // Shop-specific movement patterns
      const time = state.clock.getElapsedTime();
      const speed = isActive ? 0.008 : 0.004;

      for (let i = 0; i < particleCount; i++) {
        // Different patterns for different shops
        switch (shop.category) {
          case 'Digital Art':
            positions[i * 3] += Math.sin(time * 2 + i) * speed;
            positions[i * 3 + 1] += Math.cos(time * 1.5 + i) * speed;
            break;
          case 'Textiles':
            positions[i * 3] += Math.sin(time * 1.8 + i * 0.5) * speed;
            positions[i * 3 + 2] += Math.cos(time * 2.2 + i * 0.3) * speed;
            break;
          case 'Wellness':
            positions[i * 3 + 1] += Math.sin(time * 1.2 + i) * speed * 1.5;
            break;
          case 'Audio':
            positions[i * 3] += Math.sin(time * 3 + i) * speed * 0.5;
            positions[i * 3 + 2] += Math.cos(time * 2.5 + i) * speed * 0.5;
            break;
        }
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
        size={0.04}
        vertexColors
        transparent
        opacity={isActive ? 0.9 : 0.5}
        sizeAttenuation
      />
    </points>
  );
}