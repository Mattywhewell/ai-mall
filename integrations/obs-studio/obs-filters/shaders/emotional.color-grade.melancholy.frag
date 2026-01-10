// emotional.color-grade.melancholy.frag
// Melancholic color grading with cool tones and subtle warmth
// Author: Aiverse Core
// License: MIT
// Version: 1.0

precision mediump float;
uniform sampler2D u_scene; // The scene texture to grade
uniform float u_strength; // 0.0 - 1.0
uniform vec3 u_shadow_tint; // cool shadows (blues)
uniform vec3 u_highlight_tint; // warm highlights (ambers)
uniform vec2 u_resolution;
uniform float u_contrast; // contrast adjustment
uniform bool u_motion_reduced;

varying vec2 vUv;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec4 scene = texture2D(u_scene, uv);

  // Convert to linear color space approximation
  vec3 color = scene.rgb;

  // Calculate luminance for shadow/highlight separation
  float luminance = dot(color, vec3(0.299, 0.587, 0.114));

  // Create shadow/highlight masks
  float shadows = 1.0 - smoothstep(0.2, 0.6, luminance);
  float highlights = smoothstep(0.4, 0.8, luminance);

  // Apply emotional color grading
  vec3 graded = color;

  // Cool shadows (melancholic blues)
  graded = mix(graded, color * u_shadow_tint, shadows * u_strength * 0.7);

  // Warm highlights (subtle amber glow)
  graded = mix(graded, color * u_highlight_tint, highlights * u_strength * 0.5);

  // Apply contrast adjustment
  graded = (graded - 0.5) * u_contrast + 0.5;

  // Add subtle film grain for texture
  float grain = fract(sin(dot(uv + u_time * 0.001, vec2(12.9898, 78.233))) * 43758.5453);
  graded += (grain - 0.5) * 0.02 * u_strength;

  // Ensure colors stay in valid range
  graded = clamp(graded, 0.0, 1.0);

  gl_FragColor = vec4(graded, scene.a);
}