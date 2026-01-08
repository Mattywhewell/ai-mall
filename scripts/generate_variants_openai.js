#!/usr/bin/env node
// generate_variants_openai.js
// Reads base prompts from design/citizen-prompts.md and generates stylistic variants
// using OpenAI Images API (gpt-image-1). Outputs to public/citizens/variants/<style>/

const fs = require('fs');
const path = require('path');
const fetch = global.fetch || require('node-fetch');

const ROOT = path.join(__dirname, '..');
const PROMPTS_FILE = path.join(ROOT, 'design', 'citizen-prompts.md');
const OUT_BASE = path.join(ROOT, 'public', 'citizens', 'variants');

const styles = process.env.VARIANT_STYLES ? process.env.VARIANT_STYLES.split(',') : ['illustrated','painterly','isometric'];
const width = process.env.IMG_WIDTH || 1600;
const height = process.env.IMG_HEIGHT || 2133;

const modifiers = {
  illustrated: 'illustrated, clean vector linework, flat color planes, subtle grain, high contrast, graphic poster style',
  painterly: 'painterly, oil painting, visible brush strokes, warm palette, soft edges, canvas texture',
  isometric: 'isometric, geometric, simplified shapes, soft shadows, minimal texture, vector-friendly'
};

async function main() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    console.error('OPENAI_API_KEY not set in environment. Set it and rerun.');
    process.exit(1);
  }

  if (!fs.existsSync(PROMPTS_FILE)) {
    console.error('Prompts file not found:', PROMPTS_FILE);
    process.exit(1);
  }

  const md = fs.readFileSync(PROMPTS_FILE, 'utf8');
  // Split blocks by '\n---\n'
  const blocks = md.split(/^---$/m).map(s => s.trim()).filter(Boolean);
  const basePrompts = [];

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim());
    const pIndex = lines.findIndex(l => l.toLowerCase().startsWith('prompt:'));
    if (pIndex >= 0 && lines[pIndex+1]) {
      // prompt line may be quoted
      let promptLine = lines[pIndex+1];
      // remove starting/ending quotes if present
      promptLine = promptLine.replace(/^\"|\"$/g, '').trim();
      basePrompts.push(promptLine);
    }
  }

  if (basePrompts.length === 0) {
    console.error('No prompts parsed from', PROMPTS_FILE);
    process.exit(1);
  }

  for (let i = 0; i < basePrompts.length; i++) {
    const base = basePrompts[i];
    const idx = i+1;
    for (const style of styles) {
      const mod = modifiers[style] || style;
      const prompt = `${base} + ${mod}`;
      const outDir = path.join(OUT_BASE, style);
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      const outPath = path.join(outDir, `citizen-${idx}--${style}.png`);

      console.log(`Generating citizen-${idx} -- ${style} -> ${outPath}`);

      try {
        const res = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-image-1',
            prompt: prompt,
            size: `${width}x${height}`
          })
        });

        if (!res.ok) {
          const body = await res.text();
          console.error('OpenAI API error', res.status, body);
          continue;
        }

        const data = await res.json();
        if (!data || !data.data || !data.data[0] || !data.data[0].b64_json) {
          console.error('Unexpected API response', JSON.stringify(data));
          continue;
        }

        const b64 = data.data[0].b64_json;
        const buf = Buffer.from(b64, 'base64');
        fs.writeFileSync(outPath, buf);
        console.log('Saved', outPath);
      } catch (err) {
        console.error('Failed to generate:', err.message || err);
      }

      // small delay to avoid burst
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log('All generation done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
