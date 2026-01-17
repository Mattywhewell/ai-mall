const fs = require('fs');
const path = 'app/admin/dashboard/page.tsx';
const s = fs.readFileSync(path, 'utf8');
let i = 0;
let stack = [];
let mismatches = [];
while (i < s.length) {
  if (s[i] === '<') {
    if (s.slice(i, i + 4) === '<!--') {
      const j = s.indexOf('-->', i + 4);
      i = j + 3;
      continue;
    }
    const isClose = s[i + 1] === '/';
    let j = i + 1;
    while (j < s.length && /[\w:\-\s]/.test(s[j])) j++;
    let tag = s.slice(i + (isClose ? 2 : 1), j).split(/\s/)[0];
    let gt = s.indexOf('>', i);
    if (gt === -1) { mismatches.push({type: 'unterminated', idx: i}); break; }
    let tagText = s.slice(i, gt + 1);
    const selfClose = tagText.endsWith('/>');
    if (!isClose && !selfClose && tag && /^[A-Za-z]/.test(tag)) {
      stack.push({ tag, idx: i });
    } else if (isClose) {
      let last = stack.pop();
      if (!last || last.tag.toLowerCase() !== tag.toLowerCase()) {
        mismatches.push({ type: 'mismatch', tag, idx: i, last });
      }
    }
    i = gt + 1;
  } else {
    i++;
  }
}
console.log('mismatches', mismatches);
console.log('stack size', stack.length);
console.log('stack dump (last 10):', stack.slice(-10));
