'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Text, Html, useTexture, Sphere, MeshDistortMaterial } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import Link from 'next/link';
import { Compass, Sparkles, Heart, ArrowRight, Eye, Zap, Volume2, VolumeX } from 'lucide-react';
// import { useSoundManager, SpatialAudio } from '@/lib/sound/SoundManager';

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

// Audio-Reactive Shader Material for Gateway
function AudioReactiveMaterial({ soundManager }: { soundManager: any }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame(({ clock }) => {
    if (!materialRef.current) return;

    const time = clock.getElapsedTime();
    const bassLevel = soundManager?.getBassLevel() || 0;
    const midLevel = soundManager?.getMidLevel() || 0;
    const trebleLevel = soundManager?.getTrebleLevel() || 0;

    materialRef.current.uniforms.u_time.value = time;
    materialRef.current.uniforms.u_bass.value = bassLevel;
    materialRef.current.uniforms.u_mid.value = midLevel;
    materialRef.current.uniforms.u_treble.value = trebleLevel;
  });

  return (
    <shaderMaterial
      ref={materialRef}
      uniforms={{
        u_time: { value: 0 },
        u_bass: { value: 0 },
        u_mid: { value: 0 },
        u_treble: { value: 0 }
      }}
      vertexShader={`
        varying vec3 vPosition;
        varying vec3 vNormal;
        uniform float u_time;
        uniform float u_bass;

        void main() {
          vPosition = position;
          vNormal = normal;

          // Audio-reactive vertex displacement
          vec3 pos = position;
          float bassInfluence = u_bass * 0.5;
          pos += normal * bassInfluence * sin(u_time * 2.0 + position.y * 0.1);

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `}
      fragmentShader={`
        uniform float u_time;
        uniform float u_bass;
        uniform float u_mid;
        uniform float u_treble;
        varying vec3 vPosition;
        varying vec3 vNormal;

        void main() {
          // Audio-reactive colors
          vec3 baseColor = vec3(0.2, 0.0, 0.3); // Deep purple
          vec3 energyColor = vec3(0.0, 0.8, 1.0); // Cyan energy
          vec3 accentColor = vec3(1.0, 0.4, 0.6); // Pink accent

          // Mix colors based on audio frequencies
          vec3 color = mix(baseColor, energyColor, u_bass);
          color = mix(color, accentColor, u_mid * 0.5);

          // Add pulsing effect based on treble
          float pulse = sin(u_time * 3.0) * 0.5 + 0.5;
          color += energyColor * u_treble * pulse * 0.3;

          // Fresnel effect for energy glow
          vec3 viewDirection = normalize(cameraPosition - vPosition);
          float fresnel = pow(1.0 - dot(viewDirection, vNormal), 2.0);

          gl_FragColor = vec4(color + fresnel * energyColor * 0.5, 0.8);
        }
      `}
      transparent
      side={THREE.DoubleSide}
    />
  );
}

