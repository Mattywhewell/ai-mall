const fs = require('fs');
const path = require('path');

const IN = path.join(__dirname, 'lint-issue-report.md');
const OUT = path.join(__dirname, 'lint-issue-report-summary.md');

if (!fs.existsSync(IN)) {
  console.error('Input report not found:', IN);
  process.exit(1);
}

// Read file with correct encoding (handle UTF-16LE produced by PowerShell redirects)
const raw = fs.readFileSync(IN);
let text = raw.toString('utf8');
if (raw.includes(0)) {
  // likely UTF-16LE - decode accordingly
  text = raw.toString('utf16le');
}
const content = text.split(/\r?\n/);

let currentFile = null;
const byFolder = {};
const byRule = {};
const bySeverity = { Error: 0, Warning: 0 };
const byFile = {};

for (let i = 0; i < content.length; i++) {
  const lineRaw = content[i];
  const line = lineRaw.trimEnd();
  if (!line) continue;

  // File path lines may be indented; handle that
  const trimmedStart = line.trimStart();
  if (trimmedStart.startsWith('./')) {
    currentFile = trimmedStart.slice(2).trim();
    if (!byFile[currentFile]) byFile[currentFile] = 0;
    continue;
  }

  // Match lines like: 34:9  Warning: 'router' is assigned ...  no-unused-vars
  const m = line.match(/^\s*(\d+:\d+)\s+(Error|Warning):\s+(.*)$/);
  if (m && currentFile) {
    const severity = m[2];
    let message = m[3];

    // Try to extract rule from trailing token separated by two or more spaces
    let rule = null;
    const parts = message.split(/\s{2,}/).map(p => p.trim()).filter(Boolean);
    if (parts.length > 1) {
      rule = parts[parts.length - 1];
      // sanity check: rule should look like a rule identifier
      if (!/^[@\w\-\/]+$/.test(rule)) rule = null;
    }

    // Fallback: try last token on same line
    if (!rule) {
      const lastToken = message.split(/\s+/).pop();
      if (/^[@\w\-\/]+$/.test(lastToken)) rule = lastToken;
    }

    // If rule is on the next line (line containing only the rule id), grab it
    if (!rule && i + 1 < content.length) {
      const nextLine = content[i + 1].trim();
      if (/^[@\w\-\/]+$/.test(nextLine)) {
        rule = nextLine;
        i = i + 1; // consume the rule line
      }
    }

    if (!rule) rule = '(unknown)';

    bySeverity[severity] = (bySeverity[severity] || 0) + 1;
    byRule[rule] = (byRule[rule] || 0) + 1;
    byFile[currentFile] = (byFile[currentFile] || 0) + 1;

    const folder = currentFile.split(path.sep)[0] || '(root)';
    byFolder[folder] = (byFolder[folder] || 0) + 1;
  }
}

function topCounts(obj, n = 10) {
  return Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

const totalErrors = bySeverity.Error || 0;
const totalWarnings = bySeverity.Warning || 0;
const totalIssues = totalErrors + totalWarnings;

let out = [];
out.push('# Lint Issue Report Summary\n');
out.push(`Generated: ${new Date().toISOString()}\n`);
out.push(`Source: scripts/lint-issue-report.md\n`);
out.push(`Total issues (Error + Warning): ${totalIssues}\n`);
out.push(`- Errors: ${totalErrors}\n`);
out.push(`- Warnings: ${totalWarnings}\n`);

out.push('## Top folders (by issue count)\n');
topCounts(byFolder, 20).forEach(([k, v]) => {
  out.push(`- ${k}: ${v}`);
});

out.push('\n## Top rules (by occurrence)\n');
topCounts(byRule, 30).forEach(([k, v]) => {
  out.push(`- ${k}: ${v}`);
});

out.push('\n## Top files (by issue count)\n');
topCounts(byFile, 30).forEach(([k, v]) => {
  out.push(`- ${k}: ${v}`);
});

out.push('\n## Notes & recommended first targets\n');
out.push('- Focus initial cleanup on the top folders above (high volume).');
out.push('- Prioritize fixing `@typescript-eslint/no-explicit-any`, `no-unused-vars`, and `no-undef` occurrences as they are widespread.');
out.push('- Move generated/playwright artifacts to `artifacts/` and add to `.eslintignore` to reduce noise.');
out.push('- Use incremental PRs limited to 1-3 files or one folder at a time.');

fs.writeFileSync(OUT, out.join('\n'));
console.log('Wrote summary to', OUT);
