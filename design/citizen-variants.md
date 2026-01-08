# Citizen Variant Prompts

This document lists style modifiers and example prompts to generate alternative stylistic variations for the six citizen portraits. Use these modifiers appended to the base prompts in `design/citizen-prompts.md`.

Suggested styles:

1. Illustrated — crisp linework, flat colors, graphic shading
   - Modifier example: "illustrated, clean vector linework, flat color planes, subtle grain, high contrast, graphic poster style"
2. Painterly — oil or watercolor texture, visible brush strokes
   - Modifier example: "painterly, oil painting, visible brush strokes, warm palette, soft edges, canvas texture"
3. Isometric / Iconic — simplified features, geometric composition
   - Modifier example: "isometric, geometric, simplified shapes, soft shadows, minimal texture, vector-friendly"
4. Ethereal Bokeh — dreamy lighting and soft focus, glowing particles
   - Modifier example: "dreamy, bokeh highlights, soft-focus, glowing particles, pastel palette, cinematic"
5. Low-Poly 3D — stylized 3D render with polygonal shading
   - Modifier example: "low-poly 3D render, subtle AO, rim lighting, stylized materials, filmic tone mapping"

Usage:
- Append one of the modifier lines to each base prompt in `design/citizen-prompts.md` to produce a stylistic variant. For example:

  "<base prompt> + illustrated, clean vector linework, flat color planes, subtle grain"

- Export naming convention: `citizen-<n>--<style>.png` (e.g., `citizen-1--illustrated.png`).
- Place final outputs under `public/citizens/variants/<style>/` and generate WebP versions using the converter script.
