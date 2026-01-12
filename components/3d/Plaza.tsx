'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export function Plaza() {
  const plazaRef = useRef<THREE.Group>(null);
  const [visitorCount, setVisitorCount] = useState(0);
  const [collectiveMood, setCollectiveMood] = useState({ valence: 0.5, arousal: 0.5 });

  // Fetch plaza stats
  useEffect(() => {
    const fetchPlazaStats = async () => {
      try {
        // For now, simulate data - in production this would come from API
        const mockStats = {
          activeUsers: Math.floor(Math.random() * 20) + 5,
          mood: {
            valence: 0.5 + Math.random() * 0.4, // 0.5-0.9
            arousal: 0.3 + Math.random() * 0.5  // 0.3-0.8
          }
        };
        setVisitorCount(mockStats.activeUsers);
        setCollectiveMood(mockStats.mood);
      } catch (error) {
        console.warn('Failed to fetch plaza stats:', error);
        setVisitorCount(Math.floor(Math.random() * 50) + 10);
      }
    };

    fetchPlazaStats();
    // Update stats every 30 seconds
    const interval = setInterval(fetchPlazaStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Gentle floating animation for the central monument
  useFrame((state) => {
    if (plazaRef.current) {
      const time = state.clock.getElapsedTime();
      // Mood-influenced animation
      const floatIntensity = 0.05 + (collectiveMood.arousal * 0.1);
      plazaRef.current.rotation.y = Math.sin(time * 0.2) * 0.1;
      plazaRef.current.position.y = Math.sin(time * 0.5) * floatIntensity;

      // Mood-based color pulsing
      const pulseIntensity = 0.1 + (collectiveMood.valence * 0.2);
      const pulse = Math.sin(time * 2) * pulseIntensity;
      // We'll apply this to emissive materials
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
        <Html position={[0, 5, 0]} center>
          <div style={{ color: '#2F4F4F', fontSize: '20px', textAlign: 'center', maxWidth: '300px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
              Aiverse Commons
            </div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>
              {visitorCount} visitors • Mood: {getMoodDescription(collectiveMood)}
            </div>
          </div>
        </Html>
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

// Helper function to describe collective mood
function getMoodDescription(mood: { valence: number; arousal: number }): string {
  const valence = mood.valence;
  const arousal = mood.arousal;

  if (valence > 0.7 && arousal > 0.6) return 'Energetic & Joyful';
  if (valence > 0.7 && arousal <= 0.6) return 'Peaceful & Content';
  if (valence > 0.4 && arousal > 0.6) return 'Active & Curious';
  if (valence > 0.4 && arousal <= 0.6) return 'Calm & Contemplative';
  if (valence <= 0.4 && arousal > 0.6) return 'Restless & Intense';
  return 'Reflective & Subdued';
}