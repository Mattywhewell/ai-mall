# Mythic Shader Stack Components

Create a React component library with the following mythic shader effects:

## Components Needed:

1. **MythicFog** - Volumetric fog with depth layering
   - Props: strength (0-1), tint (color), depth (0-1), motionReduced (bool)
   - Uses CSS backdrop-filter and canvas for WebGL fallback

2. **RunicGlow** - Animated runic energy flows  
   - Props: strength (0-1), primaryColor, secondaryColor, speed (0.1-3)
   - CSS animations with SVG patterns for glow effects

3. **SacralVignette** - Sacred geometry borders
   - Props: strength (0-1), tint (color), borderWidth (0.1-0.8)
   - CSS box-shadow with radial gradients

4. **MelancholyGrade** - Emotional color grading
   - Props: strength (0-1), shadowTint, highlightTint, contrast (0.5-2)
   - CSS filter with custom blend modes

5. **MythicLayerRenderer** - Main component that combines all effects
   - Props: layers (array), preset (string), motionReduced (bool)
   - Manages stacking and blend modes

## Technical Requirements:
- React 18+ with TypeScript
- Tailwind CSS for styling
- Framer Motion for animations
- Canvas API for advanced effects
- WebGL support detection
- Accessibility features (motion reduction)
- Performance optimized (< 16ms frame time)

## Shader Taxonomy:
Use the Aiverse naming convention:
- elemental.fog.mystic
- architectural.runic-glow.medium  
- ritual.vignette.sacral
- emotional.color-grade.melancholy

## Example Usage:
```tsx
import { MythicLayerRenderer } from 'mythic-shaders'

export function MysticScene() {
  return (
    <MythicLayerRenderer
      preset="Observatory of Becoming"
      motionReduced={false}
    >
      <YourContent />
    </MythicLayerRenderer>
  )
}
```

Generate the complete component library with proper TypeScript types, accessibility features, and performance optimizations.