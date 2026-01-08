Citizen portraits directory

This folder contains placeholder SVG portraits and guidance for generating high-resolution images for the Aiverse homepage.

Files:
- `citizen-1.svg` .. `citizen-6.svg` — stylized SVG placeholders for each citizen archetype.
- `hires/` — suggested destination for generated high-resolution PNG/WebP portraits.

How to regenerate:
1. Provide an API key for your chosen image service (e.g., `REPLICATE_API_TOKEN` or local model).
2. Use `scripts/generate_citizens.sh` to batch-generate assets from `design/citizen-prompts.md`.
3. Review outputs, pick preferred variations, and place final PNG/WebP files in `public/citizens/hires/` with filenames `citizen-1@2x.png`, etc.

Recommended sizes:
- Web preview: 400×533 (3:4)
- High-res export: 1600×2133 (3:4)

Accessibility:
- Use descriptive `alt` text matching citizen archetypes in markup.

Variants and WebP conversion:

- To produce stylistic variants (illustrated, painterly, isometric), append modifiers from `design/citizen-variants.md` to the base prompts and run `scripts/generate_variants.sh`.
- After generating PNGs, convert them to WebP for faster delivery using the Node converter:

	```bash
	npm install sharp
	node scripts/convert_to_webp.js
	```

- Output layout suggestions:
	- `public/citizens/hires/` — canonical high-res PNGs
	- `public/citizens/variants/<style>/` — per-style PNGs and their WebP counterparts

Notes:
- The conversion script uses `sharp`; you can also use `cwebp` or ImageMagick as an alternative.
