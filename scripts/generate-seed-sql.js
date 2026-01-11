#!/usr/bin/env node
/*
  scripts/generate-seed-sql.js
  - Generates SQL INSERT statements for the mythic shader layers
  - Can be run directly in Supabase SQL Editor
*/

const MYTHIC_LAYERS = [
  // Elemental Effects
  {
    name: "Mystic Fog",
    slug: "elemental.fog.mystic",
    type: "elemental",
    description: "Volumetric fog with depth layering and ethereal particles",
    shader_file: "/assets/shaders/elemental.fog.mystic.frag",
    blend_mode: "additive",
    default_strength: 0.6,
    parameters: [
      { name: "u_strength", type: "float", default: 0.6, min: 0, max: 1 },
      { name: "u_tint", type: "color", default: "#CCD6FF" },
      { name: "u_depth", type: "float", default: 0.8, min: 0, max: 1 },
      { name: "u_motion_reduced", type: "bool", default: false }
    ],
    tags: ["fog", "volumetric", "ethereal", "depth", "particles"],
    preview_image: "/shader-previews/mystic-fog.png",
    author: "Aiverse Core",
    license: "MIT",
    version: "1.0"
  },
  {
    name: "Volumetric Fog",
    slug: "elemental.fog.volumetric",
    type: "elemental",
    description: "3D noise-based fog with light scattering",
    shader_file: "/assets/shaders/elemental.fog.volumetric.frag",
    blend_mode: "additive",
    default_strength: 0.5,
    parameters: [
      { name: "u_strength", type: "float", default: 0.5, min: 0, max: 1 },
      { name: "u_fog_color", type: "color", default: "#E6F3FF" },
      { name: "u_density", type: "float", default: 0.7, min: 0, max: 1 },
      { name: "u_scattering", type: "float", default: 0.3, min: 0, max: 1 },
      { name: "u_motion_reduced", type: "bool", default: false }
    ],
    tags: ["fog", "volumetric", "light", "scattering", "atmospheric"],
    preview_image: "/shader-previews/volumetric-fog.png",
    author: "Aiverse Core",
    license: "MIT",
    version: "1.0"
  },
  {
    name: "Cinematic Bloom",
    slug: "elemental.bloom.cinematic",
    type: "elemental",
    description: "High-quality bloom with lens flare and chromatic aberration",
    shader_file: "/assets/shaders/elemental.bloom.cinematic.frag",
    blend_mode: "screen",
    default_strength: 0.4,
    parameters: [
      { name: "u_strength", type: "float", default: 0.4, min: 0, max: 1 },
      { name: "u_radius", type: "float", default: 0.8, min: 0.1, max: 2.0 },
      { name: "u_threshold", type: "float", default: 0.8, min: 0, max: 1 },
      { name: "u_chromatic", type: "float", default: 0.1, min: 0, max: 0.5 },
      { name: "u_motion_reduced", type: "bool", default: false }
    ],
    tags: ["bloom", "cinematic", "lens", "flare", "chromatic"],
    preview_image: "/shader-previews/cinematic-bloom.png",
    author: "Aiverse Core",
    license: "MIT",
    version: "1.0"
  },

  // Architectural Effects
  {
    name: "Runic Glow (Medium)",
    slug: "architectural.runic-glow.medium",
    type: "architectural",
    description: "Animated runic glyph energy flows with medium intensity",
    shader_file: "/assets/shaders/architectural.runic-glow.medium.frag",
    blend_mode: "additive",
    default_strength: 0.7,
    parameters: [
      { name: "u_strength", type: "float", default: 0.7, min: 0, max: 1 },
      { name: "u_speed", type: "float", default: 1.0, min: 0.1, max: 3.0 },
      { name: "u_color_primary", type: "color", default: "#4A90E2" },
      { name: "u_color_secondary", type: "color", default: "#9B59B6" },
      { name: "u_pulse_intensity", type: "float", default: 0.5, min: 0, max: 1 },
      { name: "u_motion_reduced", type: "bool", default: false }
    ],
    tags: ["runic", "glyph", "energy", "architectural", "animated"],
    preview_image: "/shader-previews/runic-glow-medium.png",
    author: "Aiverse Core",
    license: "MIT",
    version: "1.0"
  },

  // Ritual Effects
  {
    name: "Sacral Vignette",
    slug: "ritual.vignette.sacral",
    type: "ritual",
    description: "Sacred geometry vignette with energy seals and mystical borders",
    shader_file: "/assets/shaders/ritual.vignette.sacral.frag",
    blend_mode: "multiply",
    default_strength: 0.4,
    parameters: [
      { name: "u_strength", type: "float", default: 0.4, min: 0, max: 1 },
      { name: "u_tint", type: "color", default: "#E6B3FF" },
      { name: "u_border_width", type: "float", default: 0.4, min: 0.1, max: 0.8 },
      { name: "u_motion_reduced", type: "bool", default: false }
    ],
    tags: ["ritual", "sacred", "vignette", "geometry", "mystical"],
    preview_image: "/shader-previews/sacral-vignette.png",
    author: "Aiverse Core",
    license: "MIT",
    version: "1.0"
  },

  // Emotional Effects
  {
    name: "Melancholic Color Grade",
    slug: "emotional.color-grade.melancholy",
    type: "emotional",
    description: "Cool shadows and warm highlights for melancholic mood",
    shader_file: "/assets/shaders/emotional.color-grade.melancholy.frag",
    blend_mode: "overlay",
    default_strength: 0.3,
    parameters: [
      { name: "u_strength", type: "float", default: 0.3, min: 0, max: 1 },
      { name: "u_shadow_tint", type: "color", default: "#4A5568" },
      { name: "u_highlight_tint", type: "color", default: "#F7B733" },
      { name: "u_contrast", type: "float", default: 1.1, min: 0.5, max: 2.0 },
      { name: "u_saturation", type: "float", default: 0.8, min: 0, max: 2.0 }
    ],
    tags: ["emotional", "color-grade", "melancholy", "mood", "cinematic"],
    preview_image: "/shader-previews/melancholic-grade.png",
    author: "Aiverse Core",
    license: "MIT",
    version: "1.0"
  }
];

