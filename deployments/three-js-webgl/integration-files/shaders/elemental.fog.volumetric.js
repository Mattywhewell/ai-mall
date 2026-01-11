module.exports = `// elemental.fog.volumetric.frag
// Volumetric fog with depth-based density and light scattering
// Author: Aiverse Core
// License: MIT
// Version: 1.0

precision mediump float;
uniform float u_time;
uniform float u_strength; // 0.0 - 1.0
uniform vec3 u_fog_color; // fog color
uniform vec2 u_resolution;
uniform float u_density; // fog density
uniform vec3 u_light_dir; // light direction for scattering
uniform bool u_motion_reduced;

varying vec2 vUv;

// 3D noise for volumetric effect
float noise3D(vec3 p) {
  return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
}

float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for(int i = 0; i < 4; i++) {
    value += amplitude * noise3D(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;

  // Create 3D position for volumetric effect
  vec3 pos = vec3(uv * 3.0, u_time * 0.1);

  // Generate volumetric noise
  float noise = fbm(pos);

  // Create depth layers
  float depth1 = fbm(pos + vec3(0.0, 0.0, 10.0));
  float depth2 = fbm(pos * 2.0 + vec3(5.0, 5.0, 15.0));
  float depth3 = fbm(pos * 4.0 + vec3(10.0, 10.0, 20.0));

  // Combine depth layers with falloff
  float fog = (noise + depth1 * 0.5 + depth2 * 0.25 + depth3 * 0.125) * u_density;

  // Distance-based fog (further = more fog)
  float dist = length(uv - vec2(0.5));
  fog *= smoothstep(0.0, 1.0, dist);

  // Light scattering effect
  float scatter = max(0.0, dot(normalize(u_light_dir), normalize(vec3(uv - 0.5, 0.5))));
  fog += scatter * 0.2 * u_strength;

  // Apply strength and clamp
  fog = clamp(fog * u_strength, 0.0, 1.0);

  vec3 color = u_fog_color * fog;

  gl_FragColor = vec4(color, fog * 0.8);
}`;