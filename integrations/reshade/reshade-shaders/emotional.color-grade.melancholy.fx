
// Mythic Shader: EMOTIONAL.COLOR GRADE.MELANCHOLY
// Converted for ReShade compatibility

#ifndef MYTHIC_SHADER_EMOTIONAL_COLOR_GRADE_MELANCHOLY
#define MYTHIC_SHADER_EMOTIONAL_COLOR_GRADE_MELANCHOLY

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

// emotional.color-grade.melancholy.frag
// Melancholic color grading with cool tones and subtle warmth
// Author: Aiverse Core
// License: MIT
// Version: 1.0


uniform sampler2D u_scene; // The scene texture to grade
uniform float u_strength; // 0.0 - 1.0
uniform vec3 u_shadow_tint; // cool shadows (blues)
uniform vec3 u_highlight_tint; // warm highlights (ambers)
uniform float2 u_resolution < source = "resolution"; >;
uniform float u_contrast; // contrast adjustment
uniform bool u_motion_reduced;



void PS_MythicShader(float4 vpos : SV_Position, float2 texcoord : TEXCOORD, out float4 color : SV_Target0) {
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

  color = vec4(graded, scene.a);
}

} // namespace

technique Mythicemotionalcolorgrademelancholy <
    ui_label = "Mythic emotional.color grade.melancholy";
    ui_tooltip = "Aiverse Mythic Shader Stack - emotional.color grade.melancholy";
>
{
    pass
    {
        VertexShader = PostProcessVS;
        PixelShader = MythicShaders::PS_MythicShader;
    }
}

#endif
