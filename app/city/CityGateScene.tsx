'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Text, Html, useTexture, Sphere, MeshDistortMaterial } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import Link from 'next/link';
import { Compass, Sparkles, Heart, ArrowRight, Eye, Zap, Volume2, VolumeX } from 'lucide-react';
import dynamic from 'next/dynamic';

// Load the heavy client-only 3D scene dynamically to avoid bundling/runtime issues
const CityGateClientScene = dynamic(() => import('./CityGateClientScene'), { ssr: false });


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
      {process.env.NEXT_PUBLIC_DISABLE_3D === '1' || process.env.NEXT_PUBLIC_DISABLE_3D === 'true' ? (
        <div className="h-full w-full flex items-center justify-center text-white">3D disabled — using fallback UI</div>
      ) : (
        <CityGateClientScene />
      )}

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