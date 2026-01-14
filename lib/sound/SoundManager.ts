'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';

// Sound Manager Class
class SoundManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private frequencyData: Uint8Array | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private activeSources: Map<string, AudioBufferSourceNode> = new Map();
  private isMuted: boolean = false;
  private masterVolume: number = 0.3;

  // Static method to check if audio is supported
  static isAudioSupported(): boolean {
    return typeof window !== 'undefined' &&
           !!(window.AudioContext || (window as any).webkitAudioContext) &&
           !!window.HTMLAudioElement;
  }

  constructor() {
    if (!SoundManager.isAudioSupported()) {
      throw new Error('Audio APIs not supported in this environment');
    }
    this.initAudio();
  }

  private async initAudio() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = this.masterVolume;

      // Initialize analyser for audio-reactive effects
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);

      // Connect analyser to master gain
      this.masterGain.connect(this.analyser);

      // Resume context on user interaction
      const resumeContext = () => {
        if (this.audioContext?.state === 'suspended') {
          this.audioContext.resume();
        }
        document.removeEventListener('click', resumeContext);
        document.removeEventListener('touchstart', resumeContext);
      };
      document.addEventListener('click', resumeContext);
      document.addEventListener('touchstart', resumeContext);

    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  async loadSound(name: string, url: string): Promise<void> {
    if (!this.audioContext) return;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.sounds.set(name, audioBuffer);
    } catch (error) {
      console.warn(`Failed to load sound ${name}:`, error);
    }
  }

  playSound(name: string, options: {
    loop?: boolean;
    volume?: number;
    fadeIn?: number;
    spatial?: { position: THREE.Vector3; listener: THREE.AudioListener };
  } = {}): string | null {
    if (!this.audioContext || !this.masterGain || this.isMuted) return null;

    const buffer = this.sounds.get(name);
    if (!buffer) return null;

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = buffer;
    source.loop = options.loop || false;

    // Set volume
    const volume = (options.volume || 1) * this.masterVolume;
    gainNode.gain.value = options.fadeIn ? 0 : volume;

    // Fade in if specified
    if (options.fadeIn) {
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + options.fadeIn);
    }

    // Spatial audio setup
    if (options.spatial) {
      const panner = this.audioContext.createPanner();
      panner.panningModel = 'HRTF';
      panner.distanceModel = 'inverse';
      panner.refDistance = 1;
      panner.maxDistance = 100;
      panner.rolloffFactor = 1;

      // Set position
      panner.positionX.value = options.spatial.position.x;
      panner.positionY.value = options.spatial.position.y;
      panner.positionZ.value = options.spatial.position.z;

      source.connect(gainNode);
      gainNode.connect(panner);
      panner.connect(this.masterGain);
    } else {
      source.connect(gainNode);
      gainNode.connect(this.masterGain);
    }

    source.start();

    const soundId = `${name}_${Date.now()}_${Math.random()}`;
    this.activeSources.set(soundId, source);

    // Cleanup when sound ends (if not looping)
    if (!options.loop) {
      source.onended = () => {
        this.activeSources.delete(soundId);
      };
    }

    return soundId;
  }

  stopSound(soundId: string, fadeOut: number = 0): void {
    const source = this.activeSources.get(soundId);
    if (!source || !this.audioContext) return;

    if (fadeOut > 0) {
      // Find the gain node in the chain and fade out
      // This is a simplified approach - in production you'd track gain nodes
      setTimeout(() => {
        try {
          source.stop();
        } catch (e) {
          // Source might already be stopped
        }
        this.activeSources.delete(soundId);
      }, fadeOut * 1000);
    } else {
      try {
        source.stop();
      } catch (e) {
        // Source might already be stopped
      }
      this.activeSources.delete(soundId);
    }
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.masterVolume;
    }
  }

  mute(): void {
    this.isMuted = true;
    this.activeSources.forEach((source) => {
      try {
        source.stop();
      } catch (e) {
        // Source might already be stopped
      }
    });
    this.activeSources.clear();
  }

  unmute(): void {
    this.isMuted = false;
  }

  isAudioReady(): boolean {
    return this.audioContext !== null && this.audioContext.state === 'running';
  }

  // Audio analysis methods for reactive effects
  getFrequencyData(): Uint8Array | null {
    if (!this.analyser || !this.frequencyData) return null;
    this.analyser.getByteFrequencyData(this.frequencyData);
    return this.frequencyData;
  }

  getAverageFrequency(startBin: number = 0, endBin: number = 32): number {
    const data = this.getFrequencyData();
    if (!data) return 0;

    let sum = 0;
    const count = Math.min(endBin, data.length) - startBin;
    for (let i = startBin; i < Math.min(endBin, data.length); i++) {
      sum += data[i];
    }
    return count > 0 ? sum / count / 255 : 0; // Normalize to 0-1
  }

  getBassLevel(): number {
    return this.getAverageFrequency(0, 8); // Low frequencies
  }

  getMidLevel(): number {
    return this.getAverageFrequency(8, 32); // Mid frequencies
  }

  getTrebleLevel(): number {
    return this.getAverageFrequency(32, 64); // High frequencies
  }

  dispose(): void {
    this.activeSources.forEach((source) => {
      try {
        source.stop();
      } catch (e) {
        // Source might already be stopped
      }
    });
    this.activeSources.clear();
    this.sounds.clear();

    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

// Generate procedural cosmic ambient sounds
function generateCosmicAmbient(duration: number = 10): AudioBuffer | null {
  // This would generate procedural ambient sounds
  // For now, we'll use Web Audio API synthesis
  // In production, you'd load pre-made ambient tracks
  return null;
}

// Generate energy hum sounds
function generateEnergyHum(frequency: number = 80): AudioBuffer | null {
  // Procedural energy hum generation
  // In production, you'd load pre-made sound effects
  return null;
}

// React Hook for Sound Management
export function useSoundManager() {
  const soundManagerRef = useRef<SoundManager | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    soundManagerRef.current = new SoundManager();

    // Load sound assets with custom file support
    const loadSounds = async () => {
      if (!soundManagerRef.current) return;

      try {
        // First, fetch custom audio assets from database
        const customAssetsResponse = await fetch('/api/admin/audio');
        const customAssetsData = customAssetsResponse.ok ? await customAssetsResponse.json() : { assets: [] };
        const customAssets = customAssetsData.assets || [];

        // Create a map of custom assets by name
        const customAssetMap: Record<string, any> = {};
        customAssets.forEach((asset: any) => {
          if (asset.is_active) {
            customAssetMap[asset.name] = asset;
          }
        });

        // Load sounds - prefer custom files over defaults
        const soundsToLoad = [
          { key: 'cosmic-ambient', defaultPath: '/sounds/cosmic-ambient.wav' },
          { key: 'energy-hum', defaultPath: '/sounds/energy-hum.wav' },
          { key: 'particle-field', defaultPath: '/sounds/particle-field.wav' },
          { key: 'node-hover', defaultPath: '/sounds/node-hover.wav' },
          { key: 'node-click', defaultPath: '/sounds/node-click.wav' },
          { key: 'portal-open', defaultPath: '/sounds/portal-open.wav' },
          { key: 'welcome-chime', defaultPath: '/sounds/welcome-chime.wav' }
        ];

        for (const sound of soundsToLoad) {
          const customAsset = customAssetMap[sound.key];
          const filePath = customAsset ? customAsset.file_url : sound.defaultPath;

          try {
            await soundManagerRef.current!.loadSound(sound.key, filePath);
          } catch (error) {
            console.warn(`Failed to load ${sound.key} from ${filePath}, continuing without audio...`, error);
            // Continue without this sound - don't try fallback
          }
        }

        setIsReady(true);
      } catch (error) {
        console.warn('Failed to load audio assets:', error);
        setIsReady(true); // Continue without audio
      }
    };

    loadSounds();

    return () => {
      if (soundManagerRef.current) {
        soundManagerRef.current.dispose();
      }
    };
  }, []);

  const playAmbient = useCallback((name: string, options?: any) => {
    return soundManagerRef.current?.playSound(name, { loop: true, volume: 0.2, ...options });
  }, []);

  const playEffect = useCallback((name: string, options?: any) => {
    return soundManagerRef.current?.playSound(name, { volume: 0.5, ...options });
  }, []);

  const stopSound = useCallback((soundId: string, fadeOut?: number) => {
    soundManagerRef.current?.stopSound(soundId, fadeOut);
  }, []);

  const setVolume = useCallback((volume: number) => {
    soundManagerRef.current?.setMasterVolume(volume);
  }, []);

  const toggleMute = useCallback(() => {
    if (!soundManagerRef.current) return;

    if (isMuted) {
      soundManagerRef.current.unmute();
      setIsMuted(false);
    } else {
      soundManagerRef.current.mute();
      setIsMuted(true);
    }
  }, [isMuted]);

  return {
    isReady,
    isMuted,
    playAmbient,
    playEffect,
    stopSound,
    setVolume,
    toggleMute,
    isAudioReady: soundManagerRef.current?.isAudioReady() || false,
    // Audio analysis methods
    getBassLevel: () => soundManagerRef.current?.getBassLevel() || 0,
    getMidLevel: () => soundManagerRef.current?.getMidLevel() || 0,
    getTrebleLevel: () => soundManagerRef.current?.getTrebleLevel() || 0,
    getAverageFrequency: (start?: number, end?: number) => soundManagerRef.current?.getAverageFrequency(start, end) || 0
  };
}

// Spatial Audio Component for 3D positioning
export function SpatialAudio({
  soundName,
  position,
  volume = 1,
  loop = false,
  autoPlay = false
}: {
  soundName: string;
  position: THREE.Vector3;
  volume?: number;
  loop?: boolean;
  autoPlay?: boolean;
}) {
  const { playEffect, playAmbient } = useSoundManager();
  const audioRef = useRef<THREE.Audio | null>(null);
  const [soundId, setSoundId] = useState<string | null>(null);

  useEffect(() => {
    if (autoPlay) {
      const id = loop
        ? playAmbient(soundName, { volume, spatial: { position, listener: audioRef.current?.listener } })
        : playEffect(soundName, { volume, spatial: { position, listener: audioRef.current?.listener } });

      setSoundId(id || null);
    }

    return () => {
      if (soundId) {
        // stopSound would be called here
      }
    };
  }, [soundName, position, volume, loop, autoPlay, playAmbient, playEffect]);

  return null; // This component doesn't render anything visual
}

export { SoundManager };