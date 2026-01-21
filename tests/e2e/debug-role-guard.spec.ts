import { test } from '@playwright/test';
import { ensureTestUser } from './helpers';

test('debug role guard on admin page', async ({ page }) => {
  // Ensure deterministic test_user cookie and SSR marker
  await ensureTestUser(page, 'citizen');

  await page.goto('/admin/dashboard', { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  const debug = await page.$eval('[data-testid="role-guard-debug"]', el => (el && (el as HTMLElement).innerText) || null).catch(() => null);
  console.log('ROLE_GUARD_DEBUG:', debug);
  const body = await page.evaluate(() => document.body.innerText);
  console.log('BODY_TEXT_SNIPPET:', body.slice(0, 500));
});
