
// Mythic Shader: ELEMENTAL.FOG.VOLUMETRIC
// Converted for ReShade compatibility

#ifndef MYTHIC_SHADER_ELEMENTAL_FOG_VOLUMETRIC
#define MYTHIC_SHADER_ELEMENTAL_FOG_VOLUMETRIC

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

// elemental.fog.volumetric.frag
// Volumetric fog with depth-based density and light scattering
// Author: Aiverse Core
// License: MIT
// Version: 1.0


uniform float timer < source = "timer"; >;
uniform float u_strength; // 0.0 - 1.0
uniform vec3 u_fog_color; // fog color
uniform float2 u_resolution < source = "resolution"; >;
uniform float u_density; // fog density
uniform vec3 u_light_dir; // light direction for scattering
uniform bool u_motion_reduced;



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

void PS_MythicShader(float4 vpos : SV_Position, float2 texcoord : TEXCOORD, out float4 color : SV_Target0) {
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

  color = vec4(color, fog * 0.8);
}

} // namespace

technique Mythicelementalfogvolumetric <
    ui_label = "Mythic elemental.fog.volumetric";
    ui_tooltip = "Aiverse Mythic Shader Stack - elemental.fog.volumetric";
>
{
    pass
    {
        VertexShader = PostProcessVS;
        PixelShader = MythicShaders::PS_MythicShader;
    }
}

#endif
