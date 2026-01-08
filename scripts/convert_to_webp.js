#!/usr/bin/env node
// Converts PNG images under public/citizens/(hires|variants) to WebP using sharp
// Usage: node scripts/convert_to_webp.js
// Requires: npm install sharp

const fs = require('fs');
const path = require('path');

async function convertDir(dir) {
  const sharp = require('sharp');
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter((f) => f.match(/\.png$/i));
  for (const file of files) {
    const full = path.join(dir, file);
    const out = path.join(dir, file.replace(/\.png$/i, '.webp'));
    try {
      await sharp(full).webp({ quality: 84 }).toFile(out);
      console.log('Converted', full, '->', out);
    } catch (err) {
      console.error('Failed to convert', full, err.message);
    }
  }
}

(async () => {
  const root = path.join(__dirname, '..', 'public', 'citizens');
  await convertDir(path.join(root, 'hires'));
  // variants/* directories
  if (fs.existsSync(path.join(root, 'variants'))) {
    const styles = fs.readdirSync(path.join(root, 'variants'));
    for (const s of styles) {
      await convertDir(path.join(root, 'variants', s));
    }
  }
  console.log('All done.');
})();
