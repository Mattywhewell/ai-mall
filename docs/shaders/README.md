# Shaders & Visual Layers — Quick Start 🚀

This folder contains the canonical `TAXONOMY.md` reference that defines naming conventions, metadata, and authoring guidelines for shaders, LUTs, and visual layer assets used across the Aiverse.

Quick links:
- TAXONOMY: `docs/shaders/TAXONOMY.md` — canonical taxonomy, parameter schema, GLSL guidance, and contributor checklist.

How to contribute a layer (short):
1. Follow the slug format and metadata schema in `TAXONOMY.md`.
2. Add shader source to `/assets/shaders/` and a small preview to `/public/shader-previews/`.
3. Add or update `visual_layers` metadata (we will add DB migrations and API endpoints in follow-ups).
4. Open a PR with: description, preview screenshots, parameter list, and performance notes.

Local testing tips:
- Use WebGL-compatible browsers (Chrome/Edge) with hardware acceleration enabled for authoring and testing.
- For quick previews, a simple local Three.js/fragment shader runner is sufficient; we plan to add a PoC demo page under `app/visual-layers/demo`.

Accessibility & performance:
- Provide a reduced-motion param and a CSS fallback for non-WebGL environments.
- Keep shaders simple (avoid large loops) and document expected frame cost.

Thanks — follow `CONTRIBUTING.md` for PR and review guidance. If you want, I can also scaffold the PoC demo and an e2e test next.