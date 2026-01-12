'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Text, Html, useTexture, Sphere, MeshDistortMaterial } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import Link from 'next/link';
import { Compass, Sparkles, Heart, ArrowRight, Eye, Zap, Volume2, VolumeX } from 'lucide-react';
import { useSoundManager, SpatialAudio } from '@/lib/sound/SoundManager';

// Particle System Component
function ParticleField() {
  const points = useRef<THREE.Points>(null);
  const particleCount = 2000;

  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  // Initialize particles in a cosmic distribution
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;

    // Create spherical distribution with some clustering
    const radius = Math.random() * 50 + 10;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi);

    // Cosmic color palette
    const colorVariation = Math.random();
    if (colorVariation < 0.3) {
      // Deep blues and purples
      colors[i3] = 0.2 + Math.random() * 0.3;     // R
      colors[i3 + 1] = 0.1 + Math.random() * 0.4; // G
      colors[i3 + 2] = 0.5 + Math.random() * 0.5; // B
    } else if (colorVariation < 0.6) {
      // Electric blues
      colors[i3] = 0.1 + Math.random() * 0.4;     // R
      colors[i3 + 1] = 0.3 + Math.random() * 0.7; // G
      colors[i3 + 2] = 0.8 + Math.random() * 0.2; // B
    } else {
      // Accents of gold and pink
      colors[i3] = 0.8 + Math.random() * 0.2;     // R
      colors[i3 + 1] = 0.4 + Math.random() * 0.6; // G
      colors[i3 + 2] = 0.6 + Math.random() * 0.4; // B
    }
  }

  useFrame((state) => {
    if (points.current) {
      // Gentle cosmic drift
      points.current.rotation.y += 0.0005;
      points.current.rotation.x += 0.0002;

      // Subtle pulsing effect
      const time = state.clock.getElapsedTime();
      const scale = 1 + Math.sin(time * 0.5) * 0.1;
      points.current.scale.setScalar(scale);
    }
  });

  return (
    <points ref={points}>
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
        size={0.8}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Central Gateway Structure
function GatewayCore() {
  const meshRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (meshRef.current) {
      // Slow majestic rotation
      meshRef.current.rotation.y = time * 0.1;

      // Gentle floating motion
      meshRef.current.position.y = Math.sin(time * 0.3) * 0.2;
    }

    if (ringRef.current) {
      // Counter-rotation for the ring
      ringRef.current.rotation.z = -time * 0.15;
      ringRef.current.rotation.x = Math.sin(time * 0.2) * 0.1;
    }
  });

  return (
    <group ref={meshRef} position={[0, 0, 0]}>
      {/* Central Core */}
      <mesh>
        <sphereGeometry args={[2, 32, 32]} />
        <MeshDistortMaterial
          color="#4A0E4E"
          emissive="#2D1B69"
          emissiveIntensity={0.3}
          distort={0.2}
          speed={1}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Energy Rings */}
      <mesh ref={ringRef}>
        <torusGeometry args={[4, 0.1, 8, 64]} />
        <meshBasicMaterial
          color="#00D4FF"
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.5, 0.05, 6, 48]} />
        <meshBasicMaterial
          color="#FF6B6B"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Inner Glow */}
      <mesh scale={0.8}>
        <sphereGeometry args={[2, 16, 16]} />
        <meshBasicMaterial
          color="#9D4EDD"
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// Floating Navigation Nodes
function NavigationNode({ position, label, icon: Icon, href, delay = 0 }: {
  position: [number, number, number];
  label: string;
  icon: any;
  href: string;
  delay?: number;
}) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const { playEffect } = useSoundManager();
  const lastHoverState = useRef(false);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime() + delay;
      meshRef.current.position.y = position[1] + Math.sin(time * 0.8) * 0.3;
      meshRef.current.rotation.y = time * 0.2;
    }
  });

  useEffect(() => {
    if (hovered && !lastHoverState.current) {
      // Play hover sound
      playEffect('node-hover', { volume: 0.3 });
    }
    lastHoverState.current = hovered;
  }, [hovered, playEffect]);

  const handleClick = () => {
    // Play click sound
    playEffect('node-click', { volume: 0.5 });
    // Add slight delay before navigation for audio feedback
    setTimeout(() => {
      window.location.href = href;
    }, 200);
  };

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={handleClick}
      >
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial
          color={hovered ? "#00D4FF" : "#4A0E4E"}
          emissive={hovered ? "#00D4FF" : "#2D1B69"}
          emissiveIntensity={hovered ? 0.5 : 0.2}
          transparent
          opacity={0.9}
        />
      </mesh>

      <Html position={[0, 1.5, 0]} center>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: hovered ? 1 : 0.7, y: hovered ? 0 : 10 }}
          transition={{ duration: 0.3 }}
          className="text-center pointer-events-none"
        >
          <div className="flex flex-col items-center gap-2">
            <Icon className={`w-6 h-6 ${hovered ? 'text-cyan-400' : 'text-purple-300'}`} />
            <span className={`text-sm font-semibold ${hovered ? 'text-cyan-300' : 'text-purple-200'}`}>
              {label}
            </span>
          </div>
        </motion.div>
      </Html>
    </group>
  );
}

