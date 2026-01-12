#!/usr/bin/env node

/**
 * City Gate Audio Asset Generator
 *
 * This script generates basic synthetic audio assets for the City Gate
 * sound design system. These serve as functional placeholders until
 * professional audio production is commissioned.
 *
 * Usage: node scripts/generate-audio-assets.js
 */

const fs = require('fs');
const path = require('path');

// Audio generation utilities
class AudioGenerator {
  constructor(sampleRate = 44100) {
    this.sampleRate = sampleRate;
    this.audioContext = null;
  }

  // Initialize Web Audio API context
  async initContext() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } else {
      // Node.js environment - we'll create synthetic audio data
      console.log('Running in Node.js - generating synthetic audio data');
    }
  }

  // Generate cosmic ambient background
  generateCosmicAmbient(duration = 120) { // 2 minutes
    console.log('Generating cosmic ambient background...');

    const samples = duration * this.sampleRate;
    const audioData = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;

      // Low-frequency rumble (20-100Hz)
      const rumble = Math.sin(2 * Math.PI * 25 * t) * 0.1 +
                    Math.sin(2 * Math.PI * 35 * t) * 0.08 +
                    Math.sin(2 * Math.PI * 50 * t) * 0.06;

      // Subtle stellar winds (filtered noise)
      const wind = (Math.random() - 0.5) * 0.05 * Math.sin(2 * Math.PI * 0.1 * t);

      // Occasional cosmic events
      const cosmicEvent = Math.random() < 0.001 ?
        Math.sin(2 * Math.PI * 2000 * t) * Math.exp(-t % 1) * 0.1 : 0;

      audioData[i] = rumble + wind + cosmicEvent;
    }

    return audioData;
  }

  // Generate energy field hum
  generateEnergyHum(duration = 60) { // 1 minute
    console.log('Generating energy field hum...');

    const samples = duration * this.sampleRate;
    const audioData = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;

      // Deep sub-bass foundation
      const subBass = Math.sin(2 * Math.PI * 25 * t) * 0.3 +
                     Math.sin(2 * Math.PI * 50 * t) * 0.2;

      // Harmonic overtones
      const harmonics = Math.sin(2 * Math.PI * 75 * t) * 0.1 +
                       Math.sin(2 * Math.PI * 100 * t) * 0.08;

      // Pulsing modulation
      const pulse = 1 + Math.sin(2 * Math.PI * 0.5 * t) * 0.2;

      // Crystal resonances
      const crystal = Math.sin(2 * Math.PI * 2000 * t) * 0.05 *
                     Math.exp(-Math.pow((t % 2) - 1, 2) / 0.1);

      audioData[i] = (subBass + harmonics) * pulse + crystal;
    }

    return audioData;
  }

  // Generate particle field ambiance
  generateParticleField(duration = 60) { // 1 minute
    console.log('Generating particle field ambiance...');

    const samples = duration * this.sampleRate;
    const audioData = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;

      // High-frequency twinkles
      const twinkle1 = Math.random() < 0.01 ?
        Math.sin(2 * Math.PI * 8000 * t) * Math.exp(-t % 0.1) * 0.1 : 0;

      const twinkle2 = Math.random() < 0.008 ?
        Math.sin(2 * Math.PI * 12000 * t) * Math.exp(-t % 0.15) * 0.08 : 0;

      // Gentle whooshing particles
      const whoosh = Math.sin(2 * Math.PI * 200 * t) *
                    Math.sin(2 * Math.PI * 0.1 * t) * 0.05;

      // Crystalline chimes
      const chime = Math.random() < 0.005 ?
        Math.sin(2 * Math.PI * 4000 * t) * Math.exp(-t % 0.2) * 0.06 : 0;

      audioData[i] = twinkle1 + twinkle2 + whoosh + chime;
    }

    return audioData;
  }

  // Generate navigation node hover
  generateNodeHover(duration = 0.8) {
    console.log('Generating navigation node hover...');

    const samples = Math.floor(duration * this.sampleRate);
    const audioData = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;

      // Gentle rising tone
      const freq = 400 + (t / duration) * 800; // 400Hz to 1200Hz
      const tone = Math.sin(2 * Math.PI * freq * t);

      // Harmonic richness
      const harmonic1 = Math.sin(2 * Math.PI * freq * 2 * t) * 0.3;
      const harmonic2 = Math.sin(2 * Math.PI * freq * 3 * t) * 0.2;

      // Natural decay envelope
      const envelope = Math.exp(-t / duration * 2);

      audioData[i] = (tone + harmonic1 + harmonic2) * envelope * 0.3;
    }

    return audioData;
  }

  // Generate navigation node click
  generateNodeClick(duration = 1.5) {
    console.log('Generating navigation node click...');

    const samples = Math.floor(duration * this.sampleRate);
    const audioData = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;

      // Building energy swell
      const swell = Math.sin(2 * Math.PI * 100 * t) *
                   (1 - Math.exp(-t * 3)) * 0.4;

      // Harmonic cascade
      const cascade = Math.sin(2 * Math.PI * 800 * t) *
                     Math.exp(-t * 2) * 0.3;

      // Crystalline overtones
      const crystal = Math.sin(2 * Math.PI * 2400 * t) *
                     Math.exp(-t * 1.5) * 0.2;

      audioData[i] = swell + cascade + crystal;
    }

    return audioData;
  }

  // Generate portal opening
  generatePortalOpen(duration = 2.5) {
    console.log('Generating portal opening...');

    const samples = Math.floor(duration * this.sampleRate);
    const audioData = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;

      // Building energy
      const energy = Math.sin(2 * Math.PI * 50 * t) *
                    (t / duration) * 0.5;

      // Multi-layered sound design
      const layer1 = Math.sin(2 * Math.PI * 200 * t) *
                    Math.sin(2 * Math.PI * 0.5 * t) * 0.3;

      const layer2 = Math.sin(2 * Math.PI * 600 * t) *
                    Math.exp(-t * 0.8) * 0.2;

      // Spatial movement effect
      const movement = Math.sin(2 * Math.PI * 1000 * t) *
                      Math.sin(2 * Math.PI * 0.2 * t) * 0.1;

      audioData[i] = energy + layer1 + layer2 + movement;
    }

    return audioData;
  }

  // Generate welcome chime
  generateWelcomeChime(duration = 0.6) {
    console.log('Generating welcome chime...');

    const samples = Math.floor(duration * this.sampleRate);
    const audioData = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
      const t = i / this.sampleRate;

      // Bell-like tone
      const bell = Math.sin(2 * Math.PI * 800 * t) * 0.4;

      // Harmonics for richness
      const harmonic1 = Math.sin(2 * Math.PI * 1600 * t) * 0.2;
      const harmonic2 = Math.sin(2 * Math.PI * 2400 * t) * 0.1;

      // Natural decay
      const decay = Math.exp(-t * 3);

      audioData[i] = (bell + harmonic1 + harmonic2) * decay;
    }

    return audioData;
  }

  // Convert Float32Array to WAV format
  float32ArrayToWav(audioData, sampleRate = 44100) {
    const length = audioData.length;
    const buffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);

    // Audio data
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, audioData[i]));
      view.setInt16(44 + i * 2, sample * 32767, true);
    }

    return buffer;
  }

  // Save audio file
  async saveAudioFile(audioData, filename) {
    const wavBuffer = this.float32ArrayToWav(audioData, this.sampleRate);
    const outputPath = path.join(__dirname, '..', 'public', 'sounds', filename);

    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, Buffer.from(wavBuffer));
    console.log(`Saved: ${filename}`);
  }
}

