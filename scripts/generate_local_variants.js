#!/usr/bin/env node
// generate_local_variants.js
// Create illustrative/painterly/isometric SVG variants from existing SVG placeholders
// and render them to PNG and WebP using sharp.

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'public', 'citizens');
const OUT_BASE = path.join(SRC_DIR, 'variants');
const styles = ['illustrated', 'painterly', 'isometric'];
const sizes = [{ name: 'hires', w: 1600, h: 2133 }, { name: 'preview', w: 400, h: 533 }];

if (!fs.existsSync(SRC_DIR)) {
  console.error('Source dir not found:', SRC_DIR);
  process.exit(1);
}

const files = fs.readdirSync(SRC_DIR).filter(f => f.match(/^citizen-[0-9]+\.svg$/));
if (files.length === 0) {
  console.error('No citizen-*.svg files found in', SRC_DIR);
  process.exit(1);
}

function makeIllustrated(svg) {
  // Add a bold stroke to the main circle without breaking existing tags
  return svg.replace(/<circle([^>]*)r="200"([^>]*)\/?>(?:<\/circle>)?/, (match, p1, p2) => {
    // If stroke already present, keep as-is
    if (/stroke=/.test(match)) return match;
    // Handle self-closing '/>' vs '>'
    if (match.endsWith('/>')) {
      return match.replace(/\/>$/, ` stroke=\"#1f1f1f\" stroke-width=\"12\" />`);
    }
    return match.replace(/>$/, ` stroke=\"#1f1f1f\" stroke-width=\"12\">`);
  }).replace(/stop-color="#[0-9A-Fa-f]+"/g, (m) => m.replace('#', '#'));
}

function makePainterly(svg) {
  // add a subtle paper texture filter + soften edges
  const filter = `\n<defs>\n  <filter id="painterly">\n    <feTurbulence baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="t"/>\n    <feColorMatrix type="saturate" values="0.8"/>\n    <feBlend in="SourceGraphic" in2="t" mode="overlay" opacity="0.12"/>\n  </filter>\n</defs>\n`;
  return svg.replace(/<svg([^>]*)>/, (m) => m + filter).replace(/<g transform="translate\([0-9, ]+\)">/, '<g filter="url(#painterly)" transform="translate(150,120)">');
}

function makeIsometric(svg) {
  // apply a skew to create an isometric feel and reduce details
  return svg.replace(/<g transform="translate\(150,120\)">/, '<g transform="skewX(-12) translate(150,120)">')
            .replace(/<rect[^>]*>/g, match => match.replace('fill', 'fill-opacity="0.95" fill'));
}

(async () => {
  for (const style of styles) {
    const outDir = path.join(OUT_BASE, style);
    fs.mkdirSync(outDir, { recursive: true });

    for (const file of files) {
      const idxMatch = file.match(/citizen-([0-9]+)\.svg/);
      if (!idxMatch) continue;
      const idx = idxMatch[1];
      const srcPath = path.join(SRC_DIR, file);
      const svg = fs.readFileSync(srcPath, 'utf8');

      let variantSvg = svg;
      if (style === 'illustrated') variantSvg = makeIllustrated(svg);
      if (style === 'painterly') variantSvg = makePainterly(svg);
      if (style === 'isometric') variantSvg = makeIsometric(svg);

      const outSvgPath = path.join(outDir, `citizen-${idx}--${style}.svg`);
      fs.writeFileSync(outSvgPath, variantSvg);
      console.log('Wrote', outSvgPath);

      // Render PNG and WebP for each size
      for (const s of sizes) {
        const outDirSize = path.join(outDir, s.name);
        fs.mkdirSync(outDirSize, { recursive: true });
        const pngPath = path.join(outDirSize, `citizen-${idx}--${style}.png`);
        const webpPath = path.join(outDirSize, `citizen-${idx}--${style}.webp`);

        try {
          await sharp(Buffer.from(variantSvg))
            .resize(s.w, s.h, { fit: 'cover' })
            .png({ quality: 90 })
            .toFile(pngPath);
          await sharp(pngPath).webp({ quality: 84 }).toFile(webpPath);
          console.log('Rendered', pngPath, 'and', webpPath);
        } catch (err) {
          console.error('Render failed for', outSvgPath, err.message || err);
        }
      }
    }
  }
  console.log('Local variant generation complete.');
})();
