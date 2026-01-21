import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', (msg) => {
    console.log('BROWSER_CONSOLE:', msg.type(), msg.text());
  });
  page.on('pageerror', (err) => {
    console.error('PAGE_ERROR:', err.stack || err.message || err);
  });

  const url = process.env.BASE_URL || 'http://localhost:3000/?test_user=true&role=supplier';
  console.log('Navigating to', url);
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(2000);

  // Snapshot a few elements
  const navText = await page.locator('nav').innerText().catch(() => null);
  console.log('NAV SNAPSHOT:', navText ? navText.slice(0, 500) : 'nil');

  await browser.close();
})();