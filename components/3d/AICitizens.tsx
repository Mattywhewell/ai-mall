'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// Lazy load SoundManager
let useSoundManager: any = null;
if (typeof window !== 'undefined') {
  try {
    import('../../lib/sound/SoundManager').then(soundModule => {
      useSoundManager = soundModule.useSoundManager;
    }).catch(error => {
      console.warn('SoundManager not available for AICitizens:', error);
    });
  } catch (error) {
    console.warn('SoundManager not available for AICitizens:', error);
  }
}

interface AICitizensProps {
  onCitizenInteract?: (citizenId: string) => void;
}

interface Citizen {
  id: string;
  name: string;
  role: string;
  color: string;
  position: [number, number, number];
  emoji: string;
  greeting: string;
}

const citizens: Citizen[] = [
  {
    id: 'alex-guide',
    name: 'Alex',
    role: 'City Guide',
    color: '#4A90E2',
    position: [5, 0, 5],
    emoji: '👋',
    greeting: 'Welcome to Aiverse Commons! Need help finding something?'
  },
  {
    id: 'maya-creator',
    name: 'Maya',
    role: 'Content Creator',
    color: '#E94B3C',
    position: [-5, 0, 3],
    emoji: '🎨',
    greeting: 'Hey there! Check out these amazing creator spaces!'
  },
  {
    id: 'jamal-explorer',
    name: 'Jamal',
    role: 'Explorer',
    color: '#50C878',
    position: [3, 0, -5],
    emoji: '🗺️',
    greeting: 'Exploring the districts? I can show you around!'
  },
  {
    id: 'luna-shopper',
    name: 'Luna',
    role: 'Shopper',
    color: '#FF69B4',
    position: [-3, 0, -3],
    emoji: '🛍️',
    greeting: 'Love shopping here! The shops are incredible!'
  }
];

export function AICitizens({ onCitizenInteract }: AICitizensProps) {
  const [hoveredCitizen, setHoveredCitizen] = useState<string | null>(null);

  return (
    <group>
      {citizens.map((citizen) => (
        <AICitizen
          key={citizen.id}
          citizen={citizen}
          isHovered={hoveredCitizen === citizen.id}
          onHover={setHoveredCitizen}
          onInteract={onCitizenInteract}
        />
      ))}
    </group>
  );
}

interface AICitizenProps {
  citizen: Citizen;
  isHovered: boolean;
  onHover: (citizenId: string | null) => void;
  onInteract?: (citizenId: string) => void;
}

function AICitizen({ citizen, isHovered, onHover, onInteract }: AICitizenProps) {
  const citizenRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const soundManager = useSoundManager ? useSoundManager() : null;
  const [hasGreeted, setHasGreeted] = useState(false);

  // Animation and interaction
  useFrame((state) => {
    if (citizenRef.current) {
      // Gentle floating animation
      const time = state.clock.getElapsedTime();
      citizenRef.current.position.y = citizen.position[1] + Math.sin(time * 2 + citizen.position[0]) * 0.1;

      // Subtle rotation towards camera when hovered
      if (isHovered && headRef.current) {
        headRef.current.lookAt(state.camera.position);
      }

      // Proximity audio - greet when camera gets close
      if (soundManager && soundManager.isReady && !hasGreeted) {
        const cameraPosition = state.camera.position;
        const citizenPosition = new THREE.Vector3(...citizen.position);
        const distance = cameraPosition.distanceTo(citizenPosition);

        if (distance < 6) { // Proximity threshold
          soundManager.playEffect('welcome-chime', { volume: 0.2 });
          setHasGreeted(true);
        }
      }
    }
  });

  return (
    <group ref={citizenRef} position={citizen.position}>
      {/* Citizen Body */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <capsuleGeometry args={[0.3, 1.2]} />
        <meshStandardMaterial color={citizen.color} />
      </mesh>

      {/* Citizen Head */}
      <mesh
        ref={headRef}
        position={[0, 1.6, 0]}
        onPointerEnter={() => onHover(citizen.id)}
        onPointerLeave={() => onHover(null)}
        onClick={() => {
          if (soundManager) {
            soundManager.playEffect('node-click', { volume: 0.3 });
          }
          onInteract?.(citizen.id);
        }}
        castShadow
      >
        <sphereGeometry args={[0.25]} />
        <meshStandardMaterial color={new THREE.Color(citizen.color).lerp(new THREE.Color('#FFFFFF'), 0.3)} />
      </mesh>

      {/* Name Tag */}
      <Html position={[0, 2.2, 0]} center>
        <div className="bg-white bg-opacity-90 px-2 py-1 rounded text-xs font-medium text-center shadow">
          {citizen.emoji} {citizen.name}
        </div>
      </Html>

      {/* Role Indicator */}
      <Html position={[0, 2.0, 0]} center>
        <div className="text-xs text-gray-600 text-center">
          {citizen.role}
        </div>
      </Html>

      {/* Interaction Bubble */}
      {isHovered && (
        <Html position={[0, 2.8, 0]} center>
          <div className="bg-white bg-opacity-95 px-3 py-2 rounded-lg shadow-lg max-w-xs">
            <p className="text-sm text-gray-800">{citizen.greeting}</p>
            <button
              className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
              onClick={() => onInteract?.(citizen.id)}
            >
              Talk to {citizen.name}
            </button>
          </div>
        </Html>
      )}

      {/* Ambient Aura */}
      <CitizenAura citizen={citizen} isActive={isHovered} />
    </group>
  );
}

// Ambient aura effect for citizens
function CitizenAura({ citizen, isActive }: { citizen: Citizen; isActive: boolean }) {
  const auraRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (auraRef.current) {
      const time = state.clock.getElapsedTime();
      auraRef.current.rotation.y += 0.01;
      auraRef.current.scale.setScalar(1 + Math.sin(time * 3) * 0.1);

      const material = auraRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = isActive ? 0.3 : 0.1;
    }
  });

  return (
    <mesh ref={auraRef} position={[0, 1, 0]}>
      <sphereGeometry args={[1.5, 16, 16]} />
      <meshBasicMaterial
        color={citizen.color}
        transparent
        opacity={0.1}
      />
    </mesh>
  );
}