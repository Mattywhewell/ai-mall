const fs = require('fs');
const lines = fs.readFileSync('tests/e2e/helpers.ts', 'utf8').split('\n');
let depth = 0;
const checkpoints = [1,23,179,330,360,361,362,370,408];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (const ch of line) {
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
  }
  const ln = i + 1;
  if (checkpoints.includes(ln)) console.log('line', ln, 'depth', depth, '->', line.trim());
}
console.log('final depth', depth);
