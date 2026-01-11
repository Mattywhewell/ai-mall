#!/usr/bin/env node
/*
  scripts/seed-mythic-layers.js
  - Seeds the visual_layers table with the complete mythic shader stack
  - Includes all elemental, architectural, ritual, and emotional effects
  - Sets up proper metadata, parameters, and preview images
*/

const https = require('https');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Direct REST API helper function
function supabaseRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = `${supabaseUrl}/rest/v1/${endpoint}`;
    const options = {
      method,
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ data: response, status: res.statusCode });
        } catch (e) {
          resolve({ data: body, status: res.statusCode });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Table creation SQL
const CREATE_TABLE_SQL = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.visual_layers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('elemental','architectural','ritual','emotional','util')),
  description text,
  shader_file text,
  lut_file text,
  mask_file text,
  blend_mode text,
  default_strength numeric DEFAULT 0.6,
  parameters jsonb DEFAULT '[]'::jsonb,
  tags text[] DEFAULT '{}',
  preview_image text,
  author text,
  license text,
  version text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visual_layers_slug ON public.visual_layers (slug);
`;

async function createTableIfNotExists() {
  console.log('🔧 Checking/creating visual_layers table...');

  try {
    // Try to query the table first
    const { data, error: checkError } = await supabase
      .from('visual_layers')
      .select('id')
      .limit(1);

    if (checkError) {
      if (checkError.message.includes('relation') && checkError.message.includes('does not exist')) {
        console.log('📋 Table does not exist, attempting to create...');

        // Try to create the table using a workaround
        // Since direct DDL might not work, let's try inserting and see if it creates the table
        console.log('⚠️  Please manually run this SQL in your Supabase SQL editor:');
        console.log(CREATE_TABLE_SQL);
        console.log('\nThen re-run this seeding script.');

        throw new Error('Table does not exist. Please create it manually first.');
      } else {
        // Some other error, but table might exist
        console.log('✅ Table exists (with query error, but proceeding)');
      }
    } else {
      console.log('✅ Table exists');
    }
  } catch (error) {
    console.error('❌ Error checking table:', error.message);
    throw error;
  }
}

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
      { name: "u_light_dir", type: "vec3", default: [0.5, 0.8, 0.3] }
    ],
    tags: ["fog", "3d", "light-scattering", "atmospheric"],
    preview_image: "/shader-previews/volumetric-fog.png",
    author: "Aiverse Core",
    license: "MIT",
    version: "1.0"
  },
  {
    name: "Cinematic Bloom",
    slug: "elemental.bloom.cinematic",
    type: "elemental",
    description: "Film-quality bloom effect with light scattering",
    shader_file: "/assets/shaders/elemental.bloom.cinematic.frag",
    blend_mode: "screen",
    default_strength: 0.3,
    parameters: [
      { name: "u_strength", type: "float", default: 0.3, min: 0, max: 1 },
      { name: "u_bloom_tint", type: "color", default: "#FFF8DC" },
      { name: "u_radius", type: "float", default: 2.0, min: 1, max: 5 },
      { name: "u_iterations", type: "int", default: 3, min: 1, max: 5 }
    ],
    tags: ["bloom", "cinematic", "light", "scattering"],
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
    description: "Animated glyph energy flows on architectural surfaces",
    shader_file: "/assets/shaders/architectural.runic-glow.medium.frag",
    blend_mode: "additive",
    default_strength: 0.5,
    parameters: [
      { name: "u_strength", type: "float", default: 0.5, min: 0, max: 1 },
      { name: "u_tint", type: "color", default: "#FFC87A" },
      { name: "u_pulse_speed", type: "float", default: 1.0, min: 0.1, max: 3.0 },
      { name: "u_motion_reduced", type: "bool", default: false }
    ],
    tags: ["runic", "glyph", "architectural", "energy", "animated"],
    preview_image: "/shader-previews/runic-medium.png",
    author: "Aiverse Core",
    license: "MIT",
    version: "1.0"
  },

  // Ritual Effects
  {
    name: "Sacral Vignette",
    slug: "ritual.vignette.sacral",
    type: "ritual",
    description: "Sacred geometry vignette with mystical energy seals",
    shader_file: "/assets/shaders/ritual.vignette.sacral.frag",
    blend_mode: "alpha",
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
      { name: "u_shadow_tint", type: "color", default: "#4A90E2" },
      { name: "u_highlight_tint", type: "color", default: "#FFD700" },
      { name: "u_contrast", type: "float", default: 1.1, min: 0.5, max: 2.0 }
    ],
    tags: ["emotional", "color-grade", "melancholy", "mood", "cinematic"],
    preview_image: "/shader-previews/melancholy-grade.png",
    author: "Aiverse Core",
    license: "MIT",
    version: "1.0"
  }
];

async function seedMythicLayers() {
  console.log('🌟 Seeding Mythic Shader Layers...');

  try {
    // First ensure table exists
    await createTableIfNotExists();

    console.log('🧹 Clearing existing mythic layers...');

    // Clear existing mythic layers using direct API
    for (const layer of MYTHIC_LAYERS) {
      try {
        await supabaseRequest(`visual_layers?slug=eq.${layer.slug}`, 'DELETE');
      } catch (e) {
        // Ignore errors during cleanup
      }
    }

    console.log('📝 Inserting new layers...');

    // Insert new layers using direct API
    const results = [];
    for (const layer of MYTHIC_LAYERS) {
      console.log(`  ➤ Inserting ${layer.name}...`);

      const { data, status } = await supabaseRequest('visual_layers', 'POST', layer);

      if (status >= 200 && status < 300) {
        results.push(data[0] || data);
        console.log('    ✅ Success');
      } else {
        console.log('    ❌ Failed:', status, data);
      }
    }

    console.log(`\n🎉 Successfully seeded ${results.length} mythic shader layers!`);
    console.log('\n📋 Available layers:');
    results.forEach(layer => {
      console.log(`  • ${layer.name} (${layer.type}) - ${layer.slug}`);
    });

    console.log('\n🚀 Next steps:');
    console.log('  1. Test the demo at: http://localhost:3000/mythic-layers');
    console.log('  2. Check integration guide: docs/shaders/INTEGRATION_GUIDE.md');
    console.log('  3. Deploy to ReShade/OBS/Unity/etc. using the guide');

  } catch (err) {
    console.error('❌ Error seeding mythic layers:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  seedMythicLayers();
}

module.exports = { seedMythicLayers, MYTHIC_LAYERS };