// Central Gateway Structure
function GatewayCore({ soundManager }: { soundManager?: any }) {
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
        {soundManager ? (
          <AudioReactiveMaterial soundManager={soundManager} />
        ) : (
          <MeshDistortMaterial
            color="#4A0E4E"
            emissive="#2D1B69"
            emissiveIntensity={0.3}
            distort={0.2}
            speed={1}
            transparent
            opacity={0.8}
          />
        )}
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
function NavigationNode({ position, label, icon: Icon, href, delay = 0, onHover, onClick }: {
  position: [number, number, number];
  label: string;
  icon: any;
  href: string;
  delay?: number;
  onHover?: (hovered: boolean) => void;
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime() + delay;
      meshRef.current.position.y = position[1] + Math.sin(time * 0.8) * 0.3;
      meshRef.current.rotation.y = time * 0.2;
    }
  });

  const handlePointerOver = () => {
    setHovered(true);
    onHover?.(true);
  };

  const handlePointerOut = () => {
    setHovered(false);
    onHover?.(false);
  };

  const handleClick = () => {
    onClick?.();
    // Add slight delay before navigation for audio feedback
    setTimeout(() => {
      window.location.href = href;
    }, 200);
  };

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
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
  const [soundManagerLoaded, setSoundManagerLoaded] = useState(false);
  const [playAmbient, setPlayAmbient] = useState<((soundName: string, options?: any) => string | undefined) | null>(null);
  const [playEffect, setPlayEffect] = useState<((soundName: string, options?: any) => void) | null>(null);
  const [soundManager, setSoundManager] = useState<any>(null);
  const ambientSoundId = useRef<string | null | undefined>(null);
  const lastHoverStates = useRef<{ [key: string]: boolean }>({});
  const proximitySounds = useRef<Map<string, string>>(new Map());
  const { camera } = useThree();

  // Lazy-load SoundManager after component mounts
  useEffect(() => {
    let mounted = true;

    // Check if we're in a browser environment with required APIs
    if (typeof window === 'undefined' || !window.AudioContext || !window.HTMLAudioElement) {
      console.warn('Audio APIs not available, continuing without sound');
      setSoundManagerLoaded(true);
      return;
    }

    import('@/lib/sound/SoundManager').then(mod => {
      if (mounted) {
        // Initialize sound manager with browser API guards
        const initSoundManager = async () => {
          try {
            // Check if audio is supported using the static method
            if (!mod.SoundManager.isAudioSupported()) {
              throw new Error('Audio APIs not supported');
            }

            const manager = new mod.SoundManager();

            // Load basic sounds with error handling for each
            const soundsToLoad = [
              { key: 'cosmic-ambient', path: '/sounds/cosmic-ambient.wav' },
              { key: 'energy-hum', path: '/sounds/energy-hum.wav' },
              { key: 'particle-field', path: '/sounds/particle-field.wav' },
              { key: 'node-hover', path: '/sounds/node-hover.wav' },
              { key: 'node-click', path: '/sounds/node-click.wav' },
              { key: 'welcome-chime', path: '/sounds/welcome-chime.wav' },
              { key: 'portal-open', path: '/sounds/portal-open.wav' }
            ];

            // Load sounds in parallel but handle failures gracefully
            const loadPromises = soundsToLoad.map(async ({ key, path }) => {
              try {
                await manager.loadSound(key, path);
                console.log(`Loaded sound: ${key}`);
              } catch (error) {
                console.warn(`Failed to load sound ${key}:`, error);
                // Continue without this sound
              }
            });

            await Promise.allSettled(loadPromises);

            setPlayAmbient(() => (soundName: string, options?: any) => {
              try {
                return manager.playSound(soundName, { loop: true, volume: 0.2, ...options });
              } catch (error) {
                console.warn(`Failed to play ambient sound ${soundName}:`, error);
                return undefined;
              }
            });

            setPlayEffect(() => (soundName: string, options?: any) => {
              try {
                return manager.playSound(soundName, { volume: 0.5, ...options });
              } catch (error) {
                console.warn(`Failed to play effect sound ${soundName}:`, error);
                // Continue silently
              }
            });

            // Store soundManager reference for audio-reactive effects
            setSoundManager(manager);

            setSoundManagerLoaded(true);
            console.log('SoundManager initialized successfully');
          } catch (error) {
            console.warn('Failed to initialize SoundManager:', error);
            setSoundManagerLoaded(true); // Continue without audio
          }
        };

        initSoundManager();
      }
    }).catch(error => {
      console.warn('Failed to load SoundManager module:', error);
      if (mounted) {
        setSoundManagerLoaded(true); // Continue without audio
      }
    });

    return () => { mounted = false };
  }, []);

  // Proximity-based audio system
  useFrame(() => {
    if (!soundManager || !soundManagerLoaded) return;

    const cameraPosition = camera.position;
    const navigationNodes = [
      { id: 'explore', position: new THREE.Vector3(8, 2, -5) },
      { id: 'create', position: new THREE.Vector3(-8, 1, -3) },
      { id: 'connect', position: new THREE.Vector3(0, -3, -8) },
      { id: 'discover', position: new THREE.Vector3(6, -2, 6) }
    ];

    navigationNodes.forEach(({ id, position }) => {
      const distance = cameraPosition.distanceTo(position);
      const maxDistance = 15; // Maximum distance for audio
      const minDistance = 3; // Minimum distance for full volume

      if (distance <= maxDistance) {
        // Calculate volume based on distance (inverse relationship)
        const volume = Math.max(0.05, Math.min(0.3, 1 - (distance - minDistance) / (maxDistance - minDistance)));

        // Start proximity sound if not already playing
        if (!proximitySounds.current.has(id)) {
          const soundId = soundManager.playSound('node-ambient', {
            volume,
            loop: true,
            spatial: { position, listener: camera }
          });
          if (soundId) {
            proximitySounds.current.set(id, soundId);
          }
        }
      } else {
        // Stop proximity sound if too far
        const soundId = proximitySounds.current.get(id);
        if (soundId) {
          soundManager.stopSound(soundId, 1); // Fade out over 1 second
          proximitySounds.current.delete(id);
        }
      }
    });
  });

  useEffect(() => {
    if (!playAmbient) return;

    // Start cosmic ambient sound
    const startAmbient = async () => {
      ambientSoundId.current = playAmbient('cosmic-ambient', {
        volume: 0.2,
        fadeIn: 3
      });

      // Start gateway energy hum
      playAmbient('energy-hum', {
        volume: 0.15,
        loop: true,
        fadeIn: 2
      });

      // Start particle field ambience
      playAmbient('particle-field', {
        volume: 0.1,
        loop: true,
        fadeIn: 4
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

  const handleNodeHover = (nodeId: string, hovered: boolean) => {
    const lastState = lastHoverStates.current[nodeId] || false;
    if (hovered && !lastState && playEffect) {
      // Play hover sound
      playEffect('node-hover', { volume: 0.3 });
      console.log(`Hovering ${nodeId}`);
    }
    lastHoverStates.current[nodeId] = hovered;
  };

  const handleNodeClick = (nodeId: string) => {
    // Play click sound
    if (playEffect) {
      playEffect('node-click', { volume: 0.5 });
    }
    console.log(`Clicking ${nodeId}`);
  };

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
      <GatewayCore soundManager={soundManager} />
      {/* SpatialAudio components removed - using direct sound manager calls instead */}

      {/* Navigation nodes with spatial audio */}
      <NavigationNode
        position={[8, 2, -5]}
        label="Explore"
        icon={Compass}
        href="/ai-city/explore"
        delay={0}
        onHover={(hovered) => handleNodeHover('explore', hovered)}
        onClick={() => handleNodeClick('explore')}
      />
      {/* SpatialAudio component intentionally removed; proximity audio handled by SoundManager */}

      <NavigationNode
        position={[-8, 1, -3]}
        label="Create"
        icon={Sparkles}
        href="/creator"
        delay={1}
        onHover={(hovered) => handleNodeHover('create', hovered)}
        onClick={() => handleNodeClick('create')}
      />

      <NavigationNode
        position={[0, -3, -8]}
        label="Connect"
        icon={Heart}
        href="/commons"
        delay={2}
        onHover={(hovered) => handleNodeHover('connect', hovered)}
        onClick={() => handleNodeClick('connect')}
      />

      <NavigationNode
        position={[6, -2, 6]}
        label="Discover"
        icon={Eye}
        href="/discover"
        delay={3}
        onHover={(hovered) => handleNodeHover('discover', hovered)}
        onClick={() => handleNodeClick('discover')}
      />

      {/* Particle field audio - handled by ambient sound */}

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

// Main City Gate Scene Component
export default function CityGateScene() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeStep, setWelcomeStep] = useState(0);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoaded(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      // Welcome sequence
      const steps = [
        () => setWelcomeStep(1), // Show title
        () => setWelcomeStep(2), // Show subtitle
        () => setWelcomeStep(3), // Show navigation hint
        () => setTimeout(() => setShowWelcome(false), 3000), // Fade out
      ];

      let stepIndex = 0;
      const stepTimer = setInterval(() => {
        if (stepIndex < steps.length) {
          steps[stepIndex]();
          stepIndex++;
        } else {
          clearInterval(stepTimer);
        }
      }, 1500);

      return () => clearInterval(stepTimer);
    }
  }, [isLoaded]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Loading screen */}
      {!isLoaded && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900"
        >
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"
            />
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-2xl font-bold text-white mb-2"
            >
              Entering AI City
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-cyan-300"
            >
              Initializing neural pathways...
            </motion.p>
          </div>
        </motion.div>
      )}

      {/* Welcome overlay */}
      {isLoaded && showWelcome && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <div className="text-center max-w-2xl px-8">
            {welcomeStep >= 1 && (
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-6xl font-bold text-white mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
              >
                Welcome to AI City
              </motion.h1>
            )}
            {welcomeStep >= 2 && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-xl text-gray-300 mb-8"
              >
                An autonomous e-commerce platform where AI agents create, trade, and evolve
              </motion.p>
            )}
            {welcomeStep >= 3 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-lg text-cyan-300"
              >
                Hover over the navigation nodes to explore different districts
              </motion.p>
            )}
          </div>
        </motion.div>
      )}

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

      {/* Main UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Status Bar */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
            <span className="text-cyan-300 text-sm font-medium">Aiverse Gateway Active</span>
          </div>

          <div className="flex items-center gap-4 text-purple-300 text-sm">
            <span>Navigate with mouse • Click nodes to enter</span>
            <Zap className="w-4 h-4" />
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-auto">
          <div className="max-w-4xl mx-auto flex justify-center">
            <Link
              href="/ai-city/explore"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 backdrop-blur-md border border-cyan-400/30 rounded-full text-cyan-300 hover:text-white hover:border-cyan-400 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25"
            >
              <Compass className="w-5 h-5" />
              <span className="font-semibold">Enter the Aiverse</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}