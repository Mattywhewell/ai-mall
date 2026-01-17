const fs = require('fs');
const parser = require('@babel/parser');
const code = fs.readFileSync('app/admin/dashboard/page.tsx','utf8');
try{
  parser.parse(code, {sourceType:'module', plugins:['typescript','jsx']});
  console.log('Parsed successfully');
}catch(e){
  console.error('Parse Error:', e.message);
  console.error('Location:', e.loc);
  console.error('Code Snippet:');
  const lines = code.split('\n');
  const line = e.loc && e.loc.line ? e.loc.line : null;
  const start = Math.max(1,(line||1)-5);
  const end = Math.min(lines.length,(line||1)+5);
  for(let i=start;i<=end;i++){
    console.error(i+': '+lines[i-1]);
  }
}
