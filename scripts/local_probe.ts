import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addCookies([{ name: 'test_user', value: JSON.stringify({ role: 'admin' }), url: 'http://localhost:3000' }]);
  await context.setExtraHTTPHeaders({ 'x-e2e-ssr-probe': '1' });
  const page = await context.newPage();
  try {
    const res = await page.goto('http://localhost:3000/?__ssr_probe=1', { waitUntil: 'domcontentloaded' });
    console.log('status:', res?.status());
    const body = await page.content();
    console.log('page content snippet:', body.slice(0, 200));
    // Print cookies
    const cookies = await context.cookies();
    console.log('cookies:', JSON.stringify(cookies));
  } catch (e) {
    console.error('probe error', e);
  } finally {
    await browser.close();
  }
})();