function generateSQL() {
  console.log('-- Mythic Shader Layers Seed Data');
  console.log('-- Run this in Supabase SQL Editor after creating the visual_layers table');
  console.log('');

  MYTHIC_LAYERS.forEach(layer => {
    const values = [
      `'${layer.name.replace(/'/g, "''")}'`, // name
      `'${layer.slug}'`, // slug
      `'${layer.type}'`, // type
      layer.description ? `'${layer.description.replace(/'/g, "''")}'` : 'NULL', // description
      layer.shader_file ? `'${layer.shader_file}'` : 'NULL', // shader_file
      'NULL', // lut_file
      'NULL', // mask_file
      layer.blend_mode ? `'${layer.blend_mode}'` : 'NULL', // blend_mode
      layer.default_strength || 0.6, // default_strength
      `'${JSON.stringify(layer.parameters).replace(/'/g, "''")}'`, // parameters
      `'${JSON.stringify(layer.tags).replace(/'/g, "''")}'`, // tags
      layer.preview_image ? `'${layer.preview_image}'` : 'NULL', // preview_image
      `'${layer.author}'`, // author
      `'${layer.license}'`, // license
      `'${layer.version}'` // version
    ];

    console.log(`INSERT INTO public.visual_layers (name, slug, type, description, shader_file, lut_file, mask_file, blend_mode, default_strength, parameters, tags, preview_image, author, license, version) VALUES (${values.join(', ')});`);
  });

  console.log('');
  console.log('-- Verify the data was inserted:');
  console.log('SELECT name, type, slug FROM public.visual_layers ORDER BY type, name;');
}

if (require.main === module) {
  generateSQL();
}

module.exports = { generateSQL, MYTHIC_LAYERS };