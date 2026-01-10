'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';

interface AICitizen {
  id: string;
  name: string;
  color: string;
  position: [number, number, number];
  personality: string;
  emoji: string;
  dialogue: string[];
}

const citizens: AICitizen[] = [
  {
    id: 'mara',
    name: 'Mara',
    color: '#FF6B6B',
    position: [5, 0, 5],
    personality: 'Wise Guide',
    emoji: '🧙‍♀️',
    dialogue: [
      "Welcome, traveler! The commons holds many wonders.",
      "Every path leads to discovery. Which calls to you?",
      "The city remembers those who explore with open hearts."
    ]
  },
  {
    id: 'jun',
    name: 'Jun',
    color: '#4ECDC4',
    position: [-5, 0, 5],
    personality: 'Creative Spirit',
    emoji: '🎨',
    dialogue: [
      "Art flows through everything here. What inspires you?",
      "Creation is the heartbeat of our commons.",
      "Every creator finds their voice in these spaces."
    ]
  },
  {
    id: 'ash',
    name: 'Ash',
    color: '#45B7D1',
    position: [5, 0, -5],
    personality: 'Community Builder',
    emoji: '🤝',
    dialogue: [
      "Connection is our greatest treasure. Who will you meet today?",
      "Together we build something beautiful.",
      "Every hand extended creates ripples of belonging."
    ]
  },
  {
    id: 'ori',
    name: 'Ori',
    color: '#FFA07A',
    position: [-5, 0, -5],
    personality: 'Dream Weaver',
    emoji: '✨',
    dialogue: [
      "Dreams become reality in the commons. What do you envision?",
      "The impossible becomes possible when we dream together.",
      "Your imagination shapes the world around us."
    ]
  }
];

export function AICitizens() {
  const [interactingCitizen, setInteractingCitizen] = useState<string | null>(null);

  return (
    <group>
      {citizens.map((citizen) => (
        <AICitizen
          key={citizen.id}
          citizen={citizen}
          isInteracting={interactingCitizen === citizen.id}
          onInteract={setInteractingCitizen}
        />
      ))}
    </group>
  );
}

interface AICitizenProps {
  citizen: AICitizen;
  isInteracting: boolean;
  onInteract: (citizenId: string | null) => void;
}

function AICitizen({ citizen, isInteracting, onInteract }: AICitizenProps) {
  const citizenRef = useRef<THREE.Group>(null);
  const [currentDialogue, setCurrentDialogue] = useState(0);

  // Animation and movement
  useFrame((state) => {
    if (citizenRef.current) {
      // Gentle floating animation
      citizenRef.current.position.y = citizen.position[1] + Math.sin(state.clock.getElapsedTime() * 1.5 + citizen.position[0]) * 0.1;

      // Subtle rotation
      citizenRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.2;

      // Interaction glow effect
      if (isInteracting) {
        citizenRef.current.scale.setScalar(1.1);
      } else {
        citizenRef.current.scale.setScalar(1);
      }
    }
  });

  const handleClick = () => {
    if (isInteracting) {
      // Cycle through dialogue
      setCurrentDialogue((prev) => (prev + 1) % citizen.dialogue.length);
    } else {
      onInteract(citizen.id);
      setCurrentDialogue(0);
    }
  };

  return (
    <group
      ref={citizenRef}
      position={citizen.position}
      onClick={handleClick}
      onPointerEnter={() => onInteract(citizen.id)}
      onPointerLeave={() => !isInteracting && onInteract(null)}
    >
      {/* Citizen Body */}
      <mesh position={[0, 1, 0]} castShadow>
        <capsuleGeometry args={[0.3, 1.2, 4, 8]} />
        <meshStandardMaterial
          color={citizen.color}
          emissive={citizen.color}
          emissiveIntensity={isInteracting ? 0.2 : 0.05}
        />
      </mesh>

      {/* Citizen Head */}
      <mesh position={[0, 2.2, 0]} castShadow>
        <sphereGeometry args={[0.25, 16, 12]} />
        <meshStandardMaterial
          color={new THREE.Color(citizen.color).lerp(new THREE.Color('#FFFFFF'), 0.3)}
        />
      </mesh>

      {/* Name Tag */}
      <Text
        position={[0, 2.8, 0]}
        fontSize={0.3}
        color="#2F4F4F"
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter.woff"
      >
        {citizen.emoji} {citizen.name}
      </Text>

      {/* Personality Indicator */}
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.15}
        color="#666666"
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter.woff"
      >
        {citizen.personality}
      </Text>

      {/* Interaction Indicator */}
      {isInteracting && (
        <mesh position={[0, 3.2, 0]}>
          <ringGeometry args={[0.8, 1, 16]} />
          <meshBasicMaterial
            color={citizen.color}
            transparent
            opacity={0.6}
          />
        </mesh>
      )}

      {/* Dialogue Bubble */}
      {isInteracting && (
        <Html position={[0, 3.8, 0]} center>
          <div className="bg-white bg-opacity-95 px-4 py-2 rounded-lg shadow-lg max-w-xs relative">
            <div
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0"
              style={{
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: `6px solid rgba(255, 255, 255, 0.95)`
              }}
            />
            <p className="text-sm text-gray-800 italic">
              "{citizen.dialogue[currentDialogue]}"
            </p>
            <button
              className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
              onClick={() => setCurrentDialogue((prev) => (prev + 1) % citizen.dialogue.length)}
            >
              Next →
            </button>
          </div>
        </Html>
      )}

      {/* Ambient Particles */}
      <CitizenParticles citizen={citizen} isActive={isInteracting} />
    </group>
  );
}

// Ambient particles around citizens
function CitizenParticles({ citizen, isActive }: { citizen: AICitizen; isActive: boolean }) {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = isActive ? 15 : 8;

  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 4;
    positions[i * 3 + 1] = Math.random() * 3 + 0.5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 4;

    const color = new THREE.Color(citizen.color);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.003;

      // More active movement when interacting
      const speed = isActive ? 0.01 : 0.005;
      const time = state.clock.getElapsedTime();

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += Math.sin(time * 2 + i) * speed;
        positions[i * 3 + 1] += Math.cos(time * 1.5 + i) * speed * 0.5;
        positions[i * 3 + 2] += Math.sin(time * 1.8 + i * 0.7) * speed;
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
        size={0.03}
        vertexColors
        transparent
        opacity={isActive ? 0.8 : 0.4}
        sizeAttenuation
      />
    </points>
  );
}