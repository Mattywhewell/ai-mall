module.exports = `// elemental.bloom.cinematic.frag
// Cinematic bloom effect with ethereal light scattering
// Author: Aiverse Core
// License: MIT
// Version: 1.0

precision mediump float;
uniform sampler2D u_scene; // Scene texture
uniform float u_strength; // 0.0 - 1.0
uniform vec3 u_bloom_tint; // bloom color
uniform vec2 u_resolution;
uniform float u_radius; // bloom radius
uniform int u_iterations; // blur iterations
uniform bool u_motion_reduced;

varying vec2 vUv;

// Simple gaussian blur approximation
vec4 gaussianBlur(sampler2D tex, vec2 uv, vec2 resolution, float radius) {
  vec4 color = vec4(0.0);
  float total = 0.0;

  // 9-tap gaussian kernel approximation
  float kernel[9];
  kernel[0] = 1.0/16.0; kernel[1] = 2.0/16.0; kernel[2] = 1.0/16.0;
  kernel[3] = 2.0/16.0; kernel[4] = 4.0/16.0; kernel[5] = 2.0/16.0;
  kernel[6] = 1.0/16.0; kernel[7] = 2.0/16.0; kernel[8] = 1.0/16.0;

  for(int i = -1; i <= 1; i++) {
    for(int j = -1; j <= 1; j++) {
      vec2 offset = vec2(float(i), float(j)) * radius / resolution;
      color += texture2D(tex, uv + offset) * kernel[(i+1)*3 + (j+1)];
      total += kernel[(i+1)*3 + (j+1)];
    }
  }

  return color / total;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec4 scene = texture2D(u_scene, uv);

  // Extract bright areas for bloom
  float brightness = dot(scene.rgb, vec3(0.299, 0.587, 0.114));
  vec4 bloomSource = scene * step(0.6, brightness);

  // Apply gaussian blur for bloom effect
  vec4 bloom = gaussianBlur(u_scene, uv, u_resolution, u_radius);

  // Tint the bloom
  bloom.rgb *= u_bloom_tint;

  // Screen blend mode for bloom
  vec3 bloomColor = 1.0 - (1.0 - scene.rgb) * (1.0 - bloom.rgb * u_strength);

  gl_FragColor = vec4(bloomColor, scene.a);
}`;