// Main Scene Component
function Scene() {
  const { playAmbient, playEffect } = useSoundManager();
  const ambientSoundId = useRef<string | null | undefined>(null);

  useEffect(() => {
    // Start cosmic ambient sound
    const startAmbient = async () => {
      ambientSoundId.current = playAmbient('cosmic-ambient', {
        volume: 0.2,
        fadeIn: 3
      });
    };

    // Small delay to ensure audio context is ready
    const timer = setTimeout(startAmbient, 1000);
    return () => {
      clearTimeout(timer);
      if (ambientSoundId.current) {
        // stopSound would be called here
      }
    };
  }, [playAmbient]);

  return (
    <>
      {/* Deep space background */}
      <color attach="background" args={['#0A0A0F']} />

      {/* Ambient lighting */}
      <ambientLight intensity={0.1} color="#4A0E4E" />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#00D4FF" />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#FF6B6B" />

      {/* Cosmic particle field */}
      <ParticleField />

      {/* Central gateway with spatial audio */}
      <GatewayCore />
      <SpatialAudio
        soundName="energy-hum"
        position={new THREE.Vector3(0, 0, 0)}
        volume={0.3}
        loop={true}
        autoPlay={true}
      />

      {/* Navigation nodes with spatial audio */}
      <NavigationNode
        position={[8, 2, -5]}
        label="Explore"
        icon={Compass}
        href="/ai-city/explore"
        delay={0}
      />
      <SpatialAudio
        soundName="node-ambient"
        position={new THREE.Vector3(8, 2, -5)}
        volume={0.1}
        loop={true}
        autoPlay={true}
      />

      <NavigationNode
        position={[-8, 1, -3]}
        label="Create"
        icon={Sparkles}
        href="/creator"
        delay={1}
      />
      <SpatialAudio
        soundName="node-ambient"
        position={new THREE.Vector3(-8, 1, -3)}
        volume={0.1}
        loop={true}
        autoPlay={true}
      />

      <NavigationNode
        position={[0, -3, -8]}
        label="Connect"
        icon={Heart}
        href="/commons"
        delay={2}
      />
      <SpatialAudio
        soundName="node-ambient"
        position={new THREE.Vector3(0, -3, -8)}
        volume={0.1}
        loop={true}
        autoPlay={true}
      />

      <NavigationNode
        position={[6, -2, 6]}
        label="Discover"
        icon={Eye}
        href="/discover"
        delay={3}
      />
      <SpatialAudio
        soundName="node-ambient"
        position={new THREE.Vector3(6, -2, 6)}
        volume={0.1}
        loop={true}
        autoPlay={true}
      />

      {/* Particle field audio */}
      <SpatialAudio
        soundName="particle-field"
        position={new THREE.Vector3(0, 0, 0)}
        volume={0.15}
        loop={true}
        autoPlay={true}
      />

      {/* Floating stars */}
      <Stars
        radius={100}
        depth={50}
        count={1000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />

      {/* Camera controls */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={25}
        autoRotate
        autoRotateSpeed={0.2}
      />
    </>
  );
}

// Welcome Sequence Component
function WelcomeSequence({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);
  const { playEffect } = useSoundManager();

  const phases = [
    {
      title: "Welcome to the Aiverse",
      subtitle: "A realm where consciousness meets creation",
      duration: 3000,
      sound: "welcome-chime"
    },
    {
      title: "Your Journey Begins",
      subtitle: "Navigate the infinite possibilities",
      duration: 3000,
      sound: "energy-hum"
    },
    {
      title: "Choose Your Path",
      subtitle: "Explore • Create • Connect • Discover",
      duration: 3000,
      sound: "portal-open"
    }
  ];

  useEffect(() => {
    if (phase < phases.length) {
      // Play phase sound
      if (phases[phase].sound) {
        playEffect(phases[phase].sound, { volume: 0.4 });
      }

      const timer = setTimeout(() => {
        setPhase(phase + 1);
      }, phases[phase].duration);
      return () => clearTimeout(timer);
    } else {
      onComplete();
    }
  }, [phase, onComplete, playEffect]);

  if (phase >= phases.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        key={phase}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.2, opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center"
      >
        <motion.h1
          className="text-6xl md:text-8xl font-black text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text mb-4"
          initial={{ y: 50 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          {phases[phase].title}
        </motion.h1>

        <motion.p
          className="text-xl md:text-2xl text-purple-200 max-w-2xl mx-auto"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          {phases[phase].subtitle}
        </motion.p>

        <motion.div
          className="mt-8 flex justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <div className="w-16 h-16 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// Main City Gate Scene Component
export default function CityGateScene() {
  const [sequenceComplete, setSequenceComplete] = useState(false);
  const [showUI, setShowUI] = useState(false);
  const { toggleMute, isMuted, isAudioReady } = useSoundManager();

  useEffect(() => {
    // Show UI after sequence completes
    if (sequenceComplete) {
      const timer = setTimeout(() => setShowUI(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [sequenceComplete]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* 3D Scene */}
      <Canvas
        camera={{ position: [0, 0, 15], fov: 60 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      {/* Welcome Sequence Overlay */}
      <AnimatePresence>
        {!sequenceComplete && (
          <WelcomeSequence onComplete={() => setSequenceComplete(true)} />
        )}
      </AnimatePresence>

      {/* Main UI Overlay */}
      <AnimatePresence>
        {showUI && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute inset-0 pointer-events-none"
          >
            {/* Top Status Bar */}
            <motion.div
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center pointer-events-auto"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
                <span className="text-cyan-300 text-sm font-medium">Aiverse Gateway Active</span>
              </div>

              <div className="flex items-center gap-4 text-purple-300 text-sm">
                <span>Navigate with mouse • Click nodes to enter</span>
                {isAudioReady && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleMute}
                    className="w-8 h-8 bg-purple-500/20 backdrop-blur-md border border-purple-400/30 rounded-full flex items-center justify-center hover:bg-purple-500/30 transition-all"
                    title={isMuted ? "Unmute Audio" : "Mute Audio"}
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-purple-300" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-purple-300" />
                    )}
                  </motion.button>
                )}
                <Zap className="w-4 h-4" />
              </div>
            </motion.div>

            {/* Bottom Action Bar */}
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="absolute bottom-0 left-0 right-0 p-6 pointer-events-auto"
            >
              <div className="max-w-4xl mx-auto flex justify-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group"
                >
                  <Link
                    href="/ai-city/explore"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 backdrop-blur-md border border-cyan-400/30 rounded-full text-cyan-300 hover:text-white hover:border-cyan-400 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25"
                  >
                    <Compass className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    <span className="font-semibold">Enter the Aiverse</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              </div>
            </motion.div>

            {/* Ambient UI Elements */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
              className="absolute top-1/2 left-8 transform -translate-y-1/2 space-y-4 pointer-events-auto"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-12 h-12 bg-purple-500/20 backdrop-blur-md border border-purple-400/30 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-500/30 transition-all"
              >
                <Heart className="w-6 h-6 text-purple-300" />
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-12 h-12 bg-cyan-500/20 backdrop-blur-md border border-cyan-400/30 rounded-full flex items-center justify-center cursor-pointer hover:bg-cyan-500/30 transition-all"
              >
                <Sparkles className="w-6 h-6 text-cyan-300" />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}