// Main generation function
async function generateAllAudioAssets() {
  console.log('🎵 City Gate Audio Asset Generator');
  console.log('=====================================');

  const generator = new AudioGenerator();
  await generator.initContext();

  // Generate all audio assets
  const assets = [
    { name: 'cosmic-ambient.wav', generator: 'generateCosmicAmbient', duration: 120 },
    { name: 'energy-hum.wav', generator: 'generateEnergyHum', duration: 60 },
    { name: 'particle-field.wav', generator: 'generateParticleField', duration: 60 },
    { name: 'node-hover.wav', generator: 'generateNodeHover', duration: 0.8 },
    { name: 'node-click.wav', generator: 'generateNodeClick', duration: 1.5 },
    { name: 'portal-open.wav', generator: 'generatePortalOpen', duration: 2.5 },
    { name: 'welcome-chime.wav', generator: 'generateWelcomeChime', duration: 0.6 }
  ];

  for (const asset of assets) {
    const audioData = generator[asset.generator](asset.duration);
    await generator.saveAudioFile(audioData, asset.name);
  }

  console.log('\n✅ All audio assets generated successfully!');
  console.log('📁 Files saved to: public/sounds/');
  console.log('\n📝 Note: These are synthetic placeholders.');
  console.log('   For production, commission professional audio design.');
  console.log('   See: AUDIO_COMMISSIONING_GUIDE.md');
}

// Run if called directly
if (require.main === module) {
  generateAllAudioAssets().catch(console.error);
}

module.exports = { AudioGenerator };