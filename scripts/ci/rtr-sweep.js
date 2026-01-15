#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', 'ci-artifacts');
const RUN = process.argv[2] || 'run-local-ci-prefetch';
const TRACE_DIR = path.join(ROOT, RUN, 'trace-extracted');

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const items = fs.readdirSync(dir);
  for (const it of items) {
    const full = path.join(dir, it);
    try {
      const st = fs.statSync(full);
      if (st.isDirectory()) out.push(...walk(full));
      else out.push(full);
    } catch (e) {}
  }
  return out;
}

function sniffFile(file) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  const matches = [];
  lines.forEach((l, i) => {
    if (/ci_prefetch_id/i.test(l)) matches.push({ file, line: i + 1, text: l.trim(), type: 'ci_prefetch_id' });
    if (/x-ci-prefetch-id/i.test(l)) matches.push({ file, line: i + 1, text: l.trim(), type: 'x-ci-prefetch-id' });
    if (/\[CI-RTR\]|CI-RTR/i.test(l)) matches.push({ file, line: i + 1, text: l.trim(), type: 'ci-rtr' });
    if (/\b(prefetch|prefetched|prefetches)\b/i.test(l)) matches.push({ file, line: i + 1, text: l.trim(), type: 'prefetch' });
    if (/\b(abort|aborted|canceled|cancelled)\b/i.test(l)) matches.push({ file, line: i + 1, text: l.trim(), type: 'abort' });
  });
  return matches;
}

function run() {
  console.log('Running minimal rtr-sweep against', TRACE_DIR);
  if (!fs.existsSync(TRACE_DIR)) {
    console.error('Trace dir not found:', TRACE_DIR);
    process.exit(1);
  }

  const files = walk(TRACE_DIR);
  const allMatches = [];
  for (const f of files) {
    // only scan text-like files to avoid binary noise
    const ext = path.extname(f).toLowerCase();
    if (['.trace', '.network', '.json', '.txt', '.log', '.md', '.html', '.js'].includes(ext) || path.basename(f).startsWith('page@') || path.basename(f).startsWith('resources')) {
      try {
        const m = sniffFile(f);
        allMatches.push(...m);
      } catch (e) {
        // ignore
      }
    }
  }

  const totals = {};
  for (const m of allMatches) totals[m.type] = (totals[m.type] || 0) + 1;

  const out = {
    run: RUN,
    traceDir: TRACE_DIR,
    totals,
    samples: allMatches.slice(0, 200),
    scannedFiles: files.length,
    scannedAt: new Date().toISOString(),
  };

  const outPath = path.join(ROOT, 'ci-rtr-sweep.json');
  try {
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
    console.log('Wrote sweep results to', outPath);
  } catch (e) {
    console.error('Failed to write output', e);
  }

  console.log('Summary:', out.totals);
  if ((out.totals['ci_prefetch_id'] || 0) + (out.totals['x-ci-prefetch-id'] || 0) + (out.totals['ci-rtr'] || 0) === 0) {
    console.log('No ci-prefetch markers found in trace (expected for this homepage trace).');
  } else {
    console.log('Found sample matches:');
    console.log(out.samples.slice(0, 10));
  }
}

run();
