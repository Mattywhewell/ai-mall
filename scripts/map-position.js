const fs = require('fs');
const { SourceMapConsumer } = require('source-map');

async function mapPosition(mapPath, line, column) {
  const raw = fs.readFileSync(mapPath, 'utf8');
  const map = JSON.parse(raw);
  const consumer = await new SourceMapConsumer(map);
  const pos = consumer.originalPositionFor({ line, column });
  console.log('Mapped position:', pos);
  if (pos.source && map.sourcesContent) {
    const idx = map.sources.indexOf(pos.source);
    if (idx !== -1 && map.sourcesContent && map.sourcesContent[idx]) {
      const src = map.sourcesContent[idx];
      const srcLines = src.split('\n');
      const ctxStart = Math.max(0, (pos.line || 0) - 3);
      const ctxEnd = Math.min(srcLines.length, (pos.line || 0) + 2);
      console.log('\nContext from original source:');
      for (let i = ctxStart; i < ctxEnd; i++) {
        console.log(`${i + 1}: ${srcLines[i]}`);
      }
    }
  }
  consumer.destroy();
}

// usage: node scripts/map-position.js <mapfile> <line> <column>
(async () => {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error('Usage: node map-position.js <mapfile> <line> <column>');
    process.exit(1);
  }
  const [mapfile, lineStr, colStr] = args;
  const line = parseInt(lineStr, 10);
  const column = parseInt(colStr, 10);
  await mapPosition(mapfile, line, column);
})();