
// Mythic Shader: ARCHITECTURAL.RUNIC GLOW.MEDIUM
// Converted for ReShade compatibility

#ifndef MYTHIC_SHADER_ARCHITECTURAL_RUNIC_GLOW_MEDIUM
#define MYTHIC_SHADER_ARCHITECTURAL_RUNIC_GLOW_MEDIUM

#include "ReShade.fxh"

namespace MythicShaders {

uniform float u_strength <
    ui_type = "slider";
    ui_min = 0.0;
    ui_max = 1.0;
    ui_label = "Strength";
    ui_tooltip = "Effect strength";
> = 0.6;

uniform float3 u_tint <
    ui_type = "color";
    ui_label = "Tint Color";
    ui_tooltip = "Effect tint color";
> = float3(0.8, 0.9, 1.0);

uniform bool u_motion_reduced <
    ui_label = "Motion Reduced";
    ui_tooltip = "Reduce motion for accessibility";
> = false;

texture texColorBuffer : COLOR;

sampler samplerColor
{
    Texture = texColorBuffer;
};

// architectural.runic-glow.medium.frag
// Runic glyph glow with animated energy flow
// Author: Aiverse Core
// License: MIT
// Version: 1.0


uniform float timer < source = "timer"; >;
uniform float u_strength; // 0.0 - 1.0
uniform vec3 u_tint; // runic energy color
uniform float2 u_resolution < source = "resolution"; >;
uniform float u_pulse_speed; // energy flow speed
uniform bool u_motion_reduced;



// Hash function for pseudo-random glyph patterns
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// Voronoi-like pattern for runic structure
vec2 voronoi(vec2 x) {
  vec2 n = floor(x);
  vec2 f = fract(x);
  vec2 mg, mr;
  float md = 8.0;

  for(int j = -1; j <= 1; j++) {
    for(int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = vec2(hash(n + g), hash(n + g + vec2(0.5)));
      vec2 r = g + o - f;
      float d = dot(r, r);

      if(d < md) {
        md = d;
        mr = r;
        mg = g;
      }
    }
  }
  return mr;
}

void PS_MythicShader(float4 vpos : SV_Position, float2 texcoord : TEXCOORD, out float4 color : SV_Target0) {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 st = uv * 8.0; // Scale for glyph density

  // Create runic grid pattern
  vec2 gv = fract(st) - 0.5;
  vec2 id = floor(st);

  // Generate runic symbols using voronoi
  vec2 cell = voronoi(st);

  // Create glyph shapes (simplified runic patterns)
  float glyph = 0.0;

  // Vertical strokes
  glyph += smoothstep(0.02, 0.0, abs(gv.x)) * step(0.1, hash(id));
  glyph += smoothstep(0.02, 0.0, abs(gv.y)) * step(0.3, hash(id + vec2(10.0)));

  // Diagonal connections
  float diag1 = smoothstep(0.03, 0.0, abs(gv.x - gv.y));
  float diag2 = smoothstep(0.03, 0.0, abs(gv.x + gv.y));
  glyph += (diag1 + diag2) * step(0.6, hash(id + vec2(20.0)));

  // Circular elements
  float circle = smoothstep(0.15, 0.13, length(gv));
  glyph += circle * step(0.8, hash(id + vec2(30.0)));

  // Animate energy flow
  float time = u_motion_reduced ? 0.0 : u_time * u_pulse_speed;
  float flow = sin(time + hash(id) * 6.28) * 0.5 + 0.5;

  // Energy pulsing along glyph paths
  float energy = glyph * flow * u_strength;

  // Add subtle glow halo
  float halo = smoothstep(0.1, 0.0, length(gv)) * energy * 0.3;

  vec3 color = mix(vec3(0.0), u_tint, energy + halo);

  color = vec4(color, energy * 0.7);
}

} // namespace

technique Mythicarchitecturalrunicglowmedium <
    ui_label = "Mythic architectural.runic glow.medium";
    ui_tooltip = "Aiverse Mythic Shader Stack - architectural.runic glow.medium";
>
{
    pass
    {
        VertexShader = PostProcessVS;
        PixelShader = MythicShaders::PS_MythicShader;
    }
}

#endif
