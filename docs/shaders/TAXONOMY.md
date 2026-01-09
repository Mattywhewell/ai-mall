# Shader & Visual Layer Taxonomy for Aiverse 🔮

This document defines naming conventions, metadata schema, authoring guidelines, and QA requirements for shaders, LUTs, masks, and visual layering used in the Aiverse. It is intended to be concise, actionable, and usable by artists, engineers, and reviewers.

---

## Goals 🎯
- Provide a predictable naming taxonomy so visual assets can be discovered and composed reliably.
- Define a minimal metadata schema for runtime application and authoring.
- Provide authoring, testing, and review checklists to maintain quality and performance.
- Make it easy to map layers to districts, citizen archetypes, and rituals.

---

## Top-level categories (types) 🔧
- **elemental** — natural, environmental effects (fog, rain, aurora, auroral mist)
- **architectural** — building/structure-specific treatments (runic glow, etched bloom, stained-glass light)
- **ritual** — UI or scene overlays used in rituals or ceremonies (vignettes, glyph animations)
- **emotional** — color grading or subtle cinematic treatments that convey mood (sorrow, joy, awe)
- **utility** — LUTs, masks, and helper maps used by shader passes

Use these types as the second component of the slug (see Naming Conventions).

---

## Naming conventions (slug format) 🏷️
Canonical slug format: `domain.type.name[.modifier]`
- `domain` — `elemental|architectural|ritual|emotional|util`
- `type` — short semantic group, e.g. `fog`, `bloom`, `glow`, `grade`, `vignette`
- `name` — short descriptive noun (kebab-case)
- `modifier` — optional intensity, size, or style qualifier (`soft|medium|strong|cinematic|runic`)

Examples:
- `elemental.fog.soft`
- `architectural.runic-glow.medium`
- `ritual.vignette.sacral`
- `emotional.color-grade.melancholy`
- `util.lut.dawn-warm` (LUT)

File naming:
- Shader source (GLSL): `{slug}.frag` / `{slug}.vert` (or single fragment with pass name) e.g. `elemental.fog.soft.frag`
- LUT: `lut.{name}.{strength}.3dl|png|cube` e.g. `lut.dawn-warm.1.0.png`
- Mask: `mask.{slug}.png` e.g. `mask.elemental.fog.soft.png`

---

## Metadata schema (visual_layers) — recommended DB fields 📦
Each layer should store a small JSON metadata object (or a DB row) with these fields (suggested names):

- `id` (uuid)
- `name` (string) — human-friendly title
- `slug` (string) — canonical slug per naming conventions
- `type` (enum) — `elemental|architectural|ritual|emotional|util`
- `description` (string)
- `shader_file` (string|null) — path/URL to shader source (frag/vert) or compiled asset
- `lut_file` (string|null) — optional LUT path
- `mask_file` (string|null) — optional mask
- `blend_mode` (string) — `alpha`, `additive`, `screen`, `overlay`, `multiply`, `linear-dodge`
- `default_strength` (float 0.0–1.0)
- `parameters` (JSON) — list of shader parameters (see Parameter Schema below)
- `tags` (string[]) — discoverability (e.g. `['fog','night','observatory']`)
- `preview_image` (string) — small PNG/JPEG preview
- `author` (string)
- `license` (string)
- `version` (semver or `major.minor` style)
- `created_at`, `updated_at`

Example JSON snippet:

```json
{
  "slug": "architectural.runic-glow.medium",
  "name": "Runic Glow (Medium)",
  "type": "architectural",
  "shader_file": "/assets/shaders/architectural.runic-glow.medium.frag",
  "blend_mode": "additive",
  "default_strength": 0.6,
  "parameters": [
    { "name": "glowIntensity", "type": "float", "default": 0.6, "min": 0, "max": 2 },
    { "name": "glowColor", "type": "color", "default": "#FFC87A" }
  ],
  "tags": ["runic","architectural","evening"],
  "preview_image": "/assets/previews/runic-medium.png"
}
```

---

## Shader parameter schema (types) ⚙️
- `float` — numeric (with `min`, `max`) — used for intensities, radii
- `vec2` / `vec3` — numeric arrays
- `color` — hex `#RRGGBB` or vec3
- `sampler2D` / `texture` — references to uploaded textures (masks/noise maps)
- `bool` — on/off
- `enum` — discrete modes (e.g. `mode: 'soft'|'hard'|'ethereal'`)

Parameters should have: `name`, `type`, `default`, optional `min`/`max`, and `ui` hints (slider, color-picker).

---

## Example minimal GLSL fragment pass
This is a guidance snippet (annotated) demonstrating noise based fog + soft runic glow.

```glsl
// elemental.fog.soft.frag (fragment shader, simplified)
precision mediump float;
uniform sampler2D u_scene;
uniform float u_strength; // 0.0 - 1.0
uniform vec3 u_tint; // color tint
uniform vec2 u_resolution;
// small noise helper (glsl-noise usage recommended)

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec4 scene = texture2D(u_scene, uv);
  float n = snoise(vec3(uv * 2.0, u_time * 0.02));
  float fog = smoothstep(0.2, 0.8, n * u_strength + 0.2);
  vec3 color = mix(scene.rgb, u_tint, fog * 0.6);
  gl_FragColor = vec4(color, scene.a);
}
```

