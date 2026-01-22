const fs=require('fs');
const lines=fs.readFileSync('tests/e2e/helpers.ts','utf8').split('\n');
const pattern='if (cookieSet && (process.env.CI';
let start=-1;for(let i=0;i<lines.length;i++){if(lines[i].includes(pattern)){start=i;break}}
if(start===-1){console.log('pattern not found');process.exit(1)}
console.log('start line',start+1,lines[start].trim());
let depth=0; const idx = lines[start].indexOf('{');
for(const ch of lines[start].slice(idx)) { if(ch==='{') depth++; else if(ch==='}') depth--; }
for(let i=start+1;i<lines.length;i++){
  const line=lines[i];
  for(const ch of line){ if(ch==='{') depth++; else if(ch==='}') depth--; }
  if(depth===0){ console.log('closing brace at line', i+1, '->', line.trim()); break }
}
console.log('done');
