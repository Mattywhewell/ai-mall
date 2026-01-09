-- Migration: Create visual_layers table

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