Notes: keep shader passes simple and GPU-friendly; avoid loops that depend on large iteration counts; tailor noise frequency & amplitude to parameter ranges.

---

## Blend modes & guidance 🧩
- `alpha` — standard alpha compositing (most masks, UI overlays)
- `additive` — brightening, used for glows/bloom
- `screen` — softer brightening than additive
- `overlay` — contrast-preserving artistic blend
- `multiply` — darkening layer (good for shadow/tonal layers)
- `linear-dodge` — strong brighten (use with care)

Prefer `alpha` or `screen` for general use; additive is great for runic/bloom but should be clamped to avoid HDR blowout without tone mapping.

---

## LUTs, masks, and naming 👁️
- LUTs: `lut.<name>.<version>.png` or `.cube`. Keep multiple strengths as different files (or include `strength` param in metadata).
- Masks: `mask.<slug>.png` (sized to common texture atlas or full-res asset)
- Include a `preview_image` for each asset.

---

## Mapping examples (districts & archetypes) 🌆
- Observatory of Becoming (district): `elemental.fog.soft`, `architectural.runic-glow.medium`, `emotional.color-grade.warm-clarity`
- Mystic Ritual (product / ritual): `ritual.vignette.sacral`, `emotional.color-grade.mystic`
- Seer citizen archetype: `emotional.color-grade.melancholy` + `elemental.aurora.subtle`

Use `lib/ai-city/world-renderer.ts` (or equivalent) to map user preferences and world state into a small ordered list of `visual_layers` to apply at runtime.

---

## Authoring & contribution checklist ✅
Before creating a PR to add a layer or shader, ensure:
- [ ] `slug` follows the canonical pattern and is unique
- [ ] Metadata JSON filled (all required fields)
- [ ] Preview image included (small PNG 400x225 or similar)
- [ ] GLSL shader includes a short header comment with `slug`, `author`, `license`, `version`
- [ ] Shader parameters documented and values sane (min/max)
- [ ] Acceptable performance: keep shader complexity low (avoid large loops, heavy conditionals)
- [ ] Reduced-motion accessibility available (e.g., `u_motion_reduced` boolean/param)
- [ ] Fallback behaviour: if WebGL unavailable, provide CSS fallback or static preview

Reviewer checklist:
- [ ] Confirm visual intent matches design and naming taxonomy
- [ ] Validate performance impact (render timing / frame drops)
- [ ] Confirm a11y reduced-motion support
- [ ] Confirm metadata stored and discoverable in `visual_layers`

---

## Testing & CI suggestions 🧪
- Add a small **Playwright** test `tests/e2e/visual-layers.spec.ts` which loads a demo page and asserts the layer applies (e.g., checks for a specific CSS class, DOM marker, or fallback POST from the renderer when WebGL is disabled).
- Add a small **unit test** that validates layer metadata JSON schema (parameters and types).
- Nightly visual regression snapshot for hero/demo scenes that include key layers.

---

## Matching generation prompts (Midjourney / Framer / V0) 🖼️
Use consistent tokens when generating imagery to match shader layers. Example tokens by domain:

- elemental.fog.soft:
  "cinematic volumetric fog, soft warm backlight, low contrast, subtle grain, studio cinematic lens"
- architectural.runic-glow.medium:
  "mystical runic glyphs carved in stone, subtle amber glow, evening, cinematic rim light, high detail"
- ritual.vignette.sacral:
  "sacral vignette, ritual cloth textures, candlelight, deep shadows, intimate composition"
- emotional.color-grade.melancholy:
  "muted teal and warm amber, filmic color grade, low saturation highlights, soft shadow"

Include these prompt templates in `docs/shaders/README.md` example section and maintain a small library of example outputs in `/public/shader-previews/`.

---

## Performance & safety guidance ⚠️
- Keep single-pass shaders where possible. Prefer small kernel separable filters for blur/bloom approximations.
- Avoid requiring vendor-specific features; prefer standard GLSL and WebGL2-compatible patterns.
- Review uploaded assets for licensing; do not accept third-party assets that conflict with project license.

---

## Versioning & migration
- When changing a shader in a breaking way (parameters rename or semantics change), bump the `version` field and consider `slug` suffix or `slug@v2` usage in metadata for migration clarity.

---

## Where to start (recommended next steps) ▶️
1. Add a small `visual_layers` table migration (example in `supabase-*` migrations).
2. Create a `docs/shaders/README.md` with quick start, authoring tools, and how to test locally.
3. Implement a small PoC React Three Fiber shader pass & demo page (`app/visual-layers/demo`) and e2e test.

---

If you'd like, I can open a PR that adds this file and optionally scaffold the PoC demo + a migration for `visual_layers`. ✨

---

*Document maintained by Aiverse core contributors.*
