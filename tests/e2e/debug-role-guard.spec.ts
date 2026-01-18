import { test } from '@playwright/test';

test('debug role guard on admin page', async ({ page }) => {
  await page.goto('/admin/dashboard?test_user=true&role=citizen', { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  const debug = await page.$eval('[data-testid="role-guard-debug"]', el => (el && (el as HTMLElement).innerText) || null).catch(() => null);
  console.log('ROLE_GUARD_DEBUG:', debug);
  const body = await page.evaluate(() => document.body.innerText);
  console.log('BODY_TEXT_SNIPPET:', body.slice(0, 500));
});
