'use client';

/**
 * Autonomous Citizen Component
 * 3D representation of AI citizens in the living city
 */

import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Sphere, Cylinder, Box } from '@react-three/drei';
import * as THREE from 'three';
import { CitizenState } from '@/lib/ai-city/citizen-ai-service';
import { eventBus } from '@/lib/ai-city/event-bus';

interface AutonomousCitizenProps {
  citizen: CitizenState;
  onInteract?: (citizenId: string) => void;
}

export function AutonomousCitizen({ citizen, onInteract }: AutonomousCitizenProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const lastPosition = useRef(citizen.position);

  // Subscribe to citizen updates
  useEffect(() => {
    const unsubscribe = eventBus.subscribe({
      id: `citizen-${citizen.id}`,
      eventTypes: ['citizen:action'],
      callback: (event) => {
        if (event.payload.citizenId === citizen.id) {
          // Handle citizen updates
          if (event.payload.activity === 'interacting') {
            setIsInteracting(true);
            setTimeout(() => setIsInteracting(false), 3000);
          }
        }
      }
    });

    return unsubscribe;
  }, [citizen.id]);

  // Update position smoothly
  useFrame((state, delta) => {
    if (groupRef.current) {
      const currentPos = groupRef.current.position;
      const targetPos = citizen.position;

      // Smooth interpolation
      const lerpFactor = Math.min(delta * 2, 1);
      currentPos.x = THREE.MathUtils.lerp(currentPos.x, targetPos.x, lerpFactor);
      currentPos.y = THREE.MathUtils.lerp(currentPos.y, targetPos.y, lerpFactor);
      currentPos.z = THREE.MathUtils.lerp(currentPos.z, targetPos.z, lerpFactor);

      // Gentle floating animation
      const time = state.clock.getElapsedTime();
      groupRef.current.position.y += Math.sin(time * 2 + citizen.id.length) * 0.05;

      // Rotation based on mood
      const moodRotation = citizen.currentMood.emotional_state === 'energetic' ? 0.5 :
                          citizen.currentMood.emotional_state === 'contemplative' ? 0.1 : 0.3;
      groupRef.current.rotation.y += moodRotation * delta;
    }
  });

  const handleClick = () => {
    if (onInteract) {
      onInteract(citizen.id);
    }
  };

  // Get colors based on personality and mood
  const getCitizenColors = () => {
    const personality = citizen.personality;
    const mood = citizen.currentMood;

    let baseColor = '#4A90E2'; // Default blue

    // Personality-based colors
    if (personality.traits.includes('mysterious')) {
      baseColor = '#9B59B6'; // Purple
    } else if (personality.traits.includes('energetic')) {
      baseColor = '#E74C3C'; // Red
    } else if (personality.traits.includes('contemplative')) {
      baseColor = '#3498DB'; // Blue
    } else if (personality.traits.includes('joyful')) {
      baseColor = '#F1C40F'; // Yellow
    }

    // Mood-based adjustments
    let emissiveColor = '#000000';
    let emissiveIntensity = 0.1;

    switch (mood.emotional_state) {
      case 'curious':
        emissiveColor = '#00FF00';
        emissiveIntensity = 0.3;
        break;
      case 'energetic':
        emissiveColor = '#FF4500';
        emissiveIntensity = 0.5;
        break;
      case 'joyful':
        emissiveColor = '#FFD700';
        emissiveIntensity = 0.4;
        break;
      case 'contemplative':
        emissiveColor = '#4169E1';
        emissiveIntensity = 0.2;
        break;
    }

    return { baseColor, emissiveColor, emissiveIntensity };
  };

  const colors = getCitizenColors();

  return (
    <group
      ref={groupRef}
      position={[citizen.position.x, citizen.position.y, citizen.position.z]}
      onClick={handleClick}
      onPointerOver={() => setIsHovered(true)}
      onPointerOut={() => setIsHovered(false)}
    >
      {/* Citizen Body */}
      <Sphere args={[0.3, 16, 16]} position={[0, 0.5, 0]}>
        <meshStandardMaterial
          color={colors.baseColor}
          emissive={colors.emissiveColor}
          emissiveIntensity={colors.emissiveIntensity}
          transparent
          opacity={0.8}
        />
      </Sphere>

      {/* Citizen Head */}
      <Sphere args={[0.15, 12, 12]} position={[0, 0.8, 0]}>
        <meshStandardMaterial
          color={colors.baseColor}
          emissive={colors.emissiveColor}
          emissiveIntensity={colors.emissiveIntensity * 0.5}
        />
      </Sphere>

      {/* Activity Indicator */}
      {citizen.currentActivity.type !== 'idle' && (
        <Cylinder args={[0.05, 0.05, 0.3, 8]} position={[0, 1.2, 0]}>
          <meshStandardMaterial
            color={
              citizen.currentActivity.type === 'moving' ? '#00FF00' :
              citizen.currentActivity.type === 'exploring' ? '#FFFF00' :
              citizen.currentActivity.type === 'ritual' ? '#FF00FF' :
              citizen.currentActivity.type === 'interacting' ? '#00FFFF' : '#FFFFFF'
            }
            emissive={
              citizen.currentActivity.type === 'moving' ? '#004400' :
              citizen.currentActivity.type === 'exploring' ? '#444400' :
              citizen.currentActivity.type === 'ritual' ? '#440044' :
              citizen.currentActivity.type === 'interacting' ? '#004444' : '#444444'
            }
            emissiveIntensity={0.3}
          />
        </Cylinder>
      )}

      {/* Interaction Indicator */}
      {isInteracting && (
        <Box args={[0.1, 0.1, 0.1]} position={[0, 1.4, 0]}>
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#FFFFFF"
            emissiveIntensity={0.8}
          />
        </Box>
      )}

      {/* Hover Name Tag */}
      {isHovered && (
        <Text
          position={[0, 1.6, 0]}
          fontSize={0.1}
          color="#FFFFFF"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {citizen.name}
        </Text>
      )}

      {/* Mood Aura */}
      <Sphere args={[0.5, 16, 16]} position={[0, 0.5, 0]}>
        <meshBasicMaterial
          color={colors.emissiveColor}
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>

      {/* Energy Indicator */}
      <Cylinder
        args={[0.02, 0.02, citizen.energy / 25, 6]}
        position={[0, -0.2, 0]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <meshStandardMaterial
          color={citizen.energy > 50 ? '#00FF00' : citizen.energy > 25 ? '#FFFF00' : '#FF0000'}
          emissive={citizen.energy > 50 ? '#004400' : citizen.energy > 25 ? '#444400' : '#440000'}
          emissiveIntensity={0.2}
        />
      </Cylinder>
    </group>
  );
}

/**
 * Citizens Manager Component
 * Manages multiple autonomous citizens in a district
 */

interface CitizensManagerProps {
  district: string;
  onCitizenInteract?: (citizenId: string) => void;
}

export function CitizensManager({ district, onCitizenInteract }: CitizensManagerProps) {
  const [citizens, setCitizens] = useState<CitizenState[]>([]);

  // Load citizens for district
  useEffect(() => {
    const loadCitizens = async () => {
      try {
        const response = await fetch(`/api/citizens?district=${district}`);
        if (response.ok) {
          const data = await response.json();
          setCitizens(data.citizens || []);
        }
      } catch (error) {
        console.error('Error loading citizens:', error);
      }
    };

    loadCitizens();

    // Subscribe to citizen updates
    const unsubscribe = eventBus.subscribe({
      id: `citizens-${district}`,
      eventTypes: ['citizen:action'],
      callback: (event) => {
        if (event.payload.district === district) {
          // Refresh citizens list
          loadCitizens();
        }
      }
    });

    return unsubscribe;
  }, [district]);

  return (
    <>
      {citizens.map((citizen) => (
        <AutonomousCitizen
          key={citizen.id}
          citizen={citizen}
          onInteract={onCitizenInteract}
        />
      ))}
    </>
  );
}