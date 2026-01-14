const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..', 'ci-artifacts');
const processed = new Set();

function isTraceDir(dir) {
  try {
    const files = fs.readdirSync(dir);
    if (files.includes('0-trace.trace') || files.includes('0-trace.network')) return true;
    const res = path.join(dir, 'resources');
    return fs.existsSync(res) && fs.readdirSync(res).length>0;
  } catch (e) { return false; }
}

function runSweep() {
  console.log('Running rtr-sweep.js...');
  const res = spawnSync(process.execPath, [path.join(__dirname, 'rtr-sweep.js')], { stdio: 'inherit' });
  if (res.error) console.error('sweep failed', res.error);
  else console.log('sweep finished');
}

if (!fs.existsSync(ROOT)) {
  console.error('ci-artifacts directory does not exist. Create it and extract traces inside it.');
  process.exit(1);
}

console.log('Watching', ROOT, 'for new trace directories...');
// Seed processed with existing trace dirs
const existing = fs.readdirSync(ROOT);
for (const name of existing) {
  const full = path.join(ROOT, name);
  try {
    if (fs.statSync(full).isDirectory() && isTraceDir(full)) {
      processed.add(full);
    }
  } catch (e) {}
}

fs.watch(ROOT, { recursive: true }, (eventType, filename) => {
  if (!filename) return;
  const top = filename.split(/[\\/]/)[0];
  const full = path.join(ROOT, top);
  if (!fs.existsSync(full)) return;
  try {
    if (!fs.statSync(full).isDirectory()) return;
  } catch (e) { return; }
  if (processed.has(full)) return;
  if (isTraceDir(full)) {
    console.log('Detected new trace directory:', full);
    processed.add(full);
    runSweep();
  }
});
