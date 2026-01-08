Aiverse Design Tokens & Usage

This folder contains the source `tokens.json` for the Aiverse design system and usage notes for engineering and design handoff.

Files
- `tokens.json` — canonical design tokens (colors, spacing, typography, motion, shadows).
- `icons/` — SVG icons and starters (district iconography).

Quick usage

1) Figma
- Use the Figma Tokens plugin to import `tokens.json` into your Figma file. Map tokens to color styles, typography styles, and effect styles.
- Keep token names as intent-driven keys (e.g. `bgViewport`, `accentPrimary`) so they map to variables in code easily.

2) Generating CSS variables (example)

You can convert `tokens.json` to CSS variables with a small script or with Figma Tokens exports. Example CSS snippet:

```css
:root{
  --color-bg-viewport: #0A0F1F;
  --color-accent-primary: #00E5FF;
  --space-lg: 40px;
  --font-h1: 64px;
}
```

3) Runtime usage
- Prefer CSS variables for theming and runtime overrides. Provide a `reducedMotion` theme flag to toggle motion tokens.
- Use `--color-glow-strong` (rgba) for hover halos and `--shadow-cta` for CTA elevation.

4) Export guidance
- Tokens with references use the `{colors.brand.midnight}` pattern in `tokens.json`. When exporting or transforming, resolve references to concrete hex values.
- For Figma export, provide both color and opacity layers (glow as separate effect) so engineers can implement using `box-shadow` and `filter: blur()` patterns.

5) Accessibility
- Ensure `textPrimary` on `bgViewport` meets WCAG contrast (4.5:1). For lighter accent text, provide a high-contrast variant.

6) Icon & Asset naming
- Place SVG source files in `public/icons/` and name them `district-<slug>.svg`, e.g. `district-memory-bazaar.svg`.
- Provide layers/IDs in the SVG: `base`, `braid`, `glow` for easy animation targeting.

7) Example dev commands

Install dependencies and convert tokens (example using `figma-tokens` CLI if used):

```bash
npm ci
npx figma-tokens transform --input design/tokens.json --output src/styles/tokens.css --format css
```

(If you don't use `figma-tokens`, store `tokens.json` and write a short script that emits CSS variables.)

Contact
- For questions about naming or export behavior, ping the design lead in the PR and attach the Figma file reference.
