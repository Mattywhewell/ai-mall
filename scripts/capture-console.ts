import { chromium } from 'playwright';

(async () => {
  const url = process.argv[2] || 'https://ai-mall.vercel.app/city';
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', (msg) => {
    console.log(`[console:${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    console.error('[pageerror]', err.message, err.stack);
  });
  page.on('response', (res) => {
    if (res.status() >= 400) {
      console.log(`[response:${res.status()}] ${res.url()}`);
    }
  });

  try {
    console.log('Navigating to', url);
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    // wait a bit for client-side lifecycle
    await page.waitForTimeout(3000);
    console.log('Done');
  } catch (e) {
    console.error('Navigation error:', e.message);
  } finally {
    await browser.close();
  }
})();