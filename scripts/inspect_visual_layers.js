const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  // Add init script to emulate no WebGL
  await context.addInitScript(() => {
    // @ts-ignore
    window.WebGLRenderingContext = undefined;
    const proto = HTMLCanvasElement.prototype;
    const origGet = proto.getContext;
    proto.getContext = function() { return null; };
    (window).__origGetContext = origGet;
  });
  const page = await context.newPage();
  page.on('console', msg => console.log('[PAGE]', msg.text()));
  await page.goto('http://localhost:3000/visual-layers/demo', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const hasImg = await page.$('img[alt="Runic glow preview"]') !== null;
  const canvasCount = await page.$$eval('canvas', (c) => c.length);
  const ctx = await page.evaluate(() => {
    const c = document.createElement('canvas');
    return { webgl: !!(c.getContext('webgl') || c.getContext('webgl2')), origRestored: !!(window.__origGetContext) };
  });
  console.log('hasImg', hasImg, 'canvasCount', canvasCount, 'getContext test', ctx);
  await page.screenshot({ path: 'tmp/visual-layers.png', fullPage: true });
  await browser.close();
})();