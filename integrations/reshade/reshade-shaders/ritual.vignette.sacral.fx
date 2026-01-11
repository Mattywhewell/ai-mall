
// Mythic Shader: RITUAL.VIGNETTE.SACRAL
// Converted for ReShade compatibility

#ifndef MYTHIC_SHADER_RITUAL_VIGNETTE_SACRAL
#define MYTHIC_SHADER_RITUAL_VIGNETTE_SACRAL

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

// ritual.vignette.sacral.frag
// Sacred ritual vignette with mystical borders and energy seals
// Author: Aiverse Core
// License: MIT
// Version: 1.0


uniform float timer < source = "timer"; >;
uniform float u_strength; // 0.0 - 1.0
uniform vec3 u_tint; // ritual energy color
uniform float2 u_resolution < source = "resolution"; >;
uniform float u_border_width; // vignette border thickness
uniform bool u_motion_reduced;



// Sacred geometry pattern (simplified mandala/star)
float sacredPattern(vec2 uv, float time) {
  vec2 st = uv * 2.0 - 1.0;

  // Create star pattern
  float angle = atan(st.y, st.x);
  float radius = length(st);

  // 8-pointed star
  float star = 0.0;
  for(int i = 0; i < 8; i++) {
    float a = float(i) * 3.14159 / 4.0;
    vec2 dir = vec2(cos(a), sin(a));
    float dist = dot(st, dir);
    star += smoothstep(0.02, 0.0, abs(dist - radius * 0.7));
  }

  // Circular seals
  float circles = 0.0;
  for(int i = 1; i <= 3; i++) {
    float r = float(i) * 0.2;
    circles += smoothstep(0.01, 0.0, abs(radius - r));
  }

  // Animate energy flow
  float flow = sin(time + radius * 8.0) * 0.5 + 0.5;

  return (star + circles) * flow;
}

void PS_MythicShader(float4 vpos : SV_Position, float2 texcoord : TEXCOORD, out float4 color : SV_Target0) {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 center = vec2(0.5, 0.5);

  // Distance from center for vignette
  float dist = distance(uv, center);

  // Create layered vignette effect
  float vignette1 = smoothstep(0.3, 0.8, dist);
  float vignette2 = smoothstep(0.2, 0.7, dist);
  float vignette3 = smoothstep(0.1, 0.6, dist);

  // Combine with strength
  float vignette = (vignette1 + vignette2 * 0.5 + vignette3 * 0.25) * u_strength;

  // Add sacred geometry at borders
  float time = u_motion_reduced ? 0.0 : u_time;
  float sacred = sacredPattern(uv, time);

  // Border energy effect
  float border = smoothstep(u_border_width, u_border_width + 0.1, dist);
  float energy = sacred * border * u_strength;

  // Create mystical color mixing
  vec3 vignetteColor = mix(vec3(0.0), u_tint * 0.3, vignette);
  vec3 energyColor = mix(vec3(0.0), u_tint, energy);

  vec3 finalColor = vignetteColor + energyColor;

  color = vec4(finalColor, vignette + energy * 0.8);
}

} // namespace

technique Mythicritualvignettesacral <
    ui_label = "Mythic ritual.vignette.sacral";
    ui_tooltip = "Aiverse Mythic Shader Stack - ritual.vignette.sacral";
>
{
    pass
    {
        VertexShader = PostProcessVS;
        PixelShader = MythicShaders::PS_MythicShader;
    }
}

#endif
