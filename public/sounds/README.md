# City Gate Sound Design System

## Overview
The City Gate features an immersive 3D audio experience that enhances the cinematic entry ritual with spatial sound design.

## Audio Architecture

### Sound Categories

#### 🌌 **Ambient Sounds**
- **Cosmic Background**: Deep space atmosphere with subtle stellar winds
- **Energy Field**: Low-frequency hum from the gateway core
- **Particle Field**: Gentle twinkling and whooshing particles

#### 🎵 **Interactive Sounds**
- **Hover Effects**: Soft energy pulses when hovering navigation nodes
- **Click Actions**: Satisfying portal activation sounds
- **UI Transitions**: Smooth audio cues for state changes

#### 🎭 **Cinematic Elements**
- **Welcome Sequence**: Building atmospheric music during intro phases
- **Gateway Activation**: Powerful energy surge when entering
- **Spatial Audio**: 3D positioning for immersive experience

## Required Audio Files

Place these files in `/public/sounds/`:

### Ambient Tracks
- `cosmic-ambient.wav` - Deep space background (looping, 2 minutes) ✅ **GENERATED**
- `energy-hum.wav` - Gateway core energy field (looping, 1 minute) ✅ **GENERATED**
- `particle-field.wav` - Particle system ambiance (looping, 1 minute) ✅ **GENERATED**

### Sound Effects
- `node-hover.wav` - Navigation node hover (0.8 seconds) ✅ **GENERATED**
- `node-click.wav` - Navigation node activation (1.5 seconds) ✅ **GENERATED**
- `portal-open.wav` - Gateway portal opening (2.5 seconds) ✅ **GENERATED**
- `welcome-chime.wav` - Welcome sequence transition (0.6 seconds) ✅ **GENERATED**

### Cinematic Music
- `gateway-entrance.mp3` - Main cinematic track (1-2 minutes)
- `sequence-build.mp3` - Welcome sequence build-up (30 seconds)

## Technical Implementation

### Web Audio API Features
- **Spatial Audio**: HRTF panning for 3D positioning
- **Dynamic Mixing**: Volume automation and crossfading
- **Performance Optimized**: Efficient buffer management
- **User Controls**: Mute/unmute and volume controls

### Audio Loading Strategy
- **Progressive Loading**: Ambient sounds load first
- **On-Demand Effects**: Interactive sounds load as needed
- **Fallback System**: Graceful degradation if audio fails
- **Memory Management**: Automatic cleanup of unused buffers

## Usage in Components

```tsx
import { useSoundManager, SpatialAudio } from '@/lib/sound/SoundManager';

// In your component
const { playAmbient, playEffect, toggleMute, isMuted } = useSoundManager();

// Play ambient sound
useEffect(() => {
  const ambientId = playAmbient('cosmic-ambient', {
    volume: 0.3,
    fadeIn: 2
  });
  return () => ambientId && stopSound(ambientId, 1);
}, []);

// Spatial audio for 3D objects
<SpatialAudio
  soundName="energy-hum"
  position={gatewayPosition}
  volume={0.4}
  loop={true}
  autoPlay={true}
/>
```

## Audio Guidelines

### Volume Levels
- **Ambient**: 0.2-0.4 (subtle background)
- **Effects**: 0.5-0.7 (noticeable but not overpowering)
- **Cinematic**: 0.3-0.6 (emotional impact)

### File Formats
- **MP3**: Best compatibility, good compression
- **WAV**: Highest quality, larger files
- **OGG**: Good compression, open format

### Optimization Tips
- **Bitrate**: 128-192kbps for balance of quality/size
- **Sample Rate**: 44.1kHz standard
- **Channels**: Stereo for spatial effects
- **Loop Points**: Seamless looping for ambient tracks

## Accessibility

### User Preferences
- **Mute Toggle**: Respects user audio preferences
- **Volume Control**: Adjustable master volume
- **Visual Feedback**: Audio state indicators
- **Reduced Motion**: Audio follows motion preferences

### Fallback Behavior
- **No Audio Support**: Graceful degradation to visual-only experience
- **Loading Failures**: Continues without sound
- **Network Issues**: Loads cached audio when available

## Future Enhancements

### Advanced Features
- **Dynamic Music**: Adaptive soundtrack based on user actions
- **Voice Synthesis**: AI-generated voiceovers for spirits
- **Environmental Audio**: Context-aware background sounds
- **Haptic Feedback**: Vibration patterns synced with audio

### Performance Optimizations
- **Web Audio Worklets**: Off-main-thread processing
- **Audio Streaming**: Progressive loading for large files
- **Compression**: Runtime audio compression for mobile
- **Spatial Optimization**: Distance-based volume culling

## Audio Production Notes

### Recording Environment
- **Reverb**: Cathedral-like spaces for gateway majesty
- **Microphone**: Large-diaphragm condenser for rich sound
- **Room Treatment**: Minimal reflections for clean capture

### Processing Chain
1. **EQ**: Boost presence (5-10kHz) and body (100-300Hz)
2. **Compression**: Gentle limiting to control dynamics
3. **Reverb**: Subtle space enhancement
4. **Mastering**: Loudness normalization and stereo widening

### Testing Checklist
- [ ] Audio loads without blocking page render
- [ ] Spatial positioning works in 3D space
- [ ] Volume controls function properly
- [ ] Mute state persists across sessions
- [ ] Fallback works on audio-disabled devices
- [ ] Performance impact is minimal (<5% CPU)