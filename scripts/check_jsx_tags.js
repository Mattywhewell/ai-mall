const fs = require('fs');
const path = 'app/admin/dashboard/page.tsx';
const s = fs.readFileSync(path, 'utf8');
let i = 0;
let stack = [];
while (i < s.length) {
  if (s[i] === '<') {
    if (s.slice(i, i + 4) === '<!--') {
      const j = s.indexOf('-->', i + 4);
      i = j + 3;
      continue;
    }
    const isClose = s[i + 1] === '/';
    let j = i + 1;
    while (j < s.length && /[\w:-]/.test(s[j])) j++;
    let tag = s.slice(i + (isClose ? 2 : 1), j).split(/\s/)[0];
    // find the end of the tag
    let gt = s.indexOf('>', i);
    if (gt === -1) { console.log('Unterminated tag starting at', i); process.exit(1); }
    let tagText = s.slice(i, gt + 1);
    const selfClose = tagText.endsWith('/>');
    if (!isClose && !selfClose && tag && /^[A-Za-z]/.test(tag)) {
      stack.push({ tag, idx: i });
    } else if (isClose) {
      let last = stack.pop();
      if (!last || last.tag.toLowerCase() !== tag.toLowerCase()) {
        console.log('Mismatch closing', tag, 'at', i, 'last on stack', last);
        process.exit(1);
      }
    }
    i = gt + 1;
  } else {
    i++;
  }
}
console.log('stack size', stack.length);
if (stack.length>0) console.log('stack dump:', stack.map(s=>({tag:s.tag, line: s.idx})));
