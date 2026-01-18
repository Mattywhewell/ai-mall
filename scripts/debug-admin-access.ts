import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    try { console.log('[PAGE CONSOLE]', msg.type(), msg.text()); } catch (e) {}
  });
  page.on('pageerror', err => console.error('[PAGE ERROR]', err.message));

  const url = 'http://localhost:3000/admin/dashboard?test_user=true&role=citizen';
  console.log('Navigating to', url);
  await page.goto(url, { waitUntil: 'networkidle' });
  console.log('Current URL:', page.url());

  const body = await page.content();
  console.log('Body snapshot (first 4000 chars):\n', body.slice(0, 4000));

  const hasAccessRestricted = await page.locator('text=Access Restricted').count();
  const hasAccessDenied = await page.locator('text=Access Denied').count();
  const adminHeading = await page.locator('text=Aiverse Admin').count();
  console.log('Access Restricted count:', hasAccessRestricted);
  console.log('Access Denied count:', hasAccessDenied);
  console.log('Admin heading count:', adminHeading);

  await browser.close